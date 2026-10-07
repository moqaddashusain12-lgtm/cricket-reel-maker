// ============================================================
// 🏏 CRICKET REEL MAKER V3 - FINAL WORKER
// AI REEL GENERATOR
// ROBUST JSON + SMART SCENES + MANDATORY TEXT OVERLAY
// ============================================================

const AI_MODEL =
  "@cf/meta/llama-3.1-8b-instruct-fast";


// ============================================================
// CORS
// ============================================================

function corsHeaders() {

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Content-Type":
      "application/json; charset=UTF-8"
  };

}


// ============================================================
// JSON RESPONSE
// ============================================================

function jsonResponse(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:
        corsHeaders()
    }
  );

}


// ============================================================
// CLEAN AI RESPONSE
// ============================================================

function cleanAIText(text) {

  if (
    typeof text !== "string"
  ) {

    return "";

  }


  let s =
    text.trim();


  s =
    s.replace(
      /^```json\s*/i,
      ""
    );


  s =
    s.replace(
      /^```\s*/i,
      ""
    );


  s =
    s.replace(
      /\s*```$/i,
      ""
    );


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

    return JSON.parse(
      cleaned
    );

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

      return JSON.parse(
        candidate
      );

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

      return JSON.parse(
        candidate
      );

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

  if (
    typeof result === "string"
  ) {

    return result;

  }


  if (!result) {

    return "";

  }


  if (
    typeof result.response ===
    "string"
  ) {

    return result.response;

  }


  if (
    result.result &&
    typeof result.result.response ===
      "string"
  ) {

    return result.result.response;

  }


  if (
    result.response &&
    typeof result.response ===
      "object"
  ) {

    return JSON.stringify(
      result.response
    );

  }


  if (
    typeof result.output ===
      "string"
  ) {

    return result.output;

  }


  if (
    typeof result.text ===
      "string"
  ) {

    return result.text;

  }


  return "";

}


// ============================================================
// SHORT OVERLAY FALLBACK
// ============================================================

function makeShortOverlay(
  text,
  maxLength = 60
) {

  if (
    !text ||
    typeof text !== "string"
  ) {

    return "";

  }


  let clean =
    text
      .replace(/\s+/g, " ")
      .trim();


  if (!clean) {

    return "";

  }


  /*
    First sentence लेने की कोशिश।
  */

  const sentence =
    clean.match(
      /^(.+?[।.!?])(?:\s|$)/
    );


  if (sentence) {

    clean =
      sentence[1].trim();

  }


  /*
    बहुत लंबा होने पर छोटा करें।
  */

  if (
    clean.length >
    maxLength
  ) {

    clean =
      clean
        .slice(
          0,
          maxLength
        )
        .trim();


    const lastSpace =
      clean.lastIndexOf(" ");


    if (
      lastSpace > 20
    ) {

      clean =
        clean.slice(
          0,
          lastSpace
        );

    }


    clean +=
      "…";

  }


  return clean;

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

      ? "Write all narration, overlay and social text in natural English."

      : language === "hinglish"

      ? "Write all narration, overlay and social text in natural Hinglish using Roman Hindi and English."

      : "Write all narration, overlay and social text in natural Hindi using Devanagari script.";


  const durationWords =
    duration === 15

      ? "40-50 words"

      : duration === 30

      ? "75-90 words"

      : duration === 45

      ? "110-130 words"

      : "150-175 words";


  return `You are an expert cricket short-video content creator.

Create a HIGH-QUALITY cricket Reel using ONLY the supplied NEWS.

============================================================
ABSOLUTE FACT RULE
============================================================

Use ONLY information contained in NEWS.

NEVER invent or assume:

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
- batting positions
- bowling figures
- rankings
- awards

If a fact is not present in NEWS, do not mention it.

Do not use outside cricket knowledge.

If opponent is not mentioned in NEWS,
keep opponent empty.

If team is directly identified from
"भारतीय खिलाड़ी" or equivalent wording,
team may be "भारत".

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
SCRIPT LENGTH - VERY IMPORTANT
============================================================

The complete narration script MUST be approximately:

${durationWords}

For 30 seconds:
TARGET 75-90 WORDS.

Do NOT make a 30-second script only 40-60 words.

The script should have:

1. Strong opening hook
2. Main news/record
3. Important supporting facts from NEWS
4. Strong ending

Do not repeat the same sentence.

Do not add facts that are not in NEWS.

============================================================
SCENE NARRATION
============================================================

Create EXACTLY ${scenes} scenes.

The scene narrations together must cover the
complete story.

Each scene must contain a DIFFERENT part
of the supplied NEWS.

Do not repeat identical narration.

============================================================
SCENE TIMING
============================================================

Divide the complete ${duration}-second duration evenly.

Examples:

30 sec / 5 scenes:

Scene 1 = 0-6
Scene 2 = 6-12
Scene 3 = 12-18
Scene 4 = 18-24
Scene 5 = 24-30

The final scene MUST end exactly at
${duration} seconds.

============================================================
DIFFERENT VISUALS - MANDATORY
============================================================

Every scene MUST have a substantially
different visual concept.

Do NOT use the same portrait or same
batting pose for every scene.

Change:

- action
- camera angle
- composition
- distance
- body position
- cricket moment
- stadium perspective

Example visual progression:

Scene 1:
Player introduction / intense cricket moment

Scene 2:
Powerful batting action

Scene 3:
Record or achievement celebration

Scene 4:
Specific cricket action connected to another
fact in NEWS

Scene 5:
Emotional celebration / confident close-up /
final ending

These are examples only.

Use only visuals appropriate to NEWS.

============================================================
IMAGE PROMPT - MANDATORY
============================================================

Create ONE detailed imagePrompt for EACH scene.

Every imagePrompt must be substantially
different from the other scenes.

Use:

Photorealistic cinematic cricket photography,
realistic player appearance,
realistic cricket stadium,
natural human anatomy,
professional sports photography,
dramatic stadium lighting,
realistic crowd,
high detail,
vertical 9:16.

LAYOUT:

Upper 68%:
Main cricket visual.

Lower 32%:
Completely empty solid black area.

ABSOLUTELY NO:

text
written words
numbers
scoreboard
statistics
captions
logos
watermark
graphic overlays
readable banners
jersey text

Do NOT ask the image generator to render
any text or numbers.

Statistics will be added later by the editor.

============================================================
VISUAL VARIETY
============================================================

Use different visual concepts.

For example:

Scene 1:
dramatic player introduction with stadium wide angle

Scene 2:
dynamic batting action from side angle

Scene 3:
celebration after achievement with crowd reaction

Scene 4:
different cricket action related to NEWS

Scene 5:
cinematic close-up / celebration / final moment

Do NOT repeat the same portrait.

============================================================
VIDEO PROMPT - MANDATORY MOTION
============================================================

Every videoPrompt MUST describe motion.

Do NOT simply copy imagePrompt.

Describe:

- player movement
- bat movement
- body movement
- natural cricket action
- crowd movement
- camera movement
- stadium atmosphere
- cinematic motion

Use a DIFFERENT camera movement
for different scenes.

Examples:

Scene 1:
slow cinematic push-in

Scene 2:
tracking camera following batting movement

Scene 3:
slow-motion celebration

Scene 4:
dynamic side tracking

Scene 5:
smooth close-up pull-back

These are examples only.

Video must be:

realistic
cinematic
vertical 9:16
natural motion
no text
no numbers
no scoreboard
no logo
no watermark

============================================================
TEXT OVERLAY - EXTREMELY IMPORTANT
============================================================

EVERY SINGLE SCENE MUST HAVE A TEXT OVERLAY.

The "overlay" field MUST NEVER be empty.

Create a short, powerful overlay
for EVERY scene.

Overlay must use ONLY facts or wording
supported by NEWS.

Maximum approximately 3-8 words.

Good examples:

"ईशान किशन का बड़ा कारनामा"

"विराट कोहली का रिकॉर्ड टूटा"

"1644 टी20 रन"

"IPL 2026 में 602 रन"

Do NOT invent numbers.

Numbers are allowed in overlay.

Numbers are NOT allowed in imagePrompt.

IMPORTANT:

If a scene does not have a suitable
statistic, use a short fact-based phrase
from NEWS.

NEVER leave overlay blank.

============================================================
SCENE 5 CTA
============================================================

Scene 5 overlay may include:

"ऐसी क्रिकेट खबरों के लिए फॉलो करें"

Only use CTA if appropriate.

CTA is not a cricket fact.

============================================================
TITLE
============================================================

Create an exciting short Reel title.

Use ONLY NEWS facts.

============================================================
CAPTION
============================================================

Create a short social-media caption.

Use ONLY NEWS facts.

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
JSON OUTPUT
============================================================

Return ONLY valid JSON.

No explanation.

No Markdown.

No code fences.

Use exactly:

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

FINAL CHECK BEFORE ANSWERING:

- Exactly ${scenes} scenes
- Script approximately ${durationWords}
- Every scene has different visual
- Every scene has different video motion
- Every scene has non-empty overlay
- Image prompts contain no text/numbers
- No invented facts
- Final timing ends at ${duration}
- Valid JSON only

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


  /*
    अगर AI ने कम scenes दिए,
    तो missing scenes भी बनाएं।
  */

  while (
    scenes.length <
    sceneCount
  ) {

    scenes.push({});

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
      scenes.map(
        (scene,index)=>{

          const start =
            Math.round(
              duration *
              index /
              sceneCount
            );


          const end =
            Math.round(
              duration *
              (index+1) /
              sceneCount
            );


          const narration =
            String(
              scene.narration ||
              ""
            ).trim();


          /*
            IMPORTANT OVERLAY FIX

            Priority:
            1. AI overlay
            2. Narration का short version
            3. Scene 5 CTA
          */

          let overlay =
            String(
              scene.overlay ||
              ""
            ).trim();


          if (!overlay) {

            overlay =
              makeShortOverlay(
                narration
              );

          }


          if (
            !overlay &&
            index ===
              sceneCount-1
          ) {

            overlay =
              "ऐसी क्रिकेट खबरों के लिए फॉलो करें";

          }


          /*
            Image prompt
          */

          let imagePrompt =
            String(
              scene.imagePrompt ||
              ""
            ).trim();


          if (!imagePrompt) {

            imagePrompt =
              "Photorealistic cinematic cricket scene with a realistic cricket player performing a natural cricket action in a professional stadium, dramatic stadium lighting, realistic crowd";

          }


          /*
            Video prompt
          */

          let videoPrompt =
            String(
              scene.videoPrompt ||
              ""
            ).trim();


          if (!videoPrompt) {

            videoPrompt =
              "Natural realistic cricket movement with player body movement, realistic bat movement, moving crowd and cinematic camera motion";

          }


          /*
            Force image safety.
          */

          imagePrompt +=
            " Vertical 9:16. Upper 68% visual area. Lower 32% completely empty solid black area. No text, no written words, no numbers, no scoreboard, no statistics, no captions, no logo, no watermark, no graphic overlays.";


          /*
            Force video safety.
          */

          videoPrompt +=
            " Realistic natural movement, cinematic camera movement, vertical 9:16, no text, no numbers, no scoreboard, no logo, no watermark.";


          return {

            number:
              index+1,

            title:
              scene.title ||
              `Scene ${index+1}`,

            timing:
              `${start}-${end}`,

            narration:
              narration,

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

    success:true,

    app:
      "Cricket Reel Maker V3",

    workersAI:
      !!env.AI,

    model:
      AI_MODEL

  });

}


// ============================================================
// HANDLE REEL
// ============================================================

async function handleReel(
  request,
  env
) {

  if (!env.AI) {

    return jsonResponse(
      {
        success:false,
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

  } catch(error) {

    return jsonResponse(
      {
        success:false,
        error:
          "Invalid JSON request."
      },
      400
    );

  }


  const news =
    typeof input.news ===
      "string"
      ? input.news.trim()
      : "";


  if (!news) {

    return jsonResponse(
      {
        success:false,
        error:
          "Cricket news खाली है।"
      },
      400
    );

  }


  const durationOptions =
    [15,30,45,60];


  const sceneOptions =
    [3,5,7];


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
      input.player ||
      "AUTO"
    );


  const opponent =
    String(
      input.opponent ||
      "AUTO"
    );


  const style =
    String(
      input.style ||
      "exciting"
    );


  const language =
    String(
      input.language ||
      "hindi"
    );


  const platform =
    String(
      input.platform ||
      "facebook"
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

          messages:[

            {
              role:"system",

              content:
                "You are a professional cricket Reel generator. Follow the supplied NEWS strictly. Never invent facts. Return valid JSON only. Every scene MUST have a non-empty overlay. Every scene MUST have a different visual concept and different motion."
            },

            {
              role:"user",

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
          success:false,
          error:
            "AI ने खाली response दिया।"
        },
        500
      );

    }


    let parsed;


    // ========================================================
    // JSON PARSE
    // ========================================================

    try {

      parsed =
        extractJSON(
          aiText
        );

    } catch(error) {

      // ======================================================
      // JSON REPAIR
      // ======================================================

      try {

        const repairResult =
          await env.AI.run(
            AI_MODEL,
            {

              messages:[

                {
                  role:"system",

                  content:
                    "Convert the supplied AI output into valid JSON only. Do not add facts. Preserve supplied information. Every scene must have a non-empty overlay. Do not invent facts."
                },

                {
                  role:"user",

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

IMPORTANT:

Keep exactly ${scenes} scenes.

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

Every scene overlay must NOT be empty.

Do not add facts.

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


      } catch(repairError) {

        return jsonResponse(
          {
            success:false,
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


    return jsonResponse({

      success:true,

      result:
        finalResult

    });


  } catch(error) {

    return jsonResponse(
      {
        success:false,

        error:
          "AI generation failed: "+
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
          status:204,
          headers:
            corsHeaders()
        }
      );

    }


    // ========================================================
    // HEALTH
    // ========================================================

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


    // ========================================================
    // REEL
    // ========================================================

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
          success:false,
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
