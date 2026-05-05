import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are InterviewReady AI, a senior interview coach. Given a candidate's resume and a job description, produce a focused, practical 1-page interview prep brief. Be concrete, specific to the candidate's actual experience, and never generic. Use the provided tool to return structured JSON.`;

const tool = {
  type: "function",
  function: {
    name: "build_prep_brief",
    description: "Return a structured interview prep brief.",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string", description: "The role being interviewed for" },
        company: { type: "string", description: "Company name if detectable, else empty string" },
        snapshot: { type: "string", description: "2-3 sentence summary of candidate fit for this role" },
        questions: {
          type: "array",
          description: "8-12 likely interview questions, prioritized",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              category: { type: "string", description: "e.g. Behavioral, Product Sense, Technical, Leadership" },
            },
            required: ["question", "priority", "category"],
            additionalProperties: false,
          },
        },
        suggested_answers: {
          type: "array",
          description: "Tailored draft answers for the top 4-6 questions, grounded in the candidate's resume",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string", description: "STAR-style or structured answer, 4-8 sentences" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        red_flags: {
          type: "array",
          description: "Gaps or mismatches between resume and JD with how to address",
          items: {
            type: "object",
            properties: {
              gap: { type: "string" },
              how_to_address: { type: "string" },
            },
            required: ["gap", "how_to_address"],
            additionalProperties: false,
          },
        },
        talking_points: {
          type: "array",
          description: "5-7 strengths/talking points to emphasize",
          items: { type: "string" },
        },
      },
      required: ["role", "company", "snapshot", "questions", "suggested_answers", "red_flags", "talking_points"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resume, jobDescription, userApiKey, userProvider } = await req.json();

    if (!resume || !jobDescription) {
      return new Response(JSON.stringify({ error: "resume and jobDescription are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `=== RESUME ===\n${resume}\n\n=== JOB DESCRIPTION ===\n${jobDescription}\n\nProduce the interview prep brief now using the build_prep_brief tool.`;

    let url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let apiKey = Deno.env.get("LOVABLE_API_KEY");
    let model = "google/gemini-3-flash-preview";

    if (userApiKey && userProvider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      apiKey = userApiKey;
      model = "gpt-4o-mini";
    } else if (userApiKey && userProvider === "anthropic") {
      url = "https://api.anthropic.com/v1/messages";
      apiKey = userApiKey;
      model = "claude-3-5-sonnet-20240620";
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(userProvider === "anthropic" ? { "anthropic-version": "2023-06-01" } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "build_prep_brief" } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable Cloud settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brief = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
