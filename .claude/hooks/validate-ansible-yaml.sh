#!/usr/bin/env bash
# PostToolUse hook: Ansible 配下の YAML を編集/作成した直後に構文検証する。
# stdin に Claude Code の hook ペイロード(JSON)を受け取り、tool_input.file_path を検査する。
#
# 検証方針:
#   - yamllint が入っていれば yamllint(parsable) を優先
#   - 無ければ PyYAML の safe_load_all でパース検証にフォールバック
# 対象: *.yml / *.yaml かつ パスに "ansible" を含むもの(= ロール/プレイブック/group_vars 等)
#
# 失敗時は PostToolUse の decision=block で reason をモデルに差し戻す(壊れを即検知)。
# 成功・対象外は静かに exit 0。

set -uo pipefail

payload="$(cat)"
f="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"

# 対象外は何もしない
[ -z "$f" ] && exit 0
case "$f" in
  *.yml|*.yaml) ;;
  *) exit 0 ;;
esac
case "$f" in
  *ansible*) ;;
  *) exit 0 ;;
esac
[ -f "$f" ] || exit 0

if command -v yamllint >/dev/null 2>&1; then
  out="$(yamllint -f parsable "$f" 2>&1)"
  rc=$?
else
  out="$(python3 -c 'import sys,yaml
try:
    list(yaml.safe_load_all(open(sys.argv[1])))
except yaml.YAMLError as e:
    print(e); sys.exit(1)' "$f" 2>&1)"
  rc=$?
fi

[ "$rc" -eq 0 ] && exit 0

reason="$(printf 'YAML 検証に失敗しました: %s\n%s' "$f" "$out" | jq -Rs .)"
printf '{"decision":"block","reason":%s}\n' "$reason"
exit 0
