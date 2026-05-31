#!/usr/bin/env bash
set -eo pipefail

# ── ロギング ───────────────────────────────────────────────────────────────────
log_step() { echo ""; echo "▶ $*"; }
log_done() { echo "✓ $*"; }
log_warn() { echo "⚠ $*"; }

# ── Doppler CLI インストール ────────────────────────────────────────────────────
install_doppler() {
  if command -v doppler >/dev/null; then
    log_done "Doppler CLI は既にインストール済み: $(doppler --version)"
    return 0
  fi
  log_step "Doppler CLI をインストール"
  curl -Ls https://cli.doppler.com/install.sh | sudo sh
  log_done "doppler: $(doppler --version)"
}

DOPPLER_PROJECT="kuro-dev-k"
DOPPLER_CONFIG="dev"

# ── Doppler ログイン ───────────────────────────────────────────────────────────
login_doppler() {
  log_step "Doppler にログイン"
  doppler login
}

# ── Doppler プロジェクト設定 ───────────────────────────────────────────────────
setup_doppler_project() {
  log_step "Doppler プロジェクトをセットアップ (${DOPPLER_PROJECT} / ${DOPPLER_CONFIG})"
  doppler setup --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --no-interactive
}

# ── メイン ─────────────────────────────────────────────────────────────────────
main() {
  install_doppler
  login_doppler
  setup_doppler_project

  echo ""
  echo "✅ 完了"
  echo ""
  log_warn "DOPPLER_TOKEN でシークレットを取得する場合:"
  echo "  export DOPPLER_TOKEN=dp.st.xxxxx"
  echo "  doppler secrets download --project ${DOPPLER_PROJECT} --config ${DOPPLER_CONFIG} --no-file --format json"
}

main "$@"
