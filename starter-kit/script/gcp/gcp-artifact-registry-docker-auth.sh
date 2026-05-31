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
  gcp-artifact-registry-docker-auth.sh --project PROJECT_ID [--region REGION]

Configures Docker credential helper for:
  REGION-docker.pkg.dev
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
require_command docker
[[ -n "$PROJECT" ]] || die "--project is required"

HOST="${REGION}-docker.pkg.dev"

log_info "Configuring Docker auth for ${HOST}"
gcloud auth configure-docker "$HOST" --project "$PROJECT"
log_info "Docker auth configured"
