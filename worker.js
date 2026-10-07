// ============================================================
// 🏏 CRICKET REEL MAKER V3
// AI Cricket Reel Generator
// Script + Scenes + Image Prompt + Video Prompt
// ============================================================

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ----------------------------------------------------------
    // CORS
    // ----------------------------------------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    // ----------------------------------------------------------
    // HOME / HEALTH
    // ----------------------------------------------------------
    if (url.pathname === "/api/health") {
      return json({
        success: true,
        app: "Cricket Reel Maker V3",
        workersAI: !!env.AI
      });
    }

    // ----------------------------------------------------------
    // AI REEL GENERATOR
    // ----------------------------------------------------------
    if (url.pathname === "/api/reel" && request.method === "POST") {
      try {
        const body = await request.json();

        const news = String(body.news || "").trim();
        const language = body.language || "Hindi";
        const duration = Number(body.duration || 30);
        const scenes = Number(body.scenes || 5);
        const style = body.style || "Exciting";
        const platform = body.platform || "Facebook Reel";

        if (!news) {
          return json(
            {
              success: false,
              error: "कृपया क्रिकेट न्यूज़ डालें।"
            },
            400
          );
        }

        if (!env.AI) {
          return json(
            {
              success: false,
              error: "Workers AI binding नहीं मिली।"
            },
            500
          );
        }

        // ------------------------------------------------------
        // WORD TARGET
        // ------------------------------------------------------
        let wordTarget = "75-90";

        if (duration === 15) wordTarget = "40-50";
        if (duration === 45) wordTarget = "110-125";
        if (duration === 60) wordTarget = "145-165";

        // ------------------------------------------------------
        // AI PROMPT
        // ------------------------------------------------------
        const prompt = `
You are an expert cricket social-media reel writer.

Create a complete cricket reel from the NEWS supplied below.

IMPORTANT:
- Use ONLY facts present in the supplied news.
- Do NOT invent scores, records, dates, players, venues or statistics.
- Detect the main player, teams, opponent and topic automatically.
- Make the opening extremely strong.
- The first line must work as a social-media hook.
- Keep the narration suitable for approximately ${duration} seconds.
- Target approximately ${wordTarget} words.
- Language: ${language}
- Style: ${style}
- Platform: ${platform}
- Number of scenes: ${scenes}

IMAGE STYLE:
- Photorealistic cricket photography
- Cinematic stadium
- Dramatic floodlights
- Realistic player action
- Vertical 9:16
- Upper 68% visual area
- Lower 32% pure black empty area for Hindi text
- No text inside generated image
- No logo
- No watermark

VIDEO PROMPT:
- Describe realistic cricket movement.
- Include camera movement.
- Include crowd/stadium atmosphere when useful.
- Vertical 9:16.
- No text.
- No watermark.

Return ONLY valid JSON.
Do not use markdown.
Do not use \`\`\`json.

JSON structure:

{
  "detected": {
    "player": "",
    "team": "",
    "opponent": "",
    "topic": "",
    "matchType": ""
  },
  "script": "",
  "scenes": [
    {
      "number": 1,
      "title": "",
      "timing": "",
      "narration": "",
      "overlay": "",
      "imagePrompt": "",
      "videoPrompt": "",
      "camera": "",
      "mood": ""
    }
  ],
  "title": "",
  "caption": "",
  "hashtags": [],
  "music": ""
}

NEWS:
${news}
`;

        const result = await env.AI.run(AI_MODEL, {
          prompt
        });

        let raw = "";

        if (typeof result === "string") {
          raw = result;
        } else if (result && typeof result.response === "string") {
          raw = result.response;
        } else {
          raw = JSON.stringify(result);
        }

        const data = parseAIJSON(raw);

        return json({
          success: true,
          data
        });

      } catch (error) {
        return json(
          {
            success: false,
            error: error?.message || "AI reel generation failed."
          },
          500
        );
      }
    }

    return json(
      {
        success: false,
        error: "Endpoint not found"
      },
      404
    );
  }
};


// ============================================================
// JSON RESPONSE
// ============================================================

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}


// ============================================================
// CORS
// ============================================================

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}


// ============================================================
// AI JSON PARSER
// ============================================================

function parseAIJSON(text) {
  let cleaned = String(text || "").trim();

  // Remove markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // First attempt
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Find JSON object if AI added extra text
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first !== -1 && last !== -1 && last > first) {
    const possibleJSON = cleaned.slice(first, last + 1);

    try {
      return JSON.parse(possibleJSON);
    } catch (_) {}
  }

  throw new Error("AI ने valid JSON नहीं लौटाया।");
                   }
