#!/bin/bash

# doppler-secrets-display.sh
# Doppler secret namesを表示するシェルスクリプト

set -e  # エラー時にスクリプトを停止

# Dopplerログイン状態をチェック
if ! doppler me > /dev/null 2>&1; then
    echo "Dopplerアカウントにログインしています..."
    # Dopplerアカウントへログイン
    doppler login
else
    echo "Dopplerアカウントは既にログイン済みです。スキップします。"
fi

# プロジェクト設定状態をチェック
if ! doppler configure > /dev/null 2>&1; then
    echo "プロジェクト設定を行っています..."
    # プロジェクト設定（初回のみ）
    doppler setup
else
    echo "プロジェクト設定は既に完了しています。スキップします。"
fi

echo "Doppler secret namesを表示しています..."

# Dopplerコマンドを実行
doppler secrets \
  --only-names

# 終了コードを取得
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo -e "\nDoppler process completed successfully"
else
    echo -e "\nDoppler process failed with exit code $exit_code"
    exit $exit_code
fi
