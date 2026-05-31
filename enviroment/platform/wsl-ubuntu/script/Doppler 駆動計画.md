# Doppler 駆動計画

## 🎯 目的

* **PoC（検証環境）と企業向けポートフォリオ**を同じフローで再現できるようにする
* **Secrets管理をDopplerで統一**し、WSL・EC2いずれでも同じコードを動かす
* **AMI肥大やコスト増を防止**しつつ、再現性とセキュリティを両立する

---

## 🏗 アーキテクチャ概要

### 基盤

* **PoC / 個人開発**

  * WSL（HP Elite SFF 800 G9 上）
  * EC2 Ubuntu（PoC用VM）
* **Secrets管理**

  * Doppler CLI（無料プラン：`doppler login` → Client Token）
  * 将来的には **Teamプラン＋Service Token (`dp.st...`)** に移行し、完全無人化
* **構成管理**

  * Ansible Playbook
  * GitHubリポジトリ（Doppler経由でSSH鍵/トークンを注入）

---

## 🚀 ゴールデンAMI戦略

### ゴールデンAMIの中身

* Ubuntu 最新安定版
* 基本パッケージ更新 (`apt-get update && upgrade`)
* ツール類：

  * curl, git, unzip, jq, ca-certificates
  * Doppler CLI（インストールのみ）
  * Ansible
* **Playbook実行前で止める**

  * シークレットやアプリは含めない
  * Dopplerログイン情報も残さない

### AMI化フロー

1. EC2起動 → `prepare_golden_ami.sh` 実行
2. Dopplerログインはしない
3. クリーンアップ（`/root/.doppler` 削除、aptキャッシュ削除）
4. この状態でAMI化
5. 以後の再現はUserData＋`doppler login`で

---

## 🔄 インスタンス起動後フロー（無料プラン時）

1. SSHログイン
2. Dopplerログイン

   ```bash
   doppler login
   sudo doppler login   # rootも必要なら
   ```
3. Playbook取得＆実行

   ```bash
   doppler run -- git clone "$REPO_SSH_URL" /opt/playbook
   cd /opt/playbook
   doppler run -- ansible-playbook -i "localhost," -c local site.yml
   ```

---

## 💰 コスト制御

* **AMI保持はゴールデン1枚のみ**
* バリエーションは **UserData + Playbook** で再現
* 不要AMIは削除、スナップショットは **EBS Archive階層**へ退避
* 長期保存が必要な場合は **S3/VM Export** も検討（ただし復元手間あり）

---

## 🛠 今後の拡張

* **Teamプランへ移行**：Service Token (`dp.st...`) を用い、完全ゼロタッチ（UserData内でSecrets注入 → Playbook実行）
* **Packer導入**：Golden AMIの生成をIaC化し、PoC環境と本番環境の差分管理を容易に
* **CI/CD連携**：GitHub ActionsやArgo CDでDoppler駆動Playbookを展開

---

👉 まとめると、「**PoCは手動doppler loginでOK → 将来はService Tokenで無人化**」という二段構えです。
このまま進めれば、WSLとEC2を同じコードベースで統一できます。

---

この計画をさらに落とし込んで、\*\*運用チェックリスト（AMI作成手順・起動後チェック項目）\*\*も作っておきますか？
