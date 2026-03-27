import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sscGpa, hscGpa, scores } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const avgScore = Object.values(scores as Record<string, number>).reduce((a: number, b: number) => a + b, 0) / Object.keys(scores).length;
    const effectiveHscGpa = hscGpa || 4.5;
    const gpaFactor = (sscGpa + effectiveHscGpa) / 10;

    const prompt = `তুমি বাংলাদেশের ভর্তি পরীক্ষার বিশেষজ্ঞ। একজন শিক্ষার্থীর তথ্য:
- SSC GPA: ${sscGpa}
- HSC GPA: ${hscGpa || 'এখনো হয়নি'}
- Mock exam scores: Physics=${scores.physics}, Chemistry=${scores.chemistry}, Biology=${scores.biology}, Math=${scores.math}, English=${scores.english}, GK=${scores.gk}

এই তথ্যের ভিত্তিতে, প্রতিটি university/exam এর জন্য ভর্তির সম্ভাবনা (%) এবং 3-5টি specific recommendation দাও বাংলায়।`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "তুমি বাংলাদেশের ভর্তি পরীক্ষার AI বিশেষজ্ঞ। সবসময় বাংলায় উত্তর দাও।" },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "admission_chances",
              description: "Return admission chances and recommendations",
              parameters: {
                type: "object",
                properties: {
                  chances: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        icon: { type: "string" },
                        chance: { type: "number" },
                      },
                      required: ["label", "icon", "chance"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["chances", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "admission_chances" } },
      }),
    });

    if (!response.ok) {
      // Fallback to calculated results
      const base = avgScore * 0.7 + gpaFactor * 30;
      return new Response(JSON.stringify({
        chances: [
          { label: "Medical Admission", icon: "🏥", chance: Math.min(95, Math.max(5, Math.round(base * 0.85 + scores.biology * 0.15))) },
          { label: "BUET", icon: "⚙️", chance: Math.min(95, Math.max(5, Math.round(base * 0.7 + scores.math * 0.2 + scores.physics * 0.1))) },
          { label: "DU ক ইউনিট", icon: "🏛️", chance: Math.min(95, Math.max(5, Math.round(base * 0.9))) },
          { label: "GST 19 Universities", icon: "🎓", chance: Math.min(95, Math.max(5, Math.round(base * 0.95 + 5))) },
          { label: "জগন্নাথ বিশ্ববিদ্যালয়", icon: "📚", chance: Math.min(95, Math.max(5, Math.round(base * 0.85))) },
          { label: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়", icon: "🏫", chance: Math.min(95, Math.max(5, Math.round(base * 0.88))) },
        ],
        recommendations: [
          scores.biology < 70 ? "Biology তে আরো marks বাড়াও" : null,
          scores.chemistry < 70 ? "Chemistry Organic chapter শেষ করো" : null,
          scores.english < 70 ? "English grammar MCQ practice করো" : null,
          scores.physics < 70 ? "Physics এর Mechanics চ্যাপ্টার রিভিশন দাও" : null,
          scores.math < 70 ? "গণিতে Calculus তে ফোকাস করো" : null,
        ].filter(Boolean),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    const base = avgScore * 0.7 + gpaFactor * 30;
    return new Response(JSON.stringify({
      chances: [
        { label: "Medical Admission", icon: "🏥", chance: Math.min(95, Math.max(5, Math.round(base * 0.85 + scores.biology * 0.15))) },
        { label: "BUET", icon: "⚙️", chance: Math.min(95, Math.max(5, Math.round(base * 0.7 + scores.math * 0.2 + scores.physics * 0.1))) },
        { label: "DU ক ইউনিট", icon: "🏛️", chance: Math.min(95, Math.max(5, Math.round(base * 0.9))) },
        { label: "GST 19 Universities", icon: "🎓", chance: Math.min(95, Math.max(5, Math.round(base * 0.95 + 5))) },
        { label: "জগন্নাথ বিশ্ববিদ্যালয়", icon: "📚", chance: Math.min(95, Math.max(5, Math.round(base * 0.85))) },
        { label: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়", icon: "🏫", chance: Math.min(95, Math.max(5, Math.round(base * 0.88))) },
      ],
      recommendations: [
        scores.biology < 70 ? "Biology তে আরো marks বাড়াও" : null,
        scores.chemistry < 70 ? "Chemistry Organic chapter শেষ করো" : null,
        scores.english < 70 ? "English grammar MCQ practice করো" : null,
      ].filter(Boolean),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("calculate-chance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
