#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

PROJECT=""
REGION="asia-northeast1"
SERVICE=""
JOB=""
LOG_LIMIT="50"

usage() {
  cat <<'USAGE'
Usage:
  gcp-cloud-run-inspect.sh --project PROJECT_ID --region REGION (--service SERVICE | --job JOB) [--log-limit N]

Shows Cloud Run service/job status and recent logs.
USAGE
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
    --service)
      SERVICE="${2:-}"
      shift 2
      ;;
    --job)
      JOB="${2:-}"
      shift 2
      ;;
    --log-limit)
      LOG_LIMIT="${2:-}"
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
[[ -n "$SERVICE" || -n "$JOB" ]] || die "--service or --job is required"
[[ -z "$SERVICE" || -z "$JOB" ]] || die "Use only one of --service or --job"

if [[ -n "$SERVICE" ]]; then
  log_info "Cloud Run service: ${SERVICE}"
  gcloud run services describe "$SERVICE" \
    --project "$PROJECT" \
    --region "$REGION" \
    --format='yaml(metadata.name,status.url,status.conditions,status.latestReadyRevisionName,status.traffic)'

  log_info "Recent revisions"
  gcloud run revisions list \
    --service "$SERVICE" \
    --project "$PROJECT" \
    --region "$REGION" \
    --limit 5

  log_info "Recent logs"
  gcloud logging read \
    "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE}" \
    --project "$PROJECT" \
    --limit "$LOG_LIMIT" \
    --format='value(timestamp,severity,textPayload)'
else
  log_info "Cloud Run job: ${JOB}"
  gcloud run jobs describe "$JOB" \
    --project "$PROJECT" \
    --region "$REGION" \
    --format='yaml(metadata.name,status.conditions,spec.template.template.spec.containers[0].image)'

  log_info "Recent executions"
  gcloud run jobs executions list \
    --job "$JOB" \
    --project "$PROJECT" \
    --region "$REGION" \
    --limit 5

  log_info "Recent logs"
  gcloud logging read \
    "resource.type=cloud_run_job AND resource.labels.job_name=${JOB}" \
    --project "$PROJECT" \
    --limit "$LOG_LIMIT" \
    --format='value(timestamp,severity,textPayload)'
fi
