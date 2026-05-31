#!/bin/bash

# ポート8080で動作しているプロセスを終了するスクリプト

PORT=8080

echo "ポート${PORT}で動作しているプロセスを確認中..."

# ポート8080を使用しているプロセスを検索
PID=$(lsof -ti:${PORT})

if [ -z "$PID" ]; then
    echo "ポート${PORT}で動作しているプロセスは見つかりませんでした。"
    exit 0
fi

echo "以下のプロセスがポート${PORT}を使用しています:"
lsof -i:${PORT}

echo ""
echo "プロセスID ${PID} を終了中..."
kill -9 $PID

# 終了確認
sleep 2
if lsof -ti:${PORT} > /dev/null 2>&1; then
    echo "プロセスの終了に失敗しました。"
    exit 1
else
    echo "ポート${PORT}のプロセスを正常に終了しました。"
fi