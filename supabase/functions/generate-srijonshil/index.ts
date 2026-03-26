import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, uddipok } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `তুমি বাংলাদেশের HSC পরীক্ষার সৃজনশীল প্রশ্নের উত্তর লেখার বিশেষজ্ঞ।
NCTB HSC পাঠ্যক্রম অনুযায়ী উত্তর তৈরি করো।
সৃজনশীল উত্তরের structure:
- ক) জ্ঞান: সরাসরি এক/দুই লাইনে তথ্য
- খ) অনুধাবন: ধারণাটি নিজের ভাষায় ব্যাখ্যা, উদ্দীপকের সাথে সংযোগ
- গ) প্রয়োগ: উদ্দীপকের ঘটনা পাঠ্যপুস্তকের তত্ত্বের আলোকে বিশ্লেষণ
- ঘ) উচ্চতর দক্ষতা: গভীর বিশ্লেষণ, দুটি দিক থেকে মতামত, নিজস্ব মন্তব্য
শুধু বাংলায় লেখো। Board পরীক্ষার ভাষা ও style follow করো।`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `বিষয়: ${subject}\nউদ্দীপক: ${uddipok}\n\nসৃজনশীল উত্তর তৈরি করো।` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_srijonshil_answer",
            description: "Return structured creative answer",
            parameters: {
              type: "object",
              properties: {
                ka: { type: "string", description: "জ্ঞান (Knowledge) answer" },
                kha: { type: "string", description: "অনুধাবন (Comprehension) answer" },
                ga: { type: "string", description: "প্রয়োগ (Application) answer" },
                gha: { type: "string", description: "উচ্চতর দক্ষতা (Higher Order) answer" },
              },
              required: ["ka", "kha", "ga", "gha"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_srijonshil_answer" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No tool call in response");
  } catch (e) {
    console.error("generate-srijonshil error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
