import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, source, target, sourceLang, targetLang, glossary, context } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "translate":
        systemPrompt = `You are an expert translator. Translate text from ${sourceLang || "EN"} to ${targetLang || "DE"}. 
Return a JSON object with: { "translation": "...", "confidence": 0-100, "alternatives": [{ "text": "...", "confidence": 0-100 }] }
${glossary ? `Use these glossary terms: ${JSON.stringify(glossary)}` : ""}
${context ? `Context: ${context}` : ""}
Only return valid JSON, no markdown.`;
        userPrompt = source;
        break;

      case "qa_check":
        systemPrompt = `You are a translation QA specialist. Analyze the translation for quality issues.
Source language: ${sourceLang || "EN"}, Target language: ${targetLang || "DE"}.
${glossary ? `Glossary terms to enforce: ${JSON.stringify(glossary)}` : ""}
Return JSON: { "score": 0-100, "issues": [{ "type": "grammar"|"terminology"|"consistency"|"style"|"accuracy", "severity": "error"|"warning"|"info", "message": "...", "suggestion": "..." }], "riskLevel": "low"|"medium"|"high" }
Only return valid JSON, no markdown.`;
        userPrompt = `Source: ${source}\nTranslation: ${target}`;
        break;

      case "rewrite":
        systemPrompt = `You are an expert translator and editor. Rewrite the translation to improve quality while preserving meaning.
Source language: ${sourceLang || "EN"}, Target language: ${targetLang || "DE"}.
Return JSON: { "rewritten": "...", "changes": ["description of each change"] }
Only return valid JSON, no markdown.`;
        userPrompt = `Source: ${source}\nCurrent translation: ${target}`;
        break;

      case "risk_score":
        systemPrompt = `You are a translation risk analyst. Evaluate the risk level of this translation segment.
Consider: accuracy, terminology consistency, grammar, cultural appropriateness, context fit.
Return JSON: { "riskScore": 0-100, "riskLevel": "low"|"medium"|"high"|"critical", "factors": [{ "factor": "...", "impact": "low"|"medium"|"high", "detail": "..." }], "recommendation": "..." }
Only return valid JSON, no markdown.`;
        userPrompt = `Source (${sourceLang || "EN"}): ${source}\nTranslation (${targetLang || "DE"}): ${target}`;
        break;

      case "terminology_check":
        systemPrompt = `You are a terminology enforcement specialist. Check if the translation correctly uses all required glossary terms.
Return JSON: { "compliant": true|false, "violations": [{ "term": "...", "expected": "...", "found": "...", "suggestion": "..." }] }
Only return valid JSON, no markdown.`;
        userPrompt = `Glossary: ${JSON.stringify(glossary || [])}\nSource: ${source}\nTranslation: ${target}`;
        break;

      case "chat":
        systemPrompt = `You are an AI translation assistant for a CAT (Computer-Assisted Translation) tool called LinguaFlow. 
You help translators with:
- Terminology questions and suggestions
- Rewriting and improving translations
- Tone and style adjustments
- Summarizing source content
- Translation best practices
Be concise, professional, and helpful. If the user provides source/target text context, use it.`;
        userPrompt = source; // "source" field carries the chat message
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const isChat = action === "chat";
    const model = "google/gemini-3-flash-preview";

    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: isChat,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isChat) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-translate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
