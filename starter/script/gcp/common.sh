#!/usr/bin/env bash
set -euo pipefail

log_info() {
  printf '[INFO] %s\n' "$*"
}

log_warn() {
  printf '[WARN] %s\n' "$*" >&2
}

log_error() {
  printf '[ERROR] %s\n' "$*" >&2
}

die() {
  log_error "$*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_gcloud() {
  require_command gcloud
}

usage_common_project_region() {
  cat <<'USAGE'
Common options:
  --project PROJECT_ID    GCP project ID
  --region REGION         GCP region (default: asia-northeast1)
  -h, --help              Show help
USAGE
}

print_kv() {
  local key="$1"
  local value="${2:-}"
  printf '%-24s %s\n' "$key:" "${value:-<unset>}"
}

is_service_enabled() {
  local project="$1"
  local service="$2"
  gcloud services list \
    --enabled \
    --project "$project" \
    --filter "config.name=${service}" \
    --format 'value(config.name)' | grep -qx "$service"
}
