#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

PROJECT=""
SECRET=""
REPLICATION="automatic"

usage() {
  cat <<'USAGE'
Usage:
  printf '%s' "$SECRET_VALUE" | gcp-secret-upsert.sh --project PROJECT_ID --secret SECRET_NAME

Creates the Secret Manager container if it does not exist, then adds a new version
from stdin. The secret value is never printed.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT="${2:-}"
      shift 2
      ;;
    --secret)
      SECRET="${2:-}"
      shift 2
      ;;
    --replication-policy)
      REPLICATION="${2:-}"
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
[[ -n "$SECRET" ]] || die "--secret is required"

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT
cat > "$TMP_FILE"

if [[ ! -s "$TMP_FILE" ]]; then
  die "Secret value must be provided via stdin"
fi

if gcloud secrets describe "$SECRET" --project "$PROJECT" >/dev/null 2>&1; then
  log_info "Secret container exists: ${SECRET}"
else
  log_info "Creating secret container: ${SECRET}"
  gcloud secrets create "$SECRET" \
    --project "$PROJECT" \
    --replication-policy "$REPLICATION"
fi

log_info "Adding new secret version: ${SECRET}"
gcloud secrets versions add "$SECRET" \
  --project "$PROJECT" \
  --data-file "$TMP_FILE" >/dev/null
log_info "Secret version added"
