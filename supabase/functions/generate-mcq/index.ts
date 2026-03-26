import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, topic, classLevel, count } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

    const systemPrompt = `তুমি বাংলাদেশের NCTB পাঠ্যক্রম অনুযায়ী ${classLevel} পরীক্ষার MCQ তৈরি করো।
প্রতিটি MCQ তে:
- বাংলায় প্রশ্ন লেখো
- ৪টি বিকল্প উত্তর দাও (ক, খ, গ, ঘ)
- সঠিক উত্তর indicate করো
- সহজ বাংলায় ব্যাখ্যা দাও কেন এই উত্তর সঠিক
- NCTB board এর প্রশ্ন pattern follow করো`;

    const userMessage = `Subject: ${subject}, Topic: ${topic || 'General'}, Class: ${classLevel}. Generate ${count} MCQ questions. Return as JSON array with format: {"questions": [{"question": "...", "options": [{"text": "...", "isCorrect": true/false}], "explanation": "..."}]}. Return ONLY valid JSON, no markdown.`;

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
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Gemini API error:", status, errText);
      throw new Error(`Gemini API error: ${status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mcq error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
