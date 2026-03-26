import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, level, classLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const levelMap: Record<string, string> = {
      easy: "ক্লাস ৬-৮ এর শিক্ষার্থীর জন্য একদম সহজ ভাষায়",
      medium: "ক্লাস ৯-১০ এর শিক্ষার্থীর জন্য মাঝারি মানের",
      detailed: "HSC/ভর্তি পরীক্ষার শিক্ষার্থীর জন্য বিস্তারিত",
    };

    const systemPrompt = `তুমি বাংলাদেশের একজন অভিজ্ঞ শিক্ষক। তোমার কাজ হলো ${classLevel} পর্যায়ের শিক্ষার্থীদের যেকোনো বিষয় সহজ বাংলায় বোঝানো।
নিয়ম:
১. সবসময় সহজ, স্পষ্ট বাংলায় লেখো
২. বাস্তব জীবনের উদাহরণ দিয়ে বোঝাও
৩. NCTB পাঠ্যক্রমের সাথে মিল রেখে explain করো
৪. কঠিন শব্দ এলে সাথে সাথে বাংলায় মানে বলো
৫. শেষে ২-৩টি গুরুত্বপূর্ণ point summary করো
৬. শিক্ষার্থীকে encourage করো`;

    const userMessage = `${levelMap[level] || levelMap.medium} ব্যাখ্যা দাও: ${topic}`;

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
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explain-topic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
