output "project_id" {
  description = "対象 GCP プロジェクト"
  value       = var.project_id
}

output "region" {
  description = "対象リージョン"
  value       = var.region
}

output "name_prefix" {
  description = "環境別リソース名プレフィックス"
  value       = local.name_prefix
}
