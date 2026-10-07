// ============================================================
// 🏏 CRICKET REEL MAKER V3 - AI WORKER
// Auto Detect + AI Script + Scenes + Title + Caption
// ============================================================

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function cleanAIResponse(text) {
  if (!text) return "";

  text = String(text).trim();

  // Remove markdown code fences
  text = text.replace(/^```json\s*/i, "");
  text = text.replace(/^```\s*/i, "");
  text = text.replace(/\s*```$/i, "");

  return text.trim();
}

function extractJSON(text) {
  const cleaned = cleanAIResponse(text);

  // First direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Find first { and last }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    const possible = cleaned.slice(start, end + 1);

    try {
      return JSON.parse(possible);
    } catch (_) {}
  }

  return null;
}

function normalizeData(data, sceneCount) {
  if (!data || typeof data !== "object") {
    throw new Error("AI ने सही JSON response नहीं दिया।");
  }

  if (!data.detected) {
    data.detected = {
      player: "",
      team: "",
      opponent: "",
      topic: "",
      matchType: ""
    };
  }

  if (!Array.isArray(data.scenes)) {
    data.scenes = [];
  }

  data.scenes = data.scenes.slice(0, sceneCount);

  while (data.scenes.length < sceneCount) {
    const n = data.scenes.length + 1;

    data.scenes.push({
      number: n,
      title: `Scene ${n}`,
      timing: "",
      narration: "",
      overlay: "",
      imagePrompt: "",
      videoPrompt: "",
      camera: "",
      mood: ""
    });
  }

  data.scenes = data.scenes.map((scene, index) => ({
    number: index + 1,
    title: scene.title || `Scene ${index + 1}`,
    timing: scene.timing || "",
    narration: scene.narration || "",
    overlay: scene.overlay || "",
    imagePrompt: scene.imagePrompt || "",
    videoPrompt: scene.videoPrompt || "",
    camera: scene.camera || "",
    mood: scene.mood || ""
  }));

  data.script = data.script || "";
  data.title = data.title || "";
  data.caption = data.caption || "";
  data.music = data.music || "";

  if (!Array.isArray(data.hashtags)) {
    data.hashtags = [];
  }

  return data;
}

export default {
  async fetch(request, env) {
    try {
      // --------------------------------------------------------
      // OPTIONS / CORS
      // --------------------------------------------------------
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS
        });
      }

      const url = new URL(request.url);

      // --------------------------------------------------------
      // HEALTH
      // --------------------------------------------------------
      if (url.pathname === "/api/health") {
        return json({
          success: true,
          app: "Cricket Reel Maker V3",
          workersAI: !!env.AI,
          model: AI_MODEL
        });
      }

      // --------------------------------------------------------
      // AI REEL GENERATOR
      // --------------------------------------------------------
      if (url.pathname === "/api/reel" && request.method === "POST") {

        if (!env.AI) {
          return json({
            success: false,
            error: "Workers AI binding नहीं मिला। wrangler.jsonc में AI binding जोड़ें।"
          }, 500);
        }

        let body;

        try {
          body = await request.json();
        } catch (_) {
          return json({
            success: false,
            error: "Invalid JSON request."
          }, 400);
        }

        const news = String(body.news || "").trim();

        if (!news) {
          return json({
            success: false,
            error: "कृपया क्रिकेट न्यूज़ या मैच की जानकारी डालें।"
          }, 400);
        }

        const playerInput = String(body.player || "AUTO").trim();
        const opponentInput = String(body.opponent || "AUTO").trim();

        const durationValues = [15, 30, 45, 60];
        const sceneValues = [3, 5, 7];

        const duration = durationValues.includes(Number(body.duration))
          ? Number(body.duration)
          : 30;

        const sceneCount = sceneValues.includes(Number(body.scenes))
          ? Number(body.scenes)
          : 5;

        const language = String(body.language || "Hindi");
        const style = String(body.style || "Exciting");
        const platform = String(body.platform || "Facebook Reel");

        let wordTarget = "75-90";

        if (duration === 15) wordTarget = "40-50";
        if (duration === 45) wordTarget = "110-125";
        if (duration === 60) wordTarget = "145-165";

        const playerInstruction =
          playerInput &&
          playerInput.toLowerCase() !== "auto" &&
          playerInput.toLowerCase() !== "auto detect"
            ? playerInput
            : "AUTO-DETECT FROM NEWS";

        const opponentInstruction =
          opponentInput &&
          opponentInput.toLowerCase() !== "auto" &&
          opponentInput.toLowerCase() !== "auto detect"
            ? opponentInput
            : "AUTO-DETECT FROM NEWS";

        // ------------------------------------------------------
        // AI PROMPT
        // ------------------------------------------------------

        const prompt = `
You are an expert Indian cricket news Reel writer and social-media content creator.

Create a ${duration}-second cricket Reel for ${platform}.

IMPORTANT:
Use ONLY information contained in the supplied NEWS.
DO NOT invent:
- scores
- statistics
- records
- dates
- venues
- match results
- player names
- teams
- quotes
- tournament details
- facts not present in the news

Automatically identify the MAIN PLAYER, TEAM, OPPONENT, TOPIC and MATCH TYPE from the news.

Player instruction:
${playerInstruction}

Opponent instruction:
${opponentInstruction}

Language:
${language}

Style:
${style}

Duration:
${duration} seconds

Target narration length:
${wordTarget} words

Number of scenes:
${sceneCount}

NEWS:
----------------
${news}
----------------

Create:
1. A powerful hook in the first 1-2 seconds.
2. A natural Hindi/English/Hinglish narration depending on selected language.
3. Scene-by-scene content.
4. Short text overlays suitable for mobile Reel.
5. Photorealistic cricket image prompts.
6. Dynamic video prompts.
7. Camera movement.
8. Mood.
9. Reel title.
10. Caption.
11. Hashtags.
12. Background music suggestion.

IMAGE PROMPT RULES:
- Photorealistic
- Cinematic cricket photography
- Realistic stadium
- Dramatic professional sports lighting
- Vertical 9:16
- Subject mainly in upper 68% of frame
- Lower 32% must be completely solid black and empty
- No text
- No logo
- No watermark
- No unnecessary graphics

VIDEO PROMPT RULES:
- Realistic cricket motion
- Natural player movement
- Stadium crowd movement
- Cinematic camera movement
- Suitable for short-form vertical video
- No text
- No logo
- No watermark

Return ONLY valid JSON.
Do not use markdown.
Do not put the JSON inside code fences.

Required JSON format:

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
`;

        // ------------------------------------------------------
        // RUN WORKERS AI
        // ------------------------------------------------------

        const aiResponse = await env.AI.run(AI_MODEL, {
          prompt
        });

        let aiText = "";

        if (typeof aiResponse === "string") {
          aiText = aiResponse;
        } else if (aiResponse && typeof aiResponse.response === "string") {
          aiText = aiResponse.response;
        } else {
          aiText = JSON.stringify(aiResponse);
        }

        const parsed = extractJSON(aiText);

        if (!parsed) {
          return json({
            success: false,
            error: "AI response JSON में convert नहीं हो पाया।",
            raw: aiText
          }, 500);
        }

        const data = normalizeData(parsed, sceneCount);

        return json({
          success: true,
          data
        });
      }

      // --------------------------------------------------------
      // UNKNOWN API
      // --------------------------------------------------------

      if (url.pathname.startsWith("/api/")) {
        return json({
          success: false,
          error: "API endpoint not found."
        }, 404);
      }

      return new Response("Cricket Reel Maker V3", {
        status: 200,
        headers: CORS_HEADERS
      });

    } catch (error) {
      return json({
        success: false,
        error: error?.message || "Server error"
      }, 500);
    }
  }
};
