#!/bin/bash
set -euo pipefail

: "${DISCORD_WEBHOOK_URL:?DISCORD_WEBHOOK_URL is required}"

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Webhook Bot",
    "avatar_url": "https://example.com/avatar.png",
    "embeds": [{
      "title": "Sample Embed",
      "description": "This is an example of an embedded message.",
      "color": 5814783
    }]
  }' \
  "$DISCORD_WEBHOOK_URL"
