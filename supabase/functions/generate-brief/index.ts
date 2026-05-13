const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are PrepIQ, a senior recruiter and interview coach. Given a candidate's resume and a job description, produce a focused, practical 1-page interview prep brief. Be concrete, specific to the candidate's actual experience, and never generic.

CRITICAL — Fit Score is MANDATORY. You MUST always populate the "fit_Score" field on every response. Never omit it. Never leave it null. Compute it as a JSON object with this exact shape:
{ "score": <integer 0-10>, "color": "green" | "amber" | "red", "reasoning": "<1-2 sentence critical justification>" }

Scoring rubric (apply strictly):
- 8-10 ("green"): Meets ALL mandatory technical skills; direct industry experience.
- 5-7 ("amber"): Good foundation; minor tool expertise or experience gaps.
- 0-4 ("red"): Major misalignment with core technical requirements.

The color MUST match the score band exactly. Tone for the reasoning: objective and critical. Do NOT sugarcoat missing must-have skills — call them out explicitly.

Return everything via the build_prep_brief tool. The tool call WILL BE REJECTED if fit_Score is missing or malformed.`;

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
        fit_Score: {
          type: "object",
          description: "Objective fit score (0-10) measuring resume vs JD alignment.",
          properties: {
            score: { type: "integer", minimum: 0, maximum: 10 },
            color: { type: "string", enum: ["green", "amber", "red"] },
            reasoning: { type: "string", description: "1-2 sentence critical, objective justification. Do not sugarcoat missing must-have skills." },
          },
          required: ["score", "color", "reasoning"],
          additionalProperties: false,
        },
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
      required: ["role", "company", "snapshot", "fit_Score", "questions", "suggested_answers", "red_flags", "talking_points"],
      additionalProperties: false,
    },
  },
};

// Simple in-memory rate limiter (per edge instance). Best-effort; resets on cold start.
const RATE_LIMIT_MAX = 5; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB total payload
const MAX_FIELD_CHARS = 50_000; // per-field cap (resume / JD)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate limit by client IP (best-effort)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfter),
          },
        },
      );
    }

    // Enforce payload size limit (5 MB)
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength && contentLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Payload too large. Maximum 5 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const rawBody = await req.text();
    if (rawBody.length > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Payload too large. Maximum 5 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { resume, jobDescription, userApiKey, userProvider } = JSON.parse(rawBody);

    if (!resume || !jobDescription) {
      return new Response(JSON.stringify({ error: "resume and jobDescription are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof resume !== "string" || typeof jobDescription !== "string") {
      return new Response(JSON.stringify({ error: "resume and jobDescription must be strings" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resume.length > MAX_FIELD_CHARS || jobDescription.length > MAX_FIELD_CHARS) {
      return new Response(
        JSON.stringify({ error: `Input too large. Maximum ${MAX_FIELD_CHARS} characters per field.` }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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

    // Defensive fallback: guarantee fit_Score is present and well-formed
    const fs = brief.fit_Score;
    const validColor = (c: unknown) => c === "green" || c === "amber" || c === "red";
    if (
      !fs ||
      typeof fs.score !== "number" ||
      !validColor(fs.color) ||
      typeof fs.reasoning !== "string"
    ) {
      const score = typeof fs?.score === "number" ? Math.max(0, Math.min(10, Math.round(fs.score))) : 5;
      const color = score >= 8 ? "green" : score >= 5 ? "amber" : "red";
      brief.fit_Score = {
        score,
        color,
        reasoning:
          typeof fs?.reasoning === "string" && fs.reasoning.trim()
            ? fs.reasoning
            : "Fit score auto-derived: model did not return a structured score. Review resume vs JD manually for must-have skill coverage.",
      };
    } else {
      // Re-align color to score band to keep them consistent.
      const s = Math.max(0, Math.min(10, Math.round(fs.score)));
      brief.fit_Score = {
        score: s,
        color: s >= 8 ? "green" : s >= 5 ? "amber" : "red",
        reasoning: fs.reasoning,
      };
    }

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
