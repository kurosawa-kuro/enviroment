#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

paths=(
  "optional/legacy-multistack/runtime/jvm/java/backend/target"
  "starters/python/batch/src/__pycache__"
  "starters/python/batch/tests/__pycache__"
  "starters/python/api-fastapi/src/micropost_api/__pycache__"
  "starters/python/api-fastapi/src/micropost_api/web/__pycache__"
  "starters/python/api-fastapi/e2e/__pycache__"
  "starters/python/api-fastapi/tests/__pycache__"
  "starters/python/api-fastapi/.pytest_cache"
  "starters/python/api-fastapi/microposts.db"
  "starters/python/gcp/src/micropost_gcp/__pycache__"
  "starters/python/gcp/src/micropost_gcp/exporters/__pycache__"
  "starters/python/gcp/.pytest_cache"
  "starters/python/gcp/microposts.db"
  "starters/python/ml/artifacts"
  "starters/python/ml/src/housing_ml/__pycache__"
  "starters/python/ml/src/housing_ml/infra/__pycache__"
  "starters/python/ml/src/housing_ml/pipelines/__pycache__"
  "starters/python/ml/src/housing_ml/registry/__pycache__"
  "starters/python/ml/tests/__pycache__"
  "optional/typescript-workflow-runner/node_modules"
  "optional/typescript-workflow-runner/data"
  "starters/rust/api-axum-fullstack/client/dist"
  "starters/rust/api-axum-fullstack/target"
  "starters/rust/api-axum/target"
  "starters/rust/batch/target"
  "starters/rust/cli/target"
  "starters/infra/terraform/.terraform"
  "starters/infra/terraform/.terraform.lock.hcl"
  "tools/project-generator/target"
)

for rel in "${paths[@]}"; do
  path="${ROOT}/${rel}"
  if [[ -e "$path" ]]; then
    rm -rf "$path"
    printf 'removed %s\n' "$rel"
  fi
done

mkdir -p "${ROOT}/starters/python/ml/artifacts"
touch "${ROOT}/starters/python/ml/artifacts/.gitkeep"
