#!/usr/bin/env bash
set -eo pipefail

# ── ロギング ───────────────────────────────────────────────────────────────────
log_step() { echo ""; echo "▶ $*"; }
log_done() { echo "✓ $*"; }
log_warn() { echo "⚠ $*"; }

# ── Windows PATH 混入除去 ──────────────────────────────────────────────────────
clean_windows_path() {
  log_step "Windows PATH 混入を一時的に除外"
  export PATH="$(
    echo "$PATH" \
      | tr ':' '\n' \
      | grep -v '^/mnt/c/' \
      | grep -v '/.vscode-server/data/User/globalStorage/github.copilot-chat/' \
      | paste -sd ':' -
  )"
  hash -r
}

# ── WSL 設定 ───────────────────────────────────────────────────────────────────
setup_wsl_conf() {
  grep -qi microsoft /proc/version 2>/dev/null || return 0
  log_step "WSL の Windows PATH 自動追加を無効化"
  sudo tee /etc/wsl.conf > /dev/null <<'WSLCONF'
[interop]
appendWindowsPath = false
WSLCONF
}

# ── 基本ツール ─────────────────────────────────────────────────────────────────
install_base_tools() {
  log_step "基本ツールをインストール"
  sudo apt update
  sudo apt install -y curl ca-certificates git
}

# ── nvm + Node.js ──────────────────────────────────────────────────────────────
install_nodejs() {
  log_step "nvm をインストール"
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi

  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"

  log_step "Node.js LTS をインストール"
  nvm install --lts
  nvm use --lts
  nvm alias default 'lts/*'

  hash -r
  log_done "node: $(node -v)  npm: $(npm -v)  ($(which node))"
}

# ── Codex ─────────────────────────────────────────────────────────────────────
install_codex() {
  log_step "既存の Codex を削除"
  npm uninstall -g @openai/codex 2>/dev/null || true

  log_step "Codex をインストール"
  npm install -g @openai/codex

  hash -r
  log_done "codex: $(codex --version)  ($(which codex))"
}

# ── メイン ─────────────────────────────────────────────────────────────────────
main() {
  clean_windows_path
  setup_wsl_conf
  install_base_tools
  install_nodejs
  install_codex

  echo ""
  echo "✅ 完了"
  echo ""
  log_warn "/etc/wsl.conf を変更したため、PowerShell 側で一度実行:"
  echo "   wsl --shutdown"
}

main "$@"
