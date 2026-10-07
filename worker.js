// ============================================================
// 🏏 CRICKET REEL MAKER V3 - FINAL WORKER
// AI REEL GENERATOR + ROBUST JSON + SMART SCENES
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
// CLEAN AI RESPONSE
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
    throw new Error(
      "AI ने कोई response नहीं दिया।"
    );
  }

  const cleaned =
    cleanAIText(text);

  // Direct JSON
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // Object
  const firstObject =
    cleaned.indexOf("{");

  const lastObject =
    cleaned.lastIndexOf("}");

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

  // Array
  const firstArray =
    cleaned.indexOf("[");

  const lastArray =
    cleaned.lastIndexOf("]");

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
// BUILD PROMPT
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


  const languageInstruction =
    language === "english"
      ? "Write all narration and social text in natural English."
      : language === "hinglish"
      ? "Write all narration and social text in natural Hinglish using Roman Hindi and English."
      : "Write all narration and social text in natural Hindi using Devanagari script.";


  const durationWords =
    duration === 15
      ? "45-55 words"
      : duration === 30
      ? "75-90 words"
      : duration === 45
      ? "110-130 words"
      : "150-175 words";


  return `You are an expert cricket short-video content creator.

Your task is to create a HIGH-QUALITY cricket Reel from ONLY the supplied NEWS.

============================================================
IMPORTANT FACT RULE
============================================================

Use ONLY information contained in NEWS.

NEVER invent:
- statistics
- dates
- venues
- opponents
- quotes
- match results
- records
- player achievements
- teams
- tournaments

If a fact is not present in NEWS, do not mention it.

If the opponent is not mentioned in NEWS, keep opponent empty.

If team can be directly identified from the phrase "भारतीय खिलाड़ी" or equivalent wording in NEWS, team can be "भारत".

Use the most specific player name that is actually identifiable from the supplied NEWS.

AUTO means detect automatically.

============================================================
REEL SETTINGS
============================================================

Player / Team:
${player}

Opponent / Team:
${opponent}

Duration:
${duration} seconds

Number of Scenes:
${scenes}

Style:
${style}

Language:
${language}

Platform:
${platform}

${languageInstruction}

============================================================
SCRIPT LENGTH
============================================================

The complete narration script MUST be approximately:

${durationWords}

IMPORTANT:

For a 30-second Reel, target approximately 75-90 words.

Do NOT produce a short 30-40 word script.

The narration should sound natural when spoken aloud.

Create:
1. Strong opening hook
2. Main record/news information
3. Important supporting facts from NEWS
4. Strong ending

Do not repeat the same sentence.

============================================================
SCENE NARRATION
============================================================

Create EXACTLY ${scenes} scenes.

The combined scene narrations should cover the complete story.

Do not make every scene narration identical.

Each scene should communicate a DIFFERENT part of the NEWS.

============================================================
SCENE TIMING
============================================================

Divide the entire ${duration}-second duration evenly.

For example:

30 sec / 5 scenes:

Scene 1 = 0-6
Scene 2 = 6-12
Scene 3 = 12-18
Scene 4 = 18-24
Scene 5 = 24-30

The final scene MUST end exactly at ${duration} seconds.

============================================================
VERY IMPORTANT: DIFFERENT VISUALS
============================================================

Every scene MUST have a different visual concept.

Do NOT use the same image description for all scenes.

Each scene must show a different cricket action, camera angle,
composition or moment.

For example:

Scene 1:
Opening batting moment / player introduction

Scene 2:
Powerful batting action / record-breaking atmosphere

Scene 3:
Celebration / crowd reaction / achievement moment

Scene 4:
IPL team-related cricket action if supported by NEWS

Scene 5:
Victory celebration / close-up / final Reel ending

These are examples only.

Choose visuals that match the actual NEWS.

============================================================
IMAGE PROMPT
============================================================

Create a detailed image-generation prompt for EACH scene.

Image must be:

- Photorealistic
- Cinematic cricket photography
- Realistic cricket player
- Realistic cricket stadium
- Natural human anatomy
- Professional sports photography
- Dramatic stadium lighting
- Realistic crowd
- Vertical 9:16

LAYOUT:

Upper 68%:
Main cricket visual.

Lower 32%:
Completely empty solid black area.

ABSOLUTELY NO:

- text
- written words
- numbers
- scoreboard
- statistics
- captions
- logos
- watermark
- banners containing readable text
- jersey text
- graphic overlays

IMPORTANT:

The image prompt itself must NOT request any text or numbers
inside the generated image.

Do NOT show the statistics visually.

The statistics will be added later as Text Overlay.

============================================================
SCENE-SPECIFIC IMAGE RULE
============================================================

Each imagePrompt MUST be substantially different.

Do not write:

"player holding bat"

for every scene.

Instead describe the actual action.

Possible actions:

- powerful cover drive
- pull shot
- straight drive
- running between wickets
- intense batting close-up
- helmet and gloves close-up
- celebrating after a milestone
- teammates congratulating
- crowd cheering
- player walking confidently
- emotional reaction
- stadium wide shot

Only use an action appropriate to the NEWS.

============================================================
VIDEO PROMPT
============================================================

Every videoPrompt MUST describe MOTION.

Do NOT copy imagePrompt.

Include:

- player movement
- bat movement
- body movement
- natural cricket action
- crowd movement
- camera movement
- realistic stadium atmosphere
- cinematic motion

Use different camera movements for different scenes.

Examples:

Scene 1:
Slow push-in toward batsman

Scene 2:
Tracking shot following batting action

Scene 3:
Slow-motion celebration

Scene 4:
Dynamic side tracking shot

Scene 5:
Slow cinematic close-up

Do not use the same camera movement for every scene.

Video must be:

- realistic
- cinematic
- vertical 9:16
- natural motion
- no text
- no numbers
- no scoreboard
- no logo
- no watermark

============================================================
TEXT OVERLAY
============================================================

Create short, powerful text for the lower black area.

Overlay must be based ONLY on NEWS.

Keep it short.

Examples:

"रिकॉर्ड टूट गया!"

"ईशान किशन का बड़ा कारनामा"

"1644 रन का शानदार आंकड़ा"

Numbers are allowed in TEXT OVERLAY because this text
will be added by the Reel Editor.

Numbers are NOT allowed inside IMAGE PROMPT.

============================================================
SCENE 5 CTA
============================================================

If appropriate, Scene 5 can end with:

"ऐसी क्रिकेट खबरों के लिए फॉलो करें"

CTA must not be presented as a cricket fact.

============================================================
TITLE
============================================================

Create an exciting short Reel title.

Only use facts from NEWS.

============================================================
CAPTION
============================================================

Create a short Facebook/Instagram/YouTube caption.

Only use facts from NEWS.

============================================================
HASHTAGS
============================================================

Create 5-8 relevant cricket hashtags.

============================================================
MUSIC
============================================================

Suggest a royalty-free background music STYLE.

Do not provide copyrighted lyrics.

============================================================
JSON FORMAT
============================================================

Return ONLY valid JSON.

No explanation.

No Markdown.

No code fences.

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

  const result =
    data || {};

  const detected =
    result.detected || {};


  let scenes =
    Array.isArray(
      result.scenes
    )
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


          let imagePrompt =
            scene.imagePrompt ||
            "Photorealistic cinematic cricket action";


          let videoPrompt =
            scene.videoPrompt ||
            "Realistic cinematic cricket movement";


          // Force image safety
          imagePrompt =
            imagePrompt +
            " Vertical 9:16. Upper 68% visual area. Lower 32% completely empty solid black area. No text, no written words, no numbers, no scoreboard, no captions, no logo, no watermark.";


          // Force video safety
          videoPrompt =
            videoPrompt +
            " Realistic natural movement, cinematic camera movement, vertical 9:16, no text, no numbers, no scoreboard, no logo, no watermark.";


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
              imagePrompt,

            videoPrompt:
              videoPrompt,

            camera:
              scene.camera ||
              "Cinematic",

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
                "You are a professional cricket Reel generator. Follow NEWS strictly. Return valid JSON only. Create different visuals for every scene."
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


    let parsed;


    // ========================================================
    // PARSE
    // ========================================================

    try {

      parsed =
        extractJSON(
          aiText
        );

    } catch (error) {

      // ======================================================
      // JSON REPAIR
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
                    "Convert the supplied content into valid JSON only. Do not add facts. Preserve all supplied scene information."
                },

                {
                  role: "user",

                  content:
`Convert this AI output into valid JSON.

Return ONLY valid JSON.

Do not add any new facts.

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
    // FINAL RESULT
    // ========================================================

    const finalResult =
      normalizeResult(
        parsed,
        scenes,
        duration
      );


    return jsonResponse({

      success: true,

      result:
        finalResult

    });


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
      request.method === "GET" &&
      url.pathname ===
        "/api/health"
    ) {

      return handleHealth(
        env
      );

    }


    // REEL
    if (
      request.method === "POST" &&
      url.pathname ===
        "/api/reel"
    ) {

      return handleReel(
        request,
        env
      );

    }


    // UNKNOWN API
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


    // FRONTEND
    return env.ASSETS
      ? env.ASSETS.fetch(
          request
        )
      : new Response(
          "Cricket Reel Maker V3"
        );

  }

};
