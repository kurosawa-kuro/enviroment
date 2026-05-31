import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const provider = process.env.PROVIDER || "openai";

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
};

const currentConfig = config[provider];
const openai = new OpenAI({
  apiKey: currentConfig.apiKey,
  baseURL: currentConfig.baseURL,
});

async function chat(message) {
  const response = await openai.chat.completions.create({
    model: currentConfig.model,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: message },
    ],
  });

  return response.choices[0].message.content;
}

async function main() {
  const userMessage = process.argv[2] || "Hello! What can you do?";
  console.log(`[${provider}] User: ${userMessage}`);

  const reply = await chat(userMessage);
  console.log(`Assistant: ${reply}`);
}

main().catch(console.error);
