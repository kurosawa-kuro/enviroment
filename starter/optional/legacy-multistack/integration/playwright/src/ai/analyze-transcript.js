import OpenAI from "openai/index.mjs";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const provider = process.env.PROVIDER || "openai";

const defaultModels = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
};

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    model: process.env.MODEL || defaultModels.openai,
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
    model: process.env.MODEL || defaultModels.deepseek,
  },
};

const currentConfig = config[provider];
const openai = new OpenAI({
  apiKey: currentConfig.apiKey,
  baseURL: currentConfig.baseURL,
});

const SYSTEM_PROMPT = `You are an analytical assistant for geopolitical and macro-risk analysis.

Your role is NOT to judge correctness or ideology.
Your role is to:
- Extract structure
- Preserve the speaker's intent
- Rephrase claims in a neutral, analytical tone
- Avoid speculation beyond the given text

Important constraints:
- Do NOT add facts that are not explicitly or implicitly present.
- Do NOT exaggerate or soften claims.
- Do NOT evaluate truthfulness.
- Do NOT use emotional or persuasive language.

Focus on:
- Actors
- Actions
- Strategies
- Cause-effect relationships
- Implications for geopolitical stability and market volatility`;

const USER_PROMPT_TEMPLATE = `The following is a pre-processed transcript of a YouTube video.
It has already been normalized and split into semantic chunks.

Input format:
- Each chunk represents a coherent part of the argument.
- Sentence order and boundaries are reliable.
- Some expressions may be colloquial or indirect; interpret conservatively.

Your tasks:

1. For EACH chunk:
   - Write a one-sentence neutral summary.
   - Identify the main idea in analytical terms.

2. For the ENTIRE video:
   - Identify the core thesis.
   - Describe the proposed strategy or mechanism, if any.
   - List the main actors mentioned or implied.

3. Risk & market perspective:
   - Assess whether the content implies:
     a) Short-term market impact
     b) Medium-term volatility potential
   - Classify the risk nature as:
     - direct military
     - indirect / political
     - economic / sanctions
     - informational / psychological
   (multiple allowed)

4. Output format (STRICT JSON):

{
  "chunkSummaries": [
    {
      "chunkId": number,
      "summary": string,
      "mainIdea": string
    }
  ],
  "overallAnalysis": {
    "coreThesis": string,
    "strategyOrMechanism": string,
    "actors": [string]
  },
  "riskAssessment": {
    "shortTermImpact": "low | medium | high",
    "mediumTermVolatility": "low | medium | high",
    "riskTypes": [string]
  }
}

Do not include explanations outside the JSON.

---

Transcript chunks:
`;

async function analyzeTranscript(inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputPath, "utf-8");
  let chunks;

  try {
    chunks = JSON.parse(rawData);
  } catch (e) {
    console.error(`Error: Invalid JSON in ${inputPath}`);
    process.exit(1);
  }

  const chunksText = JSON.stringify(chunks, null, 2);
  const userPrompt = USER_PROMPT_TEMPLATE + chunksText;

  console.log(`Analyzing with ${provider} (${currentConfig.model})...`);

  const response = await openai.chat.completions.create({
    model: currentConfig.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const result = response.choices[0].message.content;

  try {
    const parsed = JSON.parse(result);
    return parsed;
  } catch (e) {
    console.error("Warning: Response was not valid JSON, returning raw text");
    return { raw: result };
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: node analyze-transcript.js <chunked.json> [output.json]");
    console.log("");
    console.log("Example:");
    console.log("  node analyze-transcript.js ./chunked.json ./analysis.json");
    process.exit(0);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  try {
    const analysis = await analyzeTranscript(inputPath);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
      console.log(`Analysis saved to: ${outputPath}`);
    } else {
      console.log(JSON.stringify(analysis, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
