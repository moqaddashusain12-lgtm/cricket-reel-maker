// ============================================================
// 🏏 CRICKET REEL MAKER V3 - FINAL WORKER
// AI REEL GENERATOR + ROBUST JSON + SAFE SCENES
// ============================================================

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";


// ============================================================
// CORS
// ============================================================

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=UTF-8"
  };
}


// ============================================================
// JSON RESPONSE
// ============================================================

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: corsHeaders()
    }
  );
}


// ============================================================
// CLEAN AI TEXT
// ============================================================

function cleanAIText(text) {
  if (typeof text !== "string") {
    return "";
  }

  let s = text.trim();

  s = s.replace(/^```json\s*/i, "");
  s = s.replace(/^```\s*/i, "");
  s = s.replace(/\s*```$/i, "");

  return s.trim();
}


// ============================================================
// EXTRACT JSON
// ============================================================

function extractJSON(text) {

  if (!text) {
    throw new Error("AI ने कोई response नहीं दिया।");
  }

  const cleaned = cleanAIText(text);

  // Direct JSON
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // Object extraction
  const firstObject = cleaned.indexOf("{");
  const lastObject = cleaned.lastIndexOf("}");

  if (
    firstObject !== -1 &&
    lastObject > firstObject
  ) {

    const candidate =
      cleaned.slice(
        firstObject,
        lastObject + 1
      );

    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  // Array extraction
  const firstArray = cleaned.indexOf("[");
  const lastArray = cleaned.lastIndexOf("]");

  if (
    firstArray !== -1 &&
    lastArray > firstArray
  ) {

    const candidate =
      cleaned.slice(
        firstArray,
        lastArray + 1
      );

    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  throw new Error(
    "AI response JSON में convert नहीं हो पाया।"
  );
}


// ============================================================
// GET AI TEXT
// ============================================================

function getAIText(result) {

  if (typeof result === "string") {
    return result;
  }

  if (!result) {
    return "";
  }

  if (
    typeof result.response === "string"
  ) {
    return result.response;
  }

  if (
    result.result &&
    typeof result.result.response === "string"
  ) {
    return result.result.response;
  }

  if (
    result.response &&
    typeof result.response === "object"
  ) {
    return JSON.stringify(
      result.response
    );
  }

  if (
    typeof result.output === "string"
  ) {
    return result.output;
  }

  if (
    typeof result.text === "string"
  ) {
    return result.text;
  }

  return "";
}


// ============================================================
// BUILD AI PROMPT
// ============================================================

function buildPrompt(input) {

  const {
    news,
    player,
    opponent,
    duration,
    scenes,
    style,
    language,
    platform
  } = input;


  // Language
  const languageInstruction =
    language === "english"
      ? "Write narration in clear natural English."
      : language === "hinglish"
      ? "Write narration in natural Hinglish using Roman Hindi and English."
      : "Write narration in natural Hindi using Devanagari script.";


  // Word target
  const durationWords =
    duration === 15
      ? "about 35 to 45 words"
      : duration === 30
      ? "about 70 to 85 words"
      : duration === 45
      ? "about 105 to 125 words"
      : "about 140 to 165 words";


  return `You are an expert cricket news Reel writer.

Create a short-form cricket Reel using ONLY the information supplied in NEWS.

============================================================
STRICT FACT RULES
============================================================

1. Use ONLY facts present in NEWS.
2. NEVER invent statistics.
3. NEVER invent dates.
4. NEVER invent venues.
5. NEVER invent quotes.
6. NEVER invent match results.
7. NEVER invent records.
8. NEVER invent teams.
9. NEVER invent opponents.
10. NEVER add facts from outside NEWS.
11. If a fact is not present in NEWS, do not mention it.
12. If opponent is not mentioned, leave opponent empty.
13. If venue is not mentioned, do not create one.
14. Do not guess a player's full name if the full name is not identifiable from NEWS.
15. Use the most specific player name that can be supported by NEWS.
16. If NEWS says "भारतीय खिलाड़ी", team may be identified as "भारत".
17. AUTO means detect from NEWS.
18. Manual player/opponent fields are hints only. NEWS has priority.

============================================================
REEL SETTINGS
============================================================

Player / Team input: ${player}
Opponent / Team input: ${opponent}

Duration: ${duration} seconds
Scenes: ${scenes}
Style: ${style}
Language: ${language}
Platform: ${platform}

${languageInstruction}

============================================================
SCRIPT
============================================================

Create a strong opening hook.

The COMPLETE SCRIPT must contain approximately:

${durationWords}

IMPORTANT:
Do NOT make the script too short.

For 30 seconds, write approximately 70-85 words.

The scene narrations together should also approximately match
the requested duration.

Do not repeat the same sentence unnecessarily.

============================================================
SCENE TIMING
============================================================

Create EXACTLY ${scenes} scenes.

Divide the full ${duration}-second Reel evenly.

Every scene must have an exact timing range covering the entire video.

For example:

30 seconds / 5 scenes:

Scene 1 = 0-6
Scene 2 = 6-12
Scene 3 = 12-18
Scene 4 = 18-24
Scene 5 = 24-30

Do NOT leave any time uncovered.

============================================================
SCENES
============================================================

Every scene must contain:

- number
- title
- timing
- narration
- overlay
- imagePrompt
- videoPrompt
- camera
- mood

Scene narration must be useful and connected to the NEWS.

Scene 5 may contain a simple CTA such as:

"ऐसी क्रिकेट खबरों के लिए फॉलो करें"

Only if appropriate.

============================================================
IMAGE PROMPT
============================================================

Create a photorealistic cinematic cricket image prompt.

Rules:

- Photorealistic cricket photography
- Realistic player appearance
- Realistic cricket stadium
- Cinematic sports lighting
- Dramatic but realistic atmosphere
- Vertical 9:16
- Upper 68% visual area
- Lower 32% completely empty solid black area
- No text
- No captions
- No written words
- No numbers
- No scoreboard
- No statistics displayed visually
- No logo
- No watermark
- No graphic text
- Do not create a scoreboard
- Do not display runs, overs, rankings or numbers inside image

The image should communicate the scene visually.

IMPORTANT:
The image prompt itself must NOT ask the image generator to
render any text, numbers or scoreboard.

============================================================
VIDEO PROMPT
============================================================

Create a REAL video motion prompt.

Do NOT simply copy the image prompt.

Describe:

- Player movement
- Cricket action
- Camera movement
- Crowd movement
- Natural body movement
- Stadium atmosphere
- Cinematic motion
- Realistic physics

Use different camera movements where suitable:

- Slow push-in
- Tracking shot
- Pan
- Tilt
- Close-up
- Wide stadium shot
- Low angle
- Over-the-shoulder
- Slow motion

Vertical 9:16.

No text.
No logo.
No watermark.
No scoreboard.

============================================================
OVERLAY
============================================================

Create short overlay text for the lower 32% black area.

The overlay may contain only facts supported by NEWS.

Keep it short and exciting.

============================================================
TITLE
============================================================

Create an engaging Reel title.

Only use facts from NEWS.

============================================================
CAPTION
============================================================

Create a short social-media caption.

Only use facts from NEWS.

============================================================
HASHTAGS
============================================================

Create relevant cricket hashtags.

============================================================
MUSIC
============================================================

Suggest a royalty-free/background music STYLE.

Do not provide copyrighted song lyrics.

============================================================
IMPORTANT JSON RULE
============================================================

Return ONLY valid JSON.

NO explanation.

NO Markdown.

NO code fences.

Use exactly this structure:

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
}


// ============================================================
// NORMALIZE RESULT
// ============================================================

function normalizeResult(
  data,
  sceneCount,
  duration
) {

  const result = data || {};

  const detected =
    result.detected || {};


  let scenes =
    Array.isArray(result.scenes)
      ? result.scenes
      : [];


  scenes =
    scenes.slice(
      0,
      sceneCount
    );


  return {

    detected: {

      player:
        detected.player || "",

      team:
        detected.team || "",

      opponent:
        detected.opponent || "",

      topic:
        detected.topic || "",

      matchType:
        detected.matchType || ""
    },


    script:
      result.script || "",


    scenes:
      scenes.map(
        (scene, index) => {

          // Guaranteed timing
          const start =
            Math.round(
              duration *
              index /
              sceneCount
            );

          const end =
            Math.round(
              duration *
              (index + 1) /
              sceneCount
            );


          // Safe image prompt
          const safeImagePrompt =
            (
              scene.imagePrompt ||
              "Photorealistic cinematic cricket scene"
            ) +
            " Vertical 9:16 composition, upper 68% visual area, lower 32% completely empty solid black area. No text, no numbers, no scoreboard, no captions, no written words, no logo, no watermark.";


          // Safe video prompt
          const safeVideoPrompt =
            (
              scene.videoPrompt ||
              "Realistic cricket action with natural player movement and cinematic camera movement"
            ) +
            " Realistic motion, natural body movement, cinematic camera movement, vertical 9:16, no text, no numbers, no scoreboard, no logo, no watermark.";


          return {

            number:
              index + 1,

            title:
              scene.title ||
              `Scene ${index + 1}`,

            timing:
              `${start}-${end}`,

            narration:
              scene.narration || "",

            overlay:
              scene.overlay || "",

            imagePrompt:
              safeImagePrompt,

            videoPrompt:
              safeVideoPrompt,

            camera:
              scene.camera ||
              "Cinematic camera",

            mood:
              scene.mood ||
              "Exciting"
          };

        }
      ),


    title:
      result.title || "",


    caption:
      result.caption || "",


    hashtags:
      Array.isArray(
        result.hashtags
      )
        ? result.hashtags
        : [],


    music:
      result.music || ""
  };
}


// ============================================================
// HEALTH
// ============================================================

async function handleHealth(env) {

  return jsonResponse({

    success: true,

    app:
      "Cricket Reel Maker V3",

    workersAI:
      !!env.AI,

    model:
      AI_MODEL

  });
}


// ============================================================
// REEL GENERATOR
// ============================================================

async function handleReel(
  request,
  env
) {

  // Check AI binding
  if (!env.AI) {

    return jsonResponse(
      {
        success: false,
        error:
          "Workers AI binding 'AI' नहीं मिला।"
      },
      500
    );

  }


  // Read request
  let input;

  try {

    input =
      await request.json();

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          "Invalid JSON request."
      },
      400
    );

  }


  // News
  const news =
    typeof input.news === "string"
      ? input.news.trim()
      : "";


  if (!news) {

    return jsonResponse(
      {
        success: false,
        error:
          "Cricket news खाली है।"
      },
      400
    );

  }


  // Allowed settings
  const durationOptions =
    [15, 30, 45, 60];

  const sceneOptions =
    [3, 5, 7];


  const duration =
    durationOptions.includes(
      Number(input.duration)
    )
      ? Number(input.duration)
      : 30;


  const scenes =
    sceneOptions.includes(
      Number(input.scenes)
    )
      ? Number(input.scenes)
      : 5;


  const player =
    String(
      input.player || "AUTO"
    );


  const opponent =
    String(
      input.opponent || "AUTO"
    );


  const style =
    String(
      input.style || "exciting"
    );


  const language =
    String(
      input.language || "hindi"
    );


  const platform =
    String(
      input.platform || "facebook"
    );


  // Build prompt
  const prompt =
    buildPrompt({

      news,
      player,
      opponent,
      duration,
      scenes,
      style,
      language,
      platform

    });


  try {

    // ========================================================
    // FIRST AI REQUEST
    // ========================================================

    const aiResult =
      await env.AI.run(
        AI_MODEL,
        {

          messages: [

            {
              role: "system",

              content:
                "You are a precise cricket content generator. Return valid JSON only. Follow the supplied NEWS strictly."
            },

            {
              role: "user",

              content:
                prompt
            }

          ],

          max_tokens:
            5000,

          temperature:
            0.1
        }
      );


    const aiText =
      getAIText(
        aiResult
      );


    if (!aiText) {

      return jsonResponse(
        {
          success: false,
          error:
            "AI ने खाली response दिया।"
        },
        500
      );

    }


    // ========================================================
    // PARSE JSON
    // ========================================================

    let parsed;


    try {

      parsed =
        extractJSON(
          aiText
        );

    } catch (error) {

      // ======================================================
      // AUTOMATIC JSON REPAIR
      // ======================================================

      try {

        const repairResult =
          await env.AI.run(
            AI_MODEL,
            {

              messages: [

                {
                  role: "system",

                  content:
                    "Convert the supplied AI content into valid JSON only. Do not add facts."
                },

                {
                  role: "user",

                  content:
`Convert this AI output into the required JSON structure.

Return ONLY valid JSON.

Do not add new facts.

Required structure:

{
  "detected": {
    "player": "",
    "team": "",
    "opponent": "",
    "topic": "",
    "matchType": ""
  },
  "script": "",
  "scenes": [],
  "title": "",
  "caption": "",
  "hashtags": [],
  "music": ""
}

AI OUTPUT:

${aiText}`
                }

              ],

              max_tokens:
                5000,

              temperature:
                0
            }
          );


        const repairedText =
          getAIText(
            repairResult
          );


        parsed =
          extractJSON(
            repairedText
          );


      } catch (repairError) {

        return jsonResponse(
          {
            success: false,
            error:
              "AI response JSON में convert नहीं हो पाया।"
          },
          500
        );

      }

    }


    // ========================================================
    // FINAL NORMALIZED RESULT
    // ========================================================

    const finalResult =
      normalizeResult(
        parsed,
        scenes,
        duration
      );


    return jsonResponse(
      {
        success: true,
        result:
          finalResult
      }
    );


  } catch (error) {

    return jsonResponse(
      {
        success: false,

        error:
          "AI generation failed: " +
          (
            error?.message ||
            "Unknown error"
          )
      },
      500
    );

  }
}


// ============================================================
// MAIN FETCH
// ============================================================

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );


    // OPTIONS
    if (
      request.method ===
      "OPTIONS"
    ) {

      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders()
        }
      );

    }


    // HEALTH
    if (
      request.method ===
        "GET" &&
      url.pathname ===
        "/api/health"
    ) {

      return handleHealth(
        env
      );

    }


    // REEL
    if (
      request.method ===
        "POST" &&
      url.pathname ===
        "/api/reel"
    ) {

      return handleReel(
        request,
        env
      );

    }


    // Unknown API
    if (
      url.pathname.startsWith(
        "/api/"
      )
    ) {

      return jsonResponse(
        {
          success: false,
          error:
            "API endpoint not found."
        },
        404
      );

    }


    // Frontend assets
    return env.ASSETS
      ? env.ASSETS.fetch(
          request
        )
      : new Response(
          "Cricket Reel Maker V3"
        );

  }

};
