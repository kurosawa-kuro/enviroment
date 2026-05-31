terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    # AWS を使う場合はコメントアウトを外す
    # aws = {
    #   source  = "hashicorp/aws"
    #   version = "~> 5.0"
    # }
  }

  # リモートステート（GCS）。利用時に bucket を作成し、コメントを外す。
  # backend "gcs" {
  #   bucket = "my-tfstate-bucket"
  #   prefix = "terraform/state"
  # }
}
