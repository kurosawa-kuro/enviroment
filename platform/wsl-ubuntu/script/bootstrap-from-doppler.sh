#!/usr/bin/env bash
set -euo pipefail

log() { echo "[BOOTSTRAP] $*" >&1; }
fail() { echo "[ERROR] $*" >&2; exit 1; }

# --- 0) 前提チェック ---
: "${DOPPLER_TOKEN:?DOPPLER_TOKEN is required}"

REPO_DEST="${REPO_DEST:-/opt/playbook}"
ANSIBLE_PLAYBOOK="${ANSIBLE_PLAYBOOK:-site.yml}"
ANSIBLE_INVENTORY="${ANSIBLE_INVENTORY:-localhost,}"
PKG_MANAGER="${PKG_MANAGER:-}"

# --- 1) OS更新 & 基本ツール ---
detect_pkg() {
  if [[ -n "$PKG_MANAGER" ]]; then echo "$PKG_MANAGER"; return; fi
  command -v apt >/dev/null && { echo apt; return; }
  command -v dnf >/dev/null && { echo dnf; return; }
  command -v yum >/dev/null && { echo yum; return; }
  fail "No supported package manager found"
}

PM=$(detect_pkg)
log "Using package manager: $PM"
case "$PM" in
  apt) sudo apt update -y && sudo apt upgrade -y && sudo apt install -y curl git ;;
  dnf) sudo dnf upgrade -y && sudo dnf install -y curl git ;;
  yum) sudo yum update -y && sudo yum install -y curl git ;;
esac

# --- 2) Doppler CLI ---
if ! command -v doppler >/dev/null; then
  log "Installing Doppler CLI"
  curl -Ls https://cli.doppler.com/install.sh | sudo sh
fi

# --- 3) Clone (SSH or HTTPS) ---
mkdir -p "$REPO_DEST" || true

clone_repo() {
  if [[ -n "${REPO_SSH_URL:-}" ]]; then
    log "Cloning via SSH"
    # known_hosts（GitHub）登録
    mkdir -p "$HOME/.ssh"; chmod 700 "$HOME/.ssh"
    ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
    chmod 644 "$HOME/.ssh/known_hosts"

    # 必要なら一時鍵ファイルを作る（Dopplerから注入）
    if [[ -n "${DEPLOY_KEY_PRIVATE:-}" ]]; then
      KEY_PATH="$HOME/.ssh/id_deploy"
      umask 077
      printf "%s" "${DEPLOY_KEY_PRIVATE}" > "$KEY_PATH"
      chmod 600 "$KEY_PATH"
      GIT_SSH_COMMAND="ssh -i $KEY_PATH -o StrictHostKeyChecking=yes"
      export GIT_SSH_COMMAND
    fi

    if [[ -d "$REPO_DEST/.git" ]]; then
      (cd "$REPO_DEST" && doppler run -- git pull --ff-only)
    else
      doppler run -- git clone "${REPO_SSH_URL}" "$REPO_DEST"
    fi

    # 一時鍵は削除（原則ファイル残さない）
    [[ -n "${KEY_PATH:-}" ]] && shred -u "$KEY_PATH" || true

  elif [[ -n "${REPO_HTTPS_URL:-}" ]]; then
    log "Cloning via HTTPS"
    if [[ -d "$REPO_DEST/.git" ]]; then
      (cd "$REPO_DEST" && doppler run -- git pull --ff-only)
    else
      doppler run -- git clone "${REPO_HTTPS_URL}" "$REPO_DEST"
    fi
  else
    fail "REPO_SSH_URL or REPO_HTTPS_URL is required"
  fi
}

clone_repo

# --- 4) Ansible ---
if ! command -v ansible >/dev/null; then
  log "Installing Ansible"
  case "$PM" in
    apt) sudo apt install -y ansible ;;
    dnf) sudo dnf install -y ansible ;;
    yum) sudo yum install -y ansible ;;
  esac
fi

# --- 5) Playbook 実行 ---
log "Running Ansible Playbook: $ANSIBLE_PLAYBOOK"
cd "$REPO_DEST"
doppler run -- ansible-playbook -i "$ANSIBLE_INVENTORY" -c local "$ANSIBLE_PLAYBOOK"
log "Done."
