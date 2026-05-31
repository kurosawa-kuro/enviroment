# 仕様書／設計書：`bootstrap-from-doppler.sh`

> 目的：**Doppler（Service Token）を唯一の秘密情報供給源**として、物理機材（WSL/オンプレPC）とクラウドVM（Lightsail/EKSノード等）を同一フローで“起動直後に構成完了”へ導くブートストラップを実現する。

---

## 1. ゴール / スコープ

* OS初期化直後のホストに対し、以下を**無人化・冪等**に実施：

  1. OSアップデート
  2. Doppler CLIインストール
  3. **DOPPLER\_TOKEN**（Service Token）受領・検証
  4. **機密の安全な注入**（`doppler run -- <cmd>`）
  5. Playbookリポジトリの**Git Clone（SSH or HTTPS）**
  6. Ansibleインストール
  7. Ansible Playbook実行（`playbooks/site.yml` など）

* **ハイブリッド対応**：

  * 物理機材（HP Elite SFF 800 G9 / WSL 等）
  * クラウド（user-data / cloud-init / Ignition 等）EC2はk8s都合でubunutu

* **シークレットの単一ソース**：Doppler（Vault不要）

---

## 2. 想定ユースケース

* **PoC/個人**：Express + jsondb/lowdb の設定値・APIキーをDoppler管理
* **業務/企業**：EKS + Argo CD / Terraform / Spring Boot の**DB認証・Deploy Key**などをDoppler管理
* **複数環境**：`dev`/`stg`/`prod` をDoppler Configで切替

---

## 3. 入出力定義

### 3.1 入力（環境変数／Doppler Secrets）

| 変数名                  | 必須       | 用途                               | 例                                 |
| -------------------- | -------- | -------------------------------- | --------------------------------- |
| `DOPPLER_TOKEN`      | ✅        | Doppler Service Token（実行環境にスコープ） | `dp.st.xxxxxx`                    |
| `DOPPLER_CONFIG`     | 任意       | 使用するConfig名（未指定ならデフォルト）          | `prod`                            |
| `REPO_SSH_URL`       | SSH利用時   | PlaybookリポのSSH URL               | `git@github.com:org/repo.git`     |
| `REPO_HTTPS_URL`     | HTTPS利用時 | PlaybookリポのHTTPS URL             | `https://github.com/org/repo.git` |
| `REPO_DEST`          | 任意       | クローン先パス                          | `/opt/playbook`                   |
| `GITHUB_TOKEN`       | 任意       | GitHub API呼出（Deploy Key登録等）      | `ghp_xxx`                         |
| `INTERNAL_GIT_SSH_PRIVATE_KEY` | 任意 | GitHub SSHクローンに使う秘密鍵 | OpenSSH形式 |
| `DEPLOY_KEY_PRIVATE` | 任意       | SSHクローンする場合の旧互換秘密鍵            | OpenSSH形式                         |
| `DEPLOY_KEY_PUBLIC`  | 任意       | 同上（公開鍵）                          | `ssh-ed25519 ...`                 |
| `ANSIBLE_PLAYBOOK`   | 任意       | 実行するPlaybookパス                   | `playbooks/site.yml`              |
| `ANSIBLE_INVENTORY`  | 任意       | インベントリ指定                         | `"localhost,"`（ローカル）              |
| `PKG_MANAGER`        | 任意       | 強制指定（`apt`/`dnf`/`yum`）          | `apt`                             |

> `GITHUB_TOKEN` / `INTERNAL_GIT_SSH_PRIVATE_KEY` / `DEPLOY_KEY_*` は **Doppler上のシークレット**として保持し、`doppler run` で注入する。
> `INTERNAL_GIT_SSH_PRIVATE_KEY` に対応する **公開鍵が GitHub に登録済みであること** は前提で、公開鍵登録自体はこのスクリプトの責務外とする。

### 3.2 出力

* **副作用**：

  * Doppler CLI がインストール済み
  * Git リポジトリが `REPO_DEST` に展開済み
  * Ansible がインストール済み
  * 指定 Playbook が正常完了（冪等に実行）
* **ログ**：

  * 標準出力／標準エラー（cloud-initなら `/var/log/cloud-init-output.log` 等）
  * 任意で `/var/log/bootstrap-from-doppler.log` に追記（後述）

---

## 4. 依存関係 / 対応OS

* Linux（Debian/Ubuntu 系：`apt`、RHEL/AlmaLinux/Rocky：`dnf`/`yum`）
* 必須コマンド：`curl`、`git`、`bash`、（Ansibleはスクリプトが導入）
* **cloud-init** 環境（クラウド）：user-data にそのまま貼り付け可
* **WSL**：管理者権限不要／ネットワークアクセス必須

---

## 5. アーキテクチャ設計

### 5.1 フロー概要

```mermaid
flowchart TD
A[OS起動] --> B[パッケージ更新]
B --> C[Doppler CLIインストール]
C --> D[DOPPLER_TOKEN検証]
D --> E{SSH or HTTPS?}
E -->|SSH| F[公開鍵/秘密鍵の配置(メモリ/一時ファイル)]
E -->|HTTPS| G[HTTPSでgit clone(必要ならPAT)]
F --> H[known_hosts登録]
H --> I[git clone via SSH]
G --> I
I --> J[Ansibleインストール]
J --> K[doppler run -- ansible-playbook 実行]
K --> L[完了/冪等化]
```

### 5.2 セキュリティ方針

* **秘密情報はファイル永続化しない**のが原則

  * 例外的にSSH鍵を一時ファイルに出す場合は `0600`・実行後削除
* すべての機密注入は `doppler run -- <cmd>` 経由
* **Deploy Key方式推奨**（権限最小／リポジトリ単位）
* **GitHub API** 呼出は `status_code` チェックで冪等（422=既存）

---

## 6. エラーハンドリング / 冪等性

* コマンドは `set -euo pipefail`：失敗で即時停止
* 各ステップに**明示ログ**を出力（`echo "[BOOTSTRAP] ..."`）
* 典型的な再実行：

  * 既存ディレクトリ→`git pull` にフォールバック
  * Deploy Key 既登録→スキップ
  * `doppler run` で環境注入失敗→**Token未設定エラー**として中断

---

## 7. 運用設計（クラウド／WSL）

### 7.1 クラウド（cloud-init / user-data）

* `DOPPLER_TOKEN` は **SSM Parameter Store / Secrets Manager** から安全に取得
* user-data 例：

  ```bash
  #cloud-config
  runcmd:
    - [ bash, -lc, "export DOPPLER_TOKEN=$(aws ssm get-parameter --name /proj/doppler/token --with-decryption --query Parameter.Value --output text); curl -sSfL https://example.com/bootstrap-from-doppler.sh | bash" ]
  ```

### 7.2 物理（WSL/オンプレ）

* 初回のみ `DOPPLER_TOKEN` をユーザ環境へ設定（`.bashrc` 等）
* WindowsのCredential ManagerやBitLockerで保護し、必要時に `export` する運用も可

---

## 8. セキュリティ / 最小権限

* **Doppler Service Token**：対象Project/Configの**読み取り専用**
* **GitHub**：可能なら **GitHub App**（最小権限）／次点で **Deploy Key**
* ログに秘密情報を**出さない**（`set +x`、エコー禁止）

---

## 9. ログ／監査

* 既定は標準出力のみ
* 監査が必要な場合：

  * `/var/log/bootstrap-from-doppler.log` に**サマリーのみ**追記（シークレット値は書かない）
  * 例）クローン先、ブランチ、Commit hash、Playbook結果コード

---

## 10. 拡張ポイント

* **systemd unit化**：起動後に一度だけ実行／失敗時の再試行
* **プロキシ環境**：`HTTP_PROXY` / `HTTPS_PROXY` に対応
* **ネットワーク不安定**：`git`/`curl` にリトライオプション付与
* **モード切替**：`--ssh` / `--https` フラグ受け取り

---

## 11. 疑似コード（要件を満たす骨子）

> 本仕様書は設計書が主目的。実装テンプレも載せます（そのままでも動く最小構成）。

```bash
#!/usr/bin/env bash
set -euo pipefail

log() { echo "[BOOTSTRAP] $*" >&1; }
fail() { echo "[ERROR] $*" >&2; exit 1; }

# --- 0) 前提チェック ---
: "${DOPPLER_TOKEN:?DOPPLER_TOKEN is required}"

REPO_DEST="${REPO_DEST:-/opt/playbook}"
ANSIBLE_PLAYBOOK="${ANSIBLE_PLAYBOOK:-playbooks/site.yml}"
ANSIBLE_INVENTORY="${ANSIBLE_INVENTORY:-localhost,}"
PKG_MANAGER="${PKG_MANAGER:-}"

# --- 1) OS更新 & 基本ツール ---
detect_pkg() {
  if [[ -n "$PKG_MANAGER" ]]; then echo "$PKG_MANAGER"; return; fi
  command -v apt >/dev/null && { echo apt; return; }
  command -v dnf >/dev/null && { echo dnf; return; }
  command -v yum >/dev/null && { echo yum; return; }
  fail "No supported package manager found"
}

PM=$(detect_pkg)
log "Using package manager: $PM"
case "$PM" in
  apt) sudo apt update -y && sudo apt upgrade -y && sudo apt install -y curl git ;;
  dnf) sudo dnf upgrade -y && sudo dnf install -y curl git ;;
  yum) sudo yum update -y && sudo yum install -y curl git ;;
esac

# --- 2) Doppler CLI ---
if ! command -v doppler >/dev/null; then
  log "Installing Doppler CLI"
  curl -Ls https://cli.doppler.com/install.sh | sudo sh
fi

# --- 3) Clone (SSH or HTTPS) ---
mkdir -p "$REPO_DEST" || true

clone_repo() {
  if [[ -n "${REPO_SSH_URL:-}" ]]; then
    log "Cloning via SSH"
    # known_hosts（GitHub）登録
    mkdir -p "$HOME/.ssh"; chmod 700 "$HOME/.ssh"
    ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
    chmod 644 "$HOME/.ssh/known_hosts"

    # 必要なら一時鍵ファイルを作る（Dopplerから注入）
    SSH_PRIVATE_KEY="${INTERNAL_GIT_SSH_PRIVATE_KEY:-${DEPLOY_KEY_PRIVATE:-}}"
    if [[ -n "${SSH_PRIVATE_KEY:-}" ]]; then
      KEY_PATH="$HOME/.ssh/id_deploy"
      umask 077
      printf "%s" "${SSH_PRIVATE_KEY}" > "$KEY_PATH"
      chmod 600 "$KEY_PATH"
      GIT_SSH_COMMAND="ssh -i $KEY_PATH -o StrictHostKeyChecking=yes"
      export GIT_SSH_COMMAND
    fi

    if [[ -d "$REPO_DEST/.git" ]]; then
      (cd "$REPO_DEST" && doppler run -- git pull --ff-only)
    else
      doppler run -- git clone "${REPO_SSH_URL}" "$REPO_DEST"
    fi

    # 一時鍵は削除（原則ファイル残さない）
    [[ -n "${KEY_PATH:-}" ]] && shred -u "$KEY_PATH" || true

  elif [[ -n "${REPO_HTTPS_URL:-}" ]]; then
    log "Cloning via HTTPS"
    if [[ -d "$REPO_DEST/.git" ]]; then
      (cd "$REPO_DEST" && doppler run -- git pull --ff-only)
    else
      doppler run -- git clone "${REPO_HTTPS_URL}" "$REPO_DEST"
    fi
  else
    fail "REPO_SSH_URL or REPO_HTTPS_URL is required"
  fi
}

clone_repo

# --- 4) Ansible ---
if ! command -v ansible >/dev/null; then
  log "Installing Ansible"
  case "$PM" in
    apt) sudo apt install -y ansible ;;
    dnf) sudo dnf install -y ansible ;;
    yum) sudo yum install -y ansible ;;
  esac
fi

# --- 5) Playbook 実行 ---
log "Running Ansible Playbook: $ANSIBLE_PLAYBOOK"
cd "$REPO_DEST"
doppler run -- ansible-playbook -i "$ANSIBLE_INVENTORY" -c local "$ANSIBLE_PLAYBOOK"
log "Done."
```

> **注**：GitHub Deploy Keyを**自動登録**する場合は、Ansible側に`uri`モジュールで `/repos/{owner}/{repo}/keys` を叩くタスクを入れてください（`201/422`で冪等）。

---

## 12. テスト計画（抜粋）

* **単体**：

  * `REPO_SSH_URL` のみ／`REPO_HTTPS_URL` のみ
  * `INTERNAL_GIT_SSH_PRIVATE_KEY` または `DEPLOY_KEY_PRIVATE` 有無
  * `DOPPLER_CONFIG` 切替
* **結合**：

  * Doppler → git clone → ansible 実行の成功／失敗パス
* **環境**：

  * Ubuntu 22.04 / 24.04、AlmaLinux 9、WSL2 Ubuntu
  * cloud-init（AWS/Lightsail, EC2, 主要クラウド）

---

## 13. 運用ガイド（チップス）

* **Config切替**：
  `doppler run --config stg -- ansible-playbook ...`
* **systemd化（例）**：

  * `/usr/local/bin/bootstrap-from-doppler.sh` を配置・実行権限付与
  * `WantedBy=multi-user.target` で一回実行 → 成功でDisable
* **ロールバック**：

  * Playbookは冪等／再実行可能に設計
  * 変更はGitのRevertまたはタグで管理

---

## 14. 既知の制約

* ネットワーク必須（Doppler / Git / パッケージ取得）
* Hostの時刻ズレが大きい場合、TLSやSSM取得が失敗しうる（NTP推奨）
* 企業プロキシ下では `HTTP(S)_PROXY` 設定が必要

---

## 15. 今後の拡張

* **監査API**（Express + lowdb） にPOSTして、ブート履歴を集約
* **ヘルスチェック**：Playbook後にサービス稼働確認 → Slack/Webhook通知
* **GitHub App化**：PAT不要・より細粒度な権限設計

---

必要なら、この設計を**そのままリポジトリ雛形**（`/scripts/bootstrap-from-doppler.sh`、`/ansible/`、`/cloud-init/`）に落としてお渡しします。どの配下構成（ディレクトリ）で運用したいか教えてください。
