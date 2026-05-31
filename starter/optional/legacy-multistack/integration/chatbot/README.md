# OpenAI / DeepSeek Chatbot

JavaScript chatbot with OpenAI and DeepSeek support.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set your API keys
```

## Usage

### Switch provider
Edit `.env`:
```
PROVIDER=openai    # or deepseek
```

Or use environment variable:
```bash
PROVIDER=deepseek npm start "Hello"
```

### Commands
```bash
# Single message
npm start "Your message"

# Interactive chat
npm run chat
```

## Supported Models

| Provider | Model |
|----------|-------|
| OpenAI   | gpt-4o-mini |
| DeepSeek | deepseek-chat |
