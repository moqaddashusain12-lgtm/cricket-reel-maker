// ============================================================
// 🏏 CRICKET REEL MAKER V3 - WORKER
// AI REEL GENERATOR + ROBUST JSON PARSER
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

  // Remove markdown code fences
  s = s.replace(/^```json\s*/i, "");
  s = s.replace(/^```\s*/i, "");
  s = s.replace(/\s*```$/i, "");

  return s.trim();
}


// ============================================================
// EXTRACT JSON FROM AI RESPONSE
// ============================================================

function extractJSON(text) {

  if (!text) {
    throw new Error("AI ने कोई response नहीं दिया।");
  }

  const cleaned = cleanAIText(text);

  // First direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue with extraction
  }


  // Find first { and last }
  const firstObject = cleaned.indexOf("{");
  const lastObject = cleaned.lastIndexOf("}");

  if (firstObject !== -1 && lastObject > firstObject) {

    const candidate =
      cleaned.slice(firstObject, lastObject + 1);

    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Continue
    }
  }


  // Find first [ and last ]
  const firstArray = cleaned.indexOf("[");
  const lastArray = cleaned.lastIndexOf("]");

  if (firstArray !== -1 && lastArray > firstArray) {

    const candidate =
      cleaned.slice(firstArray, lastArray + 1);

    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Continue
    }
  }


  throw new Error(
    "AI response JSON में convert नहीं हो पाया।"
  );
}


// ============================================================
// GET AI TEXT FROM WORKERS AI RESPONSE
// ============================================================

function getAIText(result) {

  if (typeof result === "string") {
    return result;
  }

  if (!result) {
    return "";
  }


  // Common Workers AI response
  if (typeof result.response === "string") {
    return result.response;
  }


  // Some responses may contain result.response
  if (
    result.result &&
    typeof result.result.response === "string"
  ) {
    return result.result.response;
  }


  // If output is already an object
  if (typeof result === "object") {

    if (result.response && typeof result.response === "object") {
      return JSON.stringify(result.response);
    }

    if (result.output && typeof result.output === "string") {
      return result.output;
    }

    if (result.text && typeof result.text === "string") {
      return result.text;
    }

  }


  return "";
}


// ============================================================
// AI PROMPT
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
      ? "Write the narration in clear natural English."
      : language === "hinglish"
      ? "Write the narration in natural Hinglish using Roman Hindi/English."
      : "Write the narration in natural Hindi using Devanagari script.";


  const durationWords =
    duration === 15
      ? "about 35 to 45 words"
      : duration === 30
      ? "about 70 to 85 words"
      : duration === 45
      ? "about 105 to 125 words"
      : "about 140 to 165 words";


  return `You are an expert cricket news Reel writer.

Create a short-form cricket Reel from ONLY the information supplied in the NEWS below.

IMPORTANT FACT RULES:
1. Use ONLY facts present in the supplied NEWS.
2. NEVER invent statistics.
3. NEVER invent dates.
4. NEVER invent venues.
5. NEVER invent quotes.
6. NEVER invent match results.
7. NEVER invent player records.
8. NEVER add information from your own knowledge.
9. If a fact is not present in NEWS, do not mention it.
10. Player, team, opponent, topic and match type must be detected from NEWS.
11. The user may have entered AUTO for player/opponent. AUTO means detect automatically.
12. Do not blindly trust the manual player/opponent fields if NEWS clearly identifies something else.

REEL SETTINGS:

Player / Team input: ${player}
Opponent / Team input: ${opponent}
Duration: ${duration} seconds
Number of scenes: ${scenes}
Style: ${style}
Language: ${language}
Platform: ${platform}

${languageInstruction}

SCRIPT:
Create a strong opening hook and exciting short cricket narration.

Target narration length: ${durationWords}.

SCENES:
Create exactly ${scenes} scenes.

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

IMAGE PROMPT RULES:
- Photorealistic cricket photography
- Cinematic sports lighting
- Realistic players
- Realistic cricket stadium
- Vertical 9:16 composition
- Upper 68 percent is the visual area
- Lower 32 percent must be a completely empty solid black area
- NO text
- NO captions
- NO scoreboard
- NO logo
- NO watermark
- Do not put written words inside the generated image

VIDEO PROMPT RULES:
- Realistic cricket movement
- Cinematic camera movement
- Natural player motion
- Realistic stadium atmosphere
- Vertical 9:16
- No text
- No logo
- No watermark

OVERLAY:
Create short Hindi/English/Hinglish text suitable for the lower 32 percent black area.
Do not add facts that are not in NEWS.

TITLE:
Create an engaging short Reel title based only on NEWS.

CAPTION:
Create a short social-media caption based only on NEWS.

HASHTAGS:
Create relevant cricket hashtags.

MUSIC:
Suggest a suitable royalty-free/background music style, not a copyrighted song lyric.

VERY IMPORTANT:
Return ONLY valid JSON.
Do not write any explanation before or after the JSON.
Do not use Markdown code fences.

RETURN EXACTLY THIS JSON STRUCTURE:

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

function normalizeResult(data, sceneCount) {

  const result = data || {};

  const detected = result.detected || {};

  let scenes = Array.isArray(result.scenes)
    ? result.scenes
    : [];


  // Ensure exactly requested number where possible
  scenes = scenes.slice(0, sceneCount);


  return {

    detected: {
      player: detected.player || "",
      team: detected.team || "",
      opponent: detected.opponent || "",
      topic: detected.topic || "",
      matchType: detected.matchType || ""
    },

    script: result.script || "",

    scenes: scenes.map((scene, index) => ({

      number: scene.number || index + 1,

      title: scene.title || `Scene ${index + 1}`,

      timing: scene.timing || "",

      narration: scene.narration || "",

      overlay: scene.overlay || "",

      imagePrompt: scene.imagePrompt || "",

      videoPrompt: scene.videoPrompt || "",

      camera: scene.camera || "",

      mood: scene.mood || ""

    })),

    title: result.title || "",

    caption: result.caption || "",

    hashtags: Array.isArray(result.hashtags)
      ? result.hashtags
      : [],

    music: result.music || ""

  };
}


// ============================================================
// HEALTH
// ============================================================

async function handleHealth(env) {

  return jsonResponse({

    success: true,

    app: "Cricket Reel Maker V3",

    workersAI: !!env.AI,

    model: AI_MODEL

  });

}


// ============================================================
// REEL GENERATOR
// ============================================================

async function handleReel(request, env) {

  if (!env.AI) {

    return jsonResponse({

      success: false,

      error: "Workers AI binding 'AI' नहीं मिला।"

    }, 500);

  }


  let input;


  try {

    input = await request.json();

  } catch (error) {

    return jsonResponse({

      success: false,

      error: "Invalid JSON request."

    }, 400);

  }


  const news =
    typeof input.news === "string"
      ? input.news.trim()
      : "";


  if (!news) {

    return jsonResponse({

      success: false,

      error: "Cricket news खाली है।"

    }, 400);

  }


  const durationOptions=[15,30,45,60];

  const sceneOptions=[3,5,7];


  const duration =
    durationOptions.includes(Number(input.duration))
      ? Number(input.duration)
      : 30;


  const scenes =
    sceneOptions.includes(Number(input.scenes))
      ? Number(input.scenes)
      : 5;


  const player =
    String(input.player || "AUTO");


  const opponent =
    String(input.opponent || "AUTO");


  const style =
    String(input.style || "exciting");


  const language =
    String(input.language || "hindi");


  const platform =
    String(input.platform || "facebook");


  const prompt=buildPrompt({

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

    const aiResult = await env.AI.run(

      AI_MODEL,

      {
        messages: [

          {
            role: "system",

            content:
              "You are a precise cricket content generator. Return valid JSON only."

          },

          {
            role: "user",

            content: prompt

          }

        ],

        max_tokens: 5000,

        temperature: 0.2

      }

    );


    const aiText=getAIText(aiResult);


    if(!aiText){

      return jsonResponse({

        success:false,

        error:
          "AI ने खाली response दिया।"

      },500);

    }


    let parsed;


    try {

      parsed=extractJSON(aiText);

    } catch(error) {

      // One automatic repair attempt
      try {

        const repairResult=await env.AI.run(

          AI_MODEL,

          {

            messages:[

              {
                role:"system",

                content:
                  "Convert the supplied content into valid JSON only. Do not add facts."
              },

              {
                role:"user",

                content:
`Convert this AI output into the required JSON structure.

Return ONLY valid JSON.

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

            max_tokens:5000,

            temperature:0

          }

        );


        const repairedText=getAIText(repairResult);

        parsed=extractJSON(repairedText);


      } catch(repairError) {

        return jsonResponse({

          success:false,

          error:
            "AI response JSON में convert नहीं हो पाया।"

        },500);

      }

    }


    const finalResult=
      normalizeResult(parsed,scenes);


    return jsonResponse({

      success:true,

      result:finalResult

    });

  } catch(error) {

    return jsonResponse({

      success:false,

      error:
        "AI generation failed: "+
        (error?.message || "Unknown error")

    },500);

  }

}


// ============================================================
// MAIN FETCH
// ============================================================

export default {

  async fetch(request, env) {

    const url=new URL(request.url);


    // OPTIONS / CORS
    if(request.method==="OPTIONS"){

      return new Response(null,{

        status:204,

        headers:corsHeaders()

      });

    }


    // Health
    if(
      request.method==="GET" &&
      url.pathname==="/api/health"
    ){

      return handleHealth(env);

    }


    // Reel
    if(
      request.method==="POST" &&
      url.pathname==="/api/reel"
    ){

      return handleReel(request,env);

    }


    // Unknown API
    if(url.pathname.startsWith("/api/")){

      return jsonResponse({

        success:false,

        error:"API endpoint not found."

      },404);

    }


    // Static assets are handled by Cloudflare Assets
    return env.ASSETS
      ? env.ASSETS.fetch(request)
      : new Response("Cricket Reel Maker V3");

  }

};
