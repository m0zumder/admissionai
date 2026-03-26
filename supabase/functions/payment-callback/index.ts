import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SSLCommerz sends POST with form data
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const tranId = data.tran_id;
    const status = data.status; // VALID, FAILED, CANCELLED
    const valId = data.val_id;
    const userId = data.value_a;
    const plan = data.value_b;
    const origin = data.value_c || "https://admissionai.lovable.app";

    if (!tranId) {
      return new Response("Missing tran_id", { status: 400 });
    }

    if (status === "VALID" || status === "VALIDATED") {
      // Validate with SSLCommerz
      const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID")!;
      const storePass = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD")!;

      const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePass}&format=json`;
      const valRes = await fetch(validationUrl);
      const valData = await valRes.json();

      if (valData.status === "VALID" || valData.status === "VALIDATED") {
        // Update payment record
        await supabase.from("payments").update({
          status: "completed",
          payment_method: data.card_type || data.card_brand || "unknown",
          card_type: data.card_type,
          bank_tran_id: data.bank_tran_id,
          val_id: valId,
          updated_at: new Date().toISOString(),
        }).eq("tran_id", tranId);

        // Upgrade user's subscription plan
        if (userId && plan) {
          await supabase.from("profiles").update({
            subscription_plan: plan,
          }).eq("id", userId);
        }

        // Redirect to success page
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${origin}/payment-success?tran_id=${tranId}&plan=${plan}`,
          },
        });
      }
    }

    // Failed or cancelled
    const failStatus = status === "CANCELLED" ? "cancelled" : "failed";
    await supabase.from("payments").update({
      status: failStatus,
      updated_at: new Date().toISOString(),
    }).eq("tran_id", tranId);

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${origin}/payment-fail?tran_id=${tranId}&reason=${failStatus}`,
      },
    });
  } catch (err) {
    console.error("Payment callback error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
