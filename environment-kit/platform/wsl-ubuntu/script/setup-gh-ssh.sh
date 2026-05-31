#!/usr/bin/env bash
set -eo pipefail

# ── ロギング ───────────────────────────────────────────────────────────────────
log_step() { echo ""; echo "▶ $*"; }
log_done() { echo "✓ $*"; }
log_warn() { echo "⚠ $*"; }

DOPPLER_PROJECT="kuro-dev-k"
DOPPLER_CONFIG="dev"
SSH_KEY_PATH="$HOME/.ssh/id_github"
SSH_CONFIG="$HOME/.ssh/config"

# ── Doppler 前提確認 ───────────────────────────────────────────────────────────
check_doppler() {
  log_step "Doppler の状態を確認"
  if ! command -v doppler >/dev/null; then
    echo "ERROR: doppler コマンドが見つかりません。先に setup-doppler.sh を実行してください。" >&2
    exit 1
  fi
  if ! doppler secrets --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" >/dev/null 2>&1; then
    echo "ERROR: Doppler に接続できません。doppler login / doppler setup を確認してください。" >&2
    exit 1
  fi
  log_done "Doppler 接続 OK"
}

# ── SSH 鍵取得 ─────────────────────────────────────────────────────────────────
fetch_ssh_key() {
  log_step "Doppler から SSH 秘密鍵を取得 (GITHUB_SSH_PRIVATE_KEY)"
  mkdir -p "$HOME/.ssh"

  doppler secrets get GITHUB_SSH_PRIVATE_KEY \
    --project "${DOPPLER_PROJECT}" \
    --config "${DOPPLER_CONFIG}" \
    --plain > "${SSH_KEY_PATH}"

  log_done "鍵を書き込み: ${SSH_KEY_PATH}"
}

# ── パーミッション設定 ─────────────────────────────────────────────────────────
set_permissions() {
  log_step "パーミッションを設定"
  chmod 700 "$HOME/.ssh"
  chmod 600 "${SSH_KEY_PATH}"
  log_done "~/.ssh: 700  ${SSH_KEY_PATH}: 600"
}

# ── SSH config 追記 ────────────────────────────────────────────────────────────
configure_ssh_config() {
  log_step "~/.ssh/config に GitHub エントリを追記"
  touch "${SSH_CONFIG}"
  chmod 600 "${SSH_CONFIG}"

  if grep -q "Host github.com" "${SSH_CONFIG}" 2>/dev/null; then
    log_done "~/.ssh/config に github.com エントリが既に存在するためスキップ"
    return 0
  fi

  cat >> "${SSH_CONFIG}" <<EOF

Host github.com
  HostName github.com
  User git
  IdentityFile ${SSH_KEY_PATH}
  IdentitiesOnly yes
EOF
  log_done "~/.ssh/config に github.com エントリを追記"
}

# ── Git ユーザー設定 ───────────────────────────────────────────────────────────
configure_git_user() {
  log_step "Git グローバルユーザーを設定"
  git config --global user.name  "toshifumi kurosawa"
  git config --global user.email "kuromailserver@gmail.com"
  log_done "user.name: $(git config --global user.name)  user.email: $(git config --global user.email)"
}

# ── 接続テスト ─────────────────────────────────────────────────────────────────
test_github_ssh() {
  log_step "GitHub SSH 接続テスト"
  # ssh -T は認証成功時も exit code 1 を返すため出力で判定する
  local result
  result=$(ssh -T git@github.com 2>&1 || true)
  if echo "${result}" | grep -q "^Hi "; then
    log_done "${result}"
  else
    log_warn "接続テスト結果: ${result}"
    log_warn "鍵が GitHub に登録されていない可能性があります。"
    log_warn "https://github.com/settings/ssh/new で公開鍵を登録してください。"
  fi
}

# ── メイン ─────────────────────────────────────────────────────────────────────
main() {
  check_doppler
  fetch_ssh_key
  set_permissions
  configure_ssh_config
  configure_git_user
  test_github_ssh

  echo ""
  echo "✅ 完了"
}

main "$@"
