import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, documentContext, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "ক্রেডিট শেষ হয়ে গেছে।" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("notebook-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
