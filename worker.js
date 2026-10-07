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

  // Object JSON
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

  // Array JSON
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
// WORD COUNT
// ============================================================

function wordCount(text) {

  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;

}


// ============================================================
// SCRIPT RANGE
// ============================================================

function getScriptRange(duration) {

  if (duration === 15) {
    return {
      min: 40,
      max: 60,
      target: "45-55"
    };
  }

  if (duration === 30) {
    return {
      min: 70,
      max: 100,
      target: "75-90"
    };
  }

  if (duration === 45) {
    return {
      min: 100,
      max: 140,
      target: "110-130"
    };
  }

  return {
    min: 140,
    max: 185,
    target: "150-175"
  };

}


// ============================================================
// SHORT TEXT CLEANER
// ============================================================

function cleanShortText(
  text,
  maxLength = 65
) {

  let s =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!s) {
    return "";
  }

  const firstSentence =
    s.split(/[.!?।]+/)[0].trim();

  if (firstSentence) {
    s = firstSentence;
  }

  if (
    s.length >
    maxLength
  ) {

    s =
      s
        .slice(0, maxLength)
        .replace(/\s+\S*$/, "")
        .trim();

  }

  return s;

}


// ============================================================
// FALLBACK OVERLAY
// ============================================================

function makeFallbackOverlay(
  scene,
  detected,
  language
) {

  // 1. AI overlay
  const direct =
    cleanShortText(
      scene.overlay,
      65
    );

  if (direct) {
    return direct;
  }


  // 2. Narration
  const narration =
    cleanShortText(
      scene.narration,
      65
    );

  if (narration) {
    return narration;
  }


  // 3. Scene title
  const title =
    cleanShortText(
      scene.title,
      65
    );

  if (title) {
    return title;
  }


  // 4. Topic
  const topic =
    cleanShortText(
      detected.topic,
      65
    );

  if (topic) {
    return topic;
  }


  // 5. Player
  const player =
    cleanShortText(
      detected.player,
      50
    );

  if (player) {
    return player;
  }


  if (language === "english") {
    return "Cricket Update";
  }

  if (language === "hinglish") {
    return "Cricket Update";
  }

  return "क्रिकेट अपडेट";

}


// ============================================================
// SCENE VISUAL GUIDE
// ============================================================

function getSceneVisualGuide(index) {

  const guides = [

    "Scene 1: cinematic stadium wide shot, player entering or preparing for the cricket action, strong opening composition",

    "Scene 2: dynamic batting action, realistic bat swing, ball contact, athletic body movement, energetic sports photography",

    "Scene 3: two-player cricket interaction or partnership moment, teammates communicating or celebrating, medium cinematic composition",

    "Scene 4: match-result atmosphere, players celebrating on the field, realistic crowd reaction, wide dynamic stadium composition",

    "Scene 5: powerful final close-up of the main player, confident expression, emotional cricket moment, cinematic ending composition",

    "Scene 6: dramatic cricket action from a different camera angle, realistic field movement and stadium atmosphere",

    "Scene 7: final celebratory cricket moment, crowd excitement, cinematic hero composition"
  ];

  return guides[index] ||
    "Different cinematic cricket action with realistic player movement and stadium atmosphere";

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
      ? "Write narration, overlay, title, caption and other social text in natural English."
      : language === "hinglish"
      ? "Write narration, overlay, title, caption and other social text in natural Hinglish using Roman Hindi and English."
      : "Write narration, overlay, title, caption and other social text in natural Hindi using Devanagari script.";


  const range =
    getScriptRange(duration);


  let scenePlan = "";

  for (
    let i = 0;
    i < scenes;
    i++
  ) {

    scenePlan +=
      `Scene ${i + 1}: ${getSceneVisualGuide(i)}\n`;

  }


  return `You are an expert cricket short-video content creator.

Create a high-quality cricket Reel using ONLY the supplied NEWS.

============================================================
ABSOLUTE FACT RULE
============================================================

Use ONLY facts present in NEWS.

NEVER invent:
- statistics
- dates
- venues
- records
- quotes
- match results
- player achievements
- teams
- tournaments
- scores
- opponents

Do not add information from your own knowledge.

If a fact is not in NEWS, do not mention it.

AUTO means detect automatically.

If opponent is not present in NEWS, keep opponent empty.

If a team is directly identifiable from NEWS, detect it.

============================================================
SETTINGS
============================================================

Player / Team:
${player}

Opponent / Team:
${opponent}

Duration:
${duration} seconds

Scenes:
${scenes}

Style:
${style}

Language:
${language}

Platform:
${platform}

${languageInstruction}

============================================================
SCRIPT
============================================================

The complete narration script must be approximately:

${range.target} words.

For 30 seconds specifically:
75-90 words.

Do NOT produce a 30-40 word script.

The script must contain:

1. Strong opening hook
2. Main cricket news
3. Important facts from NEWS
4. Strong natural ending

Do not repeat sentences.

Do not add unsupported claims.

============================================================
SCENE COUNT
============================================================

Create EXACTLY ${scenes} scenes.

Every scene must have:
- number
- title
- timing
- narration
- overlay
- imagePrompt
- videoPrompt
- camera
- mood

Combined scene narration should cover the complete story.

Each scene narration must communicate a different part of the NEWS.

============================================================
SCENE TIMING
============================================================

Divide ${duration} seconds evenly.

For example:

30 sec / 5 scenes:

Scene 1 = 0-6
Scene 2 = 6-12
Scene 3 = 12-18
Scene 4 = 18-24
Scene 5 = 24-30

Final scene MUST end exactly at ${duration} seconds.

============================================================
IMPORTANT: DIFFERENT VISUALS
============================================================

Every scene MUST have a substantially different visual concept.

Do NOT use the same portrait for every scene.

Do NOT use the same camera composition repeatedly.

Use different:
- cricket actions
- camera angles
- player positions
- compositions
- movements
- emotional moments

Visual plan:

${scenePlan}

The visual plan is only guidance.

The actual visual must match the NEWS.

Do not invent factual events.

============================================================
IMAGE PROMPT
============================================================

Each scene needs a detailed image-generation prompt.

Required style:

- photorealistic
- cinematic cricket photography
- realistic human anatomy
- realistic cricket equipment
- professional sports photography
- realistic stadium
- realistic crowd
- dramatic stadium lighting
- vertical 9:16

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
- banners with readable text
- graphic overlays
- jersey text

IMPORTANT:

Numbers may appear ONLY in Text Overlay.

Never request numbers or statistics inside IMAGE PROMPT.

============================================================
VIDEO PROMPT
============================================================

Every videoPrompt MUST describe actual motion.

Do not simply copy imagePrompt.

Describe:
- player movement
- bat movement
- body movement
- natural cricket action
- crowd movement
- camera movement
- realistic stadium atmosphere
- cinematic motion

Use different camera movements in different scenes.

Examples:
- slow push-in
- tracking shot
- side tracking
- orbit movement
- slow-motion celebration
- cinematic pull-back

Do not use the same camera movement for every scene.

Video:
- realistic
- cinematic
- vertical 9:16
- natural movement
- no text
- no numbers
- no scoreboard
- no logo
- no watermark

============================================================
TEXT OVERLAY
============================================================

Every scene MUST have a short Text Overlay.

It must be based ONLY on NEWS or the scene narration.

Keep it short and powerful.

Examples:

"37 रन, 27 गेंदों में"

"137 रन की साझेदारी"

"8 विकेट से जीत"

Do NOT invent statistics.

Numbers ARE allowed in Text Overlay.

Numbers are NOT allowed in Image Prompt.

If Scene 5 is appropriate, a CTA may be:

"ऐसी क्रिकेट खबरों के लिए फॉलो करें"

CTA is not a factual claim.

============================================================
TITLE
============================================================

Create an exciting short Reel title.

Only use facts from NEWS.

============================================================
CAPTION
============================================================

Create a short social media caption.

Only use facts from NEWS.

============================================================
HASHTAGS
============================================================

Create 5-8 relevant cricket hashtags.

============================================================
MUSIC
============================================================

Suggest a royalty-free background music STYLE.

No copyrighted lyrics.

============================================================
JSON
============================================================

Return ONLY valid JSON.

No explanation.

No Markdown.

No code fences.

Use EXACTLY this structure:

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
// FALLBACK SCENE
// ============================================================

function createFallbackScene(
  index,
  duration,
  sceneCount,
  detected,
  language
) {

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


  const guide =
    getSceneVisualGuide(index);


  return {

    number:
      index + 1,

    title:
      `Scene ${index + 1}`,

    timing:
      `${start}-${end}`,

    narration:
      "",

    overlay:
      makeFallbackOverlay(
        {},
        detected,
        language
      ),

    imagePrompt:
      `Photorealistic cinematic cricket scene. ${guide}. Professional sports photography, realistic stadium, realistic crowd, dramatic stadium lighting, natural human anatomy, vertical 9:16. Upper 68% visual area. Lower 32% completely empty solid black area. No text, no written words, no numbers, no scoreboard, no statistics, no captions, no logo, no watermark, no graphic overlays.`,

    videoPrompt:
      `Realistic cinematic cricket movement. ${guide}. Natural player movement, realistic body motion, crowd movement, cinematic camera movement, vertical 9:16, no text, no numbers, no scoreboard, no logo, no watermark.`,

    camera:
      "Cinematic",

    mood:
      "Exciting"

  };

}


// ============================================================
// NORMALIZE RESULT
// ============================================================

function normalizeResult(
  data,
  sceneCount,
  duration,
  language
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


  const normalizedScenes = [];


  for (
    let index = 0;
    index < sceneCount;
    index++
  ) {

    const scene =
      scenes[index] || {};


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
      `Photorealistic cinematic cricket action. ${getSceneVisualGuide(index)}`;


    let videoPrompt =
      scene.videoPrompt ||
      `Realistic cinematic cricket movement. ${getSceneVisualGuide(index)}`;


    // --------------------------------------------------------
    // IMAGE SAFETY
    // --------------------------------------------------------

    imagePrompt =
      imagePrompt +
      " Vertical 9:16. Upper 68% visual area. Lower 32% completely empty solid black area. No text, no written words, no numbers, no scoreboard, no statistics, no captions, no logo, no watermark, no graphic overlays.";


    // --------------------------------------------------------
    // VIDEO SAFETY
    // --------------------------------------------------------

    videoPrompt =
      videoPrompt +
      " Realistic natural movement, cinematic camera movement, vertical 9:16, no text, no numbers, no scoreboard, no logo, no watermark.";


    // --------------------------------------------------------
    // OVERLAY FALLBACK
    // --------------------------------------------------------

    const overlay =
      makeFallbackOverlay(
        scene,
        detected,
        language
      );


    normalizedScenes.push({

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
        overlay,

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

    });

  }


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
      normalizedScenes,

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
// SCRIPT REPAIR
// ============================================================

async function repairScript(
  env,
  currentScript,
  news,
  duration,
  language
) {

  const range =
    getScriptRange(duration);


  const languageInstruction =
    language === "english"
      ? "Write natural English."
      : language === "hinglish"
      ? "Write natural Hinglish using Roman Hindi and English."
      : "Write natural Hindi using Devanagari script.";


  const prompt =
`Rewrite and expand this cricket Reel script.

IMPORTANT:
Use ONLY facts contained in NEWS.

Do not add:
- new statistics
- new dates
- new venues
- new records
- new quotes
- new match facts
- new achievements

Target length:
${range.target} words.

For 30 seconds target 75-90 words.

${languageInstruction}

Make it natural for spoken short-video narration.

Keep:
- strong hook
- main news
- important supplied facts
- strong ending

Return ONLY the final script.
Do not return JSON.
Do not explain anything.

NEWS:
${news}

CURRENT SCRIPT:
${currentScript}
`;


  try {

    const result =
      await env.AI.run(
        AI_MODEL,
        {

          messages: [

            {
              role: "system",

              content:
                "You are a professional cricket script editor. Use only the supplied NEWS."
            },

            {
              role: "user",

              content:
                prompt
            }

          ],

          max_tokens:
            1800,

          temperature:
            0.1

        }
      );


    const text =
      cleanAIText(
        getAIText(result)
      );


    if (!text) {
      return currentScript;
    }


    return text;

  } catch (error) {

    return currentScript;

  }

}


// ============================================================
// HEALTH
// ============================================================

async function handleHealth(env) {

  return jsonResponse({

    success:
      true,

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


  // ----------------------------------------------------------
  // READ REQUEST
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // NEWS
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // PROMPT
  // ----------------------------------------------------------

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
                "You are a professional cricket Reel generator. Follow NEWS strictly. Return valid JSON only. Create exactly the requested number of scenes. Every scene must have different visual concepts."
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
    // PARSE JSON
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
                    "Convert the supplied cricket Reel output into valid JSON only. Do not add facts. Preserve the supplied information."
                },

                {
                  role: "user",

                  content:
`Convert this AI output into valid JSON.

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
    // NORMALIZE
    // ========================================================

    let finalResult =
      normalizeResult(
        parsed,
        scenes,
        duration,
        language
      );


    // ========================================================
    // SCRIPT LENGTH CHECK
    // ========================================================

    const range =
      getScriptRange(
        duration
      );


    const currentWords =
      wordCount(
        finalResult.script
      );


    if (
      currentWords < range.min ||
      currentWords > range.max
    ) {

      const repairedScript =
        await repairScript(
          env,
          finalResult.script,
          news,
          duration,
          language
        );


      if (
        repairedScript &&
        wordCount(repairedScript) > 0
      ) {

        finalResult.script =
          repairedScript;

      }

    }


    // ========================================================
    // FINAL RESPONSE
    // ========================================================

    return jsonResponse({

      success:
        true,

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


    // ========================================================
    // OPTIONS
    // ========================================================

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


    // ========================================================
    // HEALTH
    // ========================================================

    if (
      request.method === "GET" &&
      url.pathname ===
        "/api/health"
    ) {

      return handleHealth(
        env
      );

    }


    // ========================================================
    // REEL API
    // ========================================================

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


    // ========================================================
    // UNKNOWN API
    // ========================================================

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


    // ========================================================
    // FRONTEND
    // ========================================================

    return env.ASSETS
      ? env.ASSETS.fetch(
          request
        )
      : new Response(
          "Cricket Reel Maker V3"
        );

  }

};
