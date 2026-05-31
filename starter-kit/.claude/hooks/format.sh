#!/usr/bin/env bash
# PostToolUse: 編集された Rust / Terraform ファイルを自動整形する。
# stdin の hook JSON から tool_input.file_path を取り出し、拡張子で整形。
# 対象は .rs (rustfmt) と .tf/.tfvars (terraform fmt) のみ。
# ツール未導入・対象外・存在しないパスは no-op。常に exit 0（編集をブロックしない）。
set -uo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))
except Exception:
    pass' 2>/dev/null || true)"

[ -n "$file" ] && [ -f "$file" ] || exit 0

case "$file" in
  *.rs)
    command -v rustfmt >/dev/null 2>&1 && rustfmt --edition 2021 "$file" >/dev/null 2>&1 || true
    ;;
  *.tf|*.tfvars)
    command -v terraform >/dev/null 2>&1 && terraform fmt "$file" >/dev/null 2>&1 || true
    ;;
esac

exit 0
