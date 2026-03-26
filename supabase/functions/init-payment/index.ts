import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan } = await req.json();
    if (!plan || !["student", "premium"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = plan === "student" ? 199 : 399;
    const tranId = `ADMIAI_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Save pending payment
    await supabase.from("payments").insert({
      user_id: user.id,
      tran_id: tranId,
      plan,
      amount,
      status: "pending",
    });

    const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID")!;
    const storePass = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD")!;

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "https://admissionai.lovable.app";

    const params = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePass,
      total_amount: amount.toString(),
      currency: "BDT",
      tran_id: tranId,
      success_url: `${supabaseUrl}/functions/v1/payment-callback`,
      fail_url: `${supabaseUrl}/functions/v1/payment-callback`,
      cancel_url: `${supabaseUrl}/functions/v1/payment-callback`,
      ipn_url: `${supabaseUrl}/functions/v1/payment-callback`,
      cus_name: user.user_metadata?.name || user.email || "Customer",
      cus_email: user.email || "customer@example.com",
      cus_phone: "01700000000",
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      shipping_method: "NO",
      product_name: `AdmissionAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
      product_category: "Education",
      product_profile: "non-physical-goods",
      value_a: user.id,
      value_b: plan,
      value_c: origin,
    });

    const sslRes = await fetch(
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    const sslData = await sslRes.json();

    if (sslData.status === "SUCCESS" && sslData.GatewayPageURL) {
      return new Response(
        JSON.stringify({ url: sslData.GatewayPageURL }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.error("SSLCommerz error:", sslData);
    return new Response(
      JSON.stringify({ error: "Payment gateway error", details: sslData.failedreason }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Init payment error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
