variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "env" {
  description = "Environment name (dev / prod など)"
  type        = string
  default     = "dev"
}

# variable "aws_region" {
#   description = "AWS region"
#   type        = string
#   default     = "ap-northeast-1"
# }
