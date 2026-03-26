import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, uddipok } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

    const systemPrompt = `তুমি বাংলাদেশের HSC পরীক্ষার সৃজনশীল প্রশ্নের উত্তর লেখার বিশেষজ্ঞ।
NCTB HSC পাঠ্যক্রম অনুযায়ী উত্তর তৈরি করো।
সৃজনশীল উত্তরের structure:
- ক) জ্ঞান: সরাসরি এক/দুই লাইনে তথ্য
- খ) অনুধাবন: ধারণাটি নিজের ভাষায় ব্যাখ্যা, উদ্দীপকের সাথে সংযোগ
- গ) প্রয়োগ: উদ্দীপকের ঘটনা পাঠ্যপুস্তকের তত্ত্বের আলোকে বিশ্লেষণ
- ঘ) উচ্চতর দক্ষতা: গভীর বিশ্লেষণ, দুটি দিক থেকে মতামত, নিজস্ব মন্তব্য
শুধু বাংলায় লেখো। Board পরীক্ষার ভাষা ও style follow করো।

Return JSON format: {"ka": "...", "kha": "...", "ga": "...", "gha": "..."}`;

    const userMessage = `বিষয়: ${subject}\nউদ্দীপক: ${uddipok}\n\nসৃজনশীল উত্তর তৈরি করো।`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-srijonshil error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
