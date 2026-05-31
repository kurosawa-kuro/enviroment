# リソース定義はここに追加する。
# 例: 有効化する API を宣言する（必要に応じてコメントを外す）。
#
# resource "google_project_service" "run" {
#   project            = var.project_id
#   service            = "run.googleapis.com"
#   disable_on_destroy = false
# }

locals {
  name_prefix = "${var.env}-app"
}
