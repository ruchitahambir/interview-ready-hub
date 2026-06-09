const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are PrepIQ, a senior recruiter and interview coach. Given a candidate's resume, a job description, and an optional list of recruiter-defined custom skill weights, produce a focused, practical 1-page screening brief. Be concrete, specific to the candidate's actual experience, and never generic.

CRITICAL — Always populate these MANDATORY fields:

1. "fit_Score" (objective resume-vs-JD alignment):
   { "score": <integer 0-10>, "color": "green" | "amber" | "red", "reasoning": "<1-2 sentence critical justification>" }
   Bands: 8-10 green (meets all mandatory + direct industry exp), 5-7 amber (minor gaps), 0-4 red (major misalignment).
   Color MUST match the score band exactly. Be critical; never sugarcoat missing must-haves.

2. "match_score" (weighted custom score 0-100 based on recruiter skill weights):
   { "score": <integer 0-100>, "color": "green"|"amber"|"red", "reasoning": "<1-2 sentences>", "dealbreakers_missed": [<list of must-have skills the candidate clearly lacks>] }
   - Each non-dealbreaker skill contributes proportional to its weight (1-5). Compute as: sum(weight * coverage[0..1]) / sum(weights) * 100.
   - Any unmet "dealbreaker" (must-have) skill must HEAVILY penalize the score (cap at 40) and be listed in dealbreakers_missed.
   - If no custom skill weights are provided, mirror the fit_Score: match_score.score = fit_Score.score * 10, same color, brief reasoning, dealbreakers_missed: [].
   - Color bands: 75-100 green, 45-74 amber, 0-44 red.

3. "targeted_screening_questions" — an array of 3-5 SPECIFIC HR screening questions the recruiter should ask. Each question MUST directly probe a gap, discrepancy, weak point, or unverified claim identified between this candidate's resume and the JD (and any unmet skill weights). Do NOT include generic behavioral fluff. Make each question concrete enough that a vague answer would expose the gap.

Return everything via the build_prep_brief tool. The tool call WILL BE REJECTED if any mandatory field is missing or malformed.`;

const tool = {
  type: "function",
  function: {
    name: "build_prep_brief",
    description: "Return a structured interview prep brief.",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string" },
        company: { type: "string" },
        snapshot: { type: "string" },
        fit_Score: {
          type: "object",
          properties: {
            score: { type: "integer", minimum: 0, maximum: 10 },
            color: { type: "string", enum: ["green", "amber", "red"] },
            reasoning: { type: "string" },
          },
          required: ["score", "color", "reasoning"],
          additionalProperties: false,
        },
        match_score: {
          type: "object",
          description: "Weighted custom match score (0-100) based on recruiter skill weights.",
          properties: {
            score: { type: "integer", minimum: 0, maximum: 100 },
            color: { type: "string", enum: ["green", "amber", "red"] },
            reasoning: { type: "string" },
            dealbreakers_missed: { type: "array", items: { type: "string" } },
          },
          required: ["score", "color", "reasoning", "dealbreakers_missed"],
          additionalProperties: false,
        },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              category: { type: "string" },
            },
            required: ["question", "priority", "category"],
            additionalProperties: false,
          },
        },
        suggested_answers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        red_flags: {
          type: "array",
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
        talking_points: { type: "array", items: { type: "string" } },
        targeted_screening_questions: {
          type: "array",
          description: "3-5 specific HR screening questions targeting identified gaps/weak points.",
          items: { type: "string" },
        },
      },
      required: [
        "role",
        "company",
        "snapshot",
        "fit_Score",
        "match_score",
        "questions",
        "suggested_answers",
        "red_flags",
        "talking_points",
        "targeted_screening_questions",
      ],
      additionalProperties: false,
    },
  },
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
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

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FIELD_CHARS = 50_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
        },
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength && contentLength > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large. Maximum 5 MB." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rawBody = await req.text();
    if (rawBody.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large. Maximum 5 MB." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { resume, jobDescription, skillWeights, userApiKey, userProvider } = JSON.parse(rawBody);

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

    // Validate skill weights (optional)
    let weightsBlock = "No custom skill weights provided.";
    const safeWeights: Array<{ skill: string; weight: number; mustHave: boolean }> = [];
    if (Array.isArray(skillWeights)) {
      for (const w of skillWeights.slice(0, 30)) {
        if (!w || typeof w.skill !== "string") continue;
        const skill = w.skill.trim().slice(0, 200);
        if (!skill) continue;
        const weight = Math.max(1, Math.min(5, Math.round(Number(w.weight) || 3)));
        const mustHave = Boolean(w.mustHave);
        safeWeights.push({ skill, weight, mustHave });
      }
      if (safeWeights.length) {
        weightsBlock = safeWeights
          .map(
            (w, i) =>
              `${i + 1}. ${w.skill} — ${w.mustHave ? "DEALBREAKER (must-have)" : `weight ${w.weight}/5`}`,
          )
          .join("\n");
      }
    }

    const userPrompt = `=== RESUME ===\n${resume}\n\n=== JOB DESCRIPTION ===\n${jobDescription}\n\n=== CUSTOM SKILL WEIGHTS ===\n${weightsBlock}\n\nProduce the screening brief now using the build_prep_brief tool. Remember: match_score MUST penalize unmet dealbreakers heavily and reflect the weighted skills above.`;

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
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable Cloud settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
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

    // Defensive: fit_Score
    const validColor = (c: unknown) => c === "green" || c === "amber" || c === "red";
    const fs = brief.fit_Score;
    if (!fs || typeof fs.score !== "number" || !validColor(fs.color) || typeof fs.reasoning !== "string") {
      const score = typeof fs?.score === "number" ? Math.max(0, Math.min(10, Math.round(fs.score))) : 5;
      brief.fit_Score = {
        score,
        color: score >= 8 ? "green" : score >= 5 ? "amber" : "red",
        reasoning: typeof fs?.reasoning === "string" && fs.reasoning.trim()
          ? fs.reasoning
          : "Fit score auto-derived: model did not return a structured score.",
      };
    } else {
      const s = Math.max(0, Math.min(10, Math.round(fs.score)));
      brief.fit_Score = { score: s, color: s >= 8 ? "green" : s >= 5 ? "amber" : "red", reasoning: fs.reasoning };
    }

    // Defensive: match_score
    const ms = brief.match_score;
    if (!ms || typeof ms.score !== "number" || !validColor(ms.color)) {
      const s = brief.fit_Score.score * 10;
      brief.match_score = {
        score: s,
        color: s >= 75 ? "green" : s >= 45 ? "amber" : "red",
        reasoning: typeof ms?.reasoning === "string" ? ms.reasoning : "Derived from fit score (no custom weights or invalid model output).",
        dealbreakers_missed: Array.isArray(ms?.dealbreakers_missed) ? ms.dealbreakers_missed : [],
      };
    } else {
      const s = Math.max(0, Math.min(100, Math.round(ms.score)));
      brief.match_score = {
        score: s,
        color: s >= 75 ? "green" : s >= 45 ? "amber" : "red",
        reasoning: ms.reasoning ?? "",
        dealbreakers_missed: Array.isArray(ms.dealbreakers_missed) ? ms.dealbreakers_missed : [],
      };
    }

    // Defensive: targeted_screening_questions
    if (!Array.isArray(brief.targeted_screening_questions) || brief.targeted_screening_questions.length === 0) {
      brief.targeted_screening_questions = (brief.red_flags || []).slice(0, 5).map((rf: { gap: string }) =>
        `Can you walk me through your experience with ${rf.gap}? Please give a specific example with measurable outcomes.`,
      );
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
