import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, documentContext, mode } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY not configured");

    let systemPrompt = "";

    if (mode === "study-guide") {
      systemPrompt = `তুমি বাংলাদেশের একজন অভিজ্ঞ শিক্ষক। তোমার কাজ হলো দেওয়া ডকুমেন্টের তথ্যের উপর ভিত্তি করে একটি বিস্তারিত স্টাডি গাইড তৈরি করা।

নিয়ম:
১. স্পষ্ট বাংলায় লেখো
২. গুরুত্বপূর্ণ বিষয়গুলো হাইলাইট করো
৩. প্রতিটি অধ্যায়ের সারসংক্ষেপ দাও
৪. মূল ধারণাগুলো বুলেট পয়েন্টে তালিকাবদ্ধ করো
৫. সম্ভাব্য পরীক্ষার প্রশ্ন সাজেস্ট করো
৬. মনে রাখার কৌশল (mnemonics) দাও

${documentContext ? `ডকুমেন্টের বিষয়বস্তু:\n${documentContext}` : ""}`;
    } else {
      systemPrompt = `তুমি বাংলাদেশের একজন AI টিউটর। শিক্ষার্থী তোমার সাথে তাদের আপলোড করা ডকুমেন্ট নিয়ে আলোচনা করতে চায়।

নিয়ম:
১. সবসময় সহজ বাংলায় উত্তর দাও
২. ডকুমেন্টের তথ্যের ভিত্তিতে উত্তর দাও
৩. শিক্ষার্থীকে বুঝতে সাহায্য করো
৪. প্রয়োজনে উদাহরণ দাও
৫. NCTB পাঠ্যক্রমের সাথে সম্পর্কিত করো

${documentContext ? `ডকুমেন্টের বিষয়বস্তু:\n${documentContext}` : "কোনো ডকুমেন্ট আপলোড করা হয়নি। শিক্ষার্থীকে ডকুমেন্ট আপলোড করতে বলো।"}`;
    }

    // Convert messages to Gemini format
    const geminiContents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Transform Gemini SSE to OpenAI-compatible SSE format for the frontend
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Write OpenAI-compatible SSE
                const openaiChunk = {
                  choices: [{ delta: { content: text } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            } catch { /* skip partial JSON */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("notebook-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
