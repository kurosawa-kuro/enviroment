#!/usr/bin/env bash
set -eo pipefail

# ── ロギング ───────────────────────────────────────────────────────────────────
log_step() { echo ""; echo "▶ $*"; }
log_done() { echo "✓ $*"; }
log_warn() { echo "⚠ $*"; }
log_error() { echo "✗ $*" >&2; }

DOPPLER_PROJECT="kuro-dev-k"
DOPPLER_CONFIG="dev"

REPO_DEST="${REPO_DEST:-/opt/playbook}"
ANSIBLE_PLAYBOOK="${ANSIBLE_PLAYBOOK:-playbooks/main.yml}"
ANSIBLE_INVENTORY="${ANSIBLE_INVENTORY:-localhost,}"

# ── パッケージマネージャー検出 ─────────────────────────────────────────────────
detect_pkg_manager() {
  command -v apt >/dev/null && { echo apt; return; }
  command -v dnf >/dev/null && { echo dnf; return; }
  command -v yum >/dev/null && { echo yum; return; }
  log_error "サポートされているパッケージマネージャーが見つかりません"
  exit 1
}

# ── 基本ツール インストール ────────────────────────────────────────────────────
install_base_tools() {
  log_step "OS 更新 & 基本ツールをインストール"
  local pm
  pm=$(detect_pkg_manager)
  case "$pm" in
    apt) sudo apt update -y && sudo apt upgrade -y && sudo apt install -y curl git ;;
    dnf) sudo dnf upgrade -y && sudo dnf install -y curl git ;;
    yum) sudo yum update -y && sudo yum install -y curl git ;;
  esac
  log_done "基本ツール: OK (${pm})"
}

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

# ── DOPPLER_TOKEN 確保 ─────────────────────────────────────────────────────────
ensure_doppler_token() {
  if [[ -n "${DOPPLER_TOKEN:-}" ]]; then
    log_done "DOPPLER_TOKEN は既に設定済み"
    return 0
  fi
  log_step "DOPPLER_TOKEN を Doppler から取得 (${DOPPLER_PROJECT} / ${DOPPLER_CONFIG})"
  DOPPLER_TOKEN=$(doppler secrets get DOPPLER_TOKEN \
    --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain)
  export DOPPLER_TOKEN
  log_done "DOPPLER_TOKEN を取得しました"
}

# ── リポジトリ クローン ────────────────────────────────────────────────────────
clone_repo() {
  mkdir -p "${REPO_DEST}"

  if [[ -n "${REPO_SSH_URL:-}" ]]; then
    log_step "SSH でリポジトリをクローン: ${REPO_SSH_URL}"
    mkdir -p "$HOME/.ssh"; chmod 700 "$HOME/.ssh"
    ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
    chmod 644 "$HOME/.ssh/known_hosts"

    local ssh_key="${GITHUB_SSH_PRIVATE_KEY:-}"
    if [[ -n "$ssh_key" ]]; then
      local key_path="$HOME/.ssh/id_deploy"
      umask 077
      printf "%s" "${ssh_key}" > "${key_path}"
      chmod 600 "${key_path}"
      export GIT_SSH_COMMAND="ssh -i ${key_path} -o StrictHostKeyChecking=yes"
    fi

    if [[ -d "${REPO_DEST}/.git" ]]; then
      (cd "${REPO_DEST}" && doppler run -- git pull --ff-only)
    else
      doppler run -- git clone "${REPO_SSH_URL}" "${REPO_DEST}"
    fi

    [[ -n "${key_path:-}" ]] && shred -u "${key_path}" 2>/dev/null || true

  elif [[ -n "${REPO_HTTPS_URL:-}" ]]; then
    log_step "HTTPS でリポジトリをクローン: ${REPO_HTTPS_URL}"
    if [[ -d "${REPO_DEST}/.git" ]]; then
      (cd "${REPO_DEST}" && doppler run -- git pull --ff-only)
    else
      doppler run -- git clone "${REPO_HTTPS_URL}" "${REPO_DEST}"
    fi

  else
    log_error "REPO_SSH_URL または REPO_HTTPS_URL が必要です"
    exit 1
  fi

  log_done "リポジトリ: ${REPO_DEST}"
}

# ── Ansible インストール ───────────────────────────────────────────────────────
install_ansible() {
  if command -v ansible >/dev/null; then
    log_done "Ansible は既にインストール済み: $(ansible --version | head -1)"
    return 0
  fi
  log_step "Ansible をインストール"
  local pm
  pm=$(detect_pkg_manager)
  case "$pm" in
    apt) sudo apt install -y ansible ;;
    dnf) sudo dnf install -y ansible ;;
    yum) sudo yum install -y ansible ;;
  esac
  log_done "ansible: $(ansible --version | head -1)"
}

# ── Playbook 実行 ──────────────────────────────────────────────────────────────
run_playbook() {
  local playbook="${REPO_DEST}/${ANSIBLE_PLAYBOOK}"

  # フォールバックパス
  if [[ ! -f "$playbook" ]]; then
    for candidate in \
      "${REPO_DEST}/ansible/playbooks/${ANSIBLE_PLAYBOOK}" \
      "${REPO_DEST}/ansible/${ANSIBLE_PLAYBOOK}"; do
      [[ -f "$candidate" ]] && { playbook="$candidate"; break; }
    done
  fi

  if [[ ! -f "$playbook" ]]; then
    log_error "Playbook が見つかりません: ${ANSIBLE_PLAYBOOK}"
    exit 1
  fi

  log_step "Ansible Playbook を実行: ${playbook}"
  cd "${REPO_DEST}"
  doppler run -- ansible-playbook -i "${ANSIBLE_INVENTORY}" -c local "${playbook}"
  log_done "Playbook 完了"
}

# ── メイン ─────────────────────────────────────────────────────────────────────
main() {
  install_base_tools
  install_doppler
  ensure_doppler_token
  clone_repo
  install_ansible
  run_playbook

  echo ""
  echo "✅ 完了"
}

main "$@"
