#!/bin/bash

# スクリプトの安全性強化
set -e

echo "🧹 不要なnpmキャッシュと旧モジュールを削除..."
rm -rf ~/.npm-global/lib/node_modules/@anthropic-ai || true
rm -rf ~/.npm/_cacache || true

echo "🔄 パッケージリストを更新..."
sudo apt update

echo "📦 開発に必要なビルドツールをインストール..."
sudo apt install -y build-essential python3 g++ make

echo "📦 node-gyp をグローバルインストール..."
npm install -g node-gyp

echo "🚀 @anthropic-ai/claude-code をグローバルインストール（--unsafe-perm）..."
npm install -g @anthropic-ai/claude-code --unsafe-perm --verbose

echo "✅ インストール完了"