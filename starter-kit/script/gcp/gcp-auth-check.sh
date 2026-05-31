#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

PROJECT=""
REGION="asia-northeast1"

usage() {
  cat <<'USAGE'
Usage:
  gcp-auth-check.sh --project PROJECT_ID [--region REGION]

Checks:
  - active gcloud account
  - active gcloud project
  - Application Default Credentials account
  - selected region
  - commonly used API enablement
USAGE
  usage_common_project_region
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT="${2:-}"
      shift 2
      ;;
    --region)
      REGION="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

require_gcloud
[[ -n "$PROJECT" ]] || die "--project is required"

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n 1 || true)"
ACTIVE_PROJECT="$(gcloud config get-value project 2>/dev/null || true)"
ADC_AVAILABLE="no"
if gcloud auth application-default print-access-token >/dev/null 2>&1; then
  ADC_AVAILABLE="yes"
fi

print_kv "gcloud account" "$ACTIVE_ACCOUNT"
print_kv "gcloud project" "$ACTIVE_PROJECT"
print_kv "target project" "$PROJECT"
print_kv "region" "$REGION"
print_kv "ADC available" "$ADC_AVAILABLE"

if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  log_warn "No active gcloud account. Run: gcloud auth login"
fi

if [[ "$ACTIVE_PROJECT" != "$PROJECT" ]]; then
  log_warn "Active gcloud project differs. To set it: gcloud config set project ${PROJECT}"
fi

log_info "Checking common API services..."
SERVICES=(
  run.googleapis.com
  artifactregistry.googleapis.com
  secretmanager.googleapis.com
  cloudbuild.googleapis.com
  cloudscheduler.googleapis.com
  pubsub.googleapis.com
  logging.googleapis.com
)

for service in "${SERVICES[@]}"; do
  if is_service_enabled "$PROJECT" "$service"; then
    print_kv "$service" "enabled"
  else
    print_kv "$service" "disabled"
  fi
done
