#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

PROJECT=""

usage() {
  cat <<'USAGE'
Usage:
  gcp-enable-services.sh --project PROJECT_ID [SERVICE ...]

If SERVICE is omitted, enables the common APIs used by Cloud Run based apps:
  run.googleapis.com
  artifactregistry.googleapis.com
  secretmanager.googleapis.com
  cloudbuild.googleapis.com
  cloudscheduler.googleapis.com
  pubsub.googleapis.com
  logging.googleapis.com
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --*)
      die "Unknown option: $1"
      ;;
    *)
      break
      ;;
  esac
done

require_gcloud
[[ -n "$PROJECT" ]] || die "--project is required"

if [[ $# -gt 0 ]]; then
  SERVICES=("$@")
else
  SERVICES=(
    run.googleapis.com
    artifactregistry.googleapis.com
    secretmanager.googleapis.com
    cloudbuild.googleapis.com
    cloudscheduler.googleapis.com
    pubsub.googleapis.com
    logging.googleapis.com
  )
fi

log_info "Enabling services for project: ${PROJECT}"
gcloud services enable "${SERVICES[@]}" --project "$PROJECT"
log_info "Done"
