import OpenAI from "openai/index.mjs";
import dotenv from "dotenv";
import * as readline from "readline";

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

const conversationHistory = [
  { role: "system", content: "You are a helpful assistant." },
];

async function chat(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const response = await openai.chat.completions.create({
    model: currentConfig.model,
    messages: conversationHistory,
  });

  const assistantMessage = response.choices[0].message.content;
  conversationHistory.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`Chatbot [${provider}] (type 'exit' to quit)\n`);

  const prompt = () => {
    rl.question("You: ", async (input) => {
      const userInput = input.trim();

      if (userInput.toLowerCase() === "exit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (!userInput) {
        prompt();
        return;
      }

      try {
        const reply = await chat(userInput);
        console.log(`\nAssistant: ${reply}\n`);
      } catch (error) {
        console.error(`Error: ${error.message}\n`);
      }

      prompt();
    });
  };

  prompt();
}

main();
