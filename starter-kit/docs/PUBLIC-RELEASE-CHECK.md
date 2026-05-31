# Public Release Check

GitHub Public 公開前の最終確認。

## 1. 生成物を掃除

```bash
script/cleanup-generated.sh
```

## 2. Git 状態を確認

```bash
git status --short --ignored
```

意図しない `??` と、コミットすべきでない `!!` が残っていないか見る。

## 3. 品質ゲート

最低限:

```bash
git diff --check
```

主要スターター:

```bash
(cd starters/rust/cli && cargo test)
(cd starters/rust/batch && cargo test)
(cd starters/rust/api-axum && cargo test)
(cd starters/python/batch && python3 -m unittest discover -s tests)
(cd starters/python/ml && make test)
(cd starters/infra/terraform && terraform fmt -check -recursive && terraform validate)
(cd tools/project-generator && cargo test)
```

Node 系は依存導入後に確認する。

```bash
(cd optional/typescript-workflow-runner && npm install && npm test)
```

## 4. 秘密情報検索

```bash
rg -n --hidden \
  --glob '!.git/**' \
  --glob '!**/target/**' \
  --glob '!**/node_modules/**' \
  --glob '!**/.terraform/**' \
  --glob '!**/dist/**' \
  --glob '!**/__pycache__/**' \
  "(AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|discord(app)?\\.com/api/webhooks|hooks\\.slack\\.com/services|BEGIN (RSA|OPENSSH|PRIVATE) KEY|Bearer [A-Za-z0-9._-]{20,})" .
```

## 5. 履歴確認

現在の tree が安全でも、過去 commit に秘密情報が残っている場合は Public 化できない。

履歴に secret が入った可能性がある場合:

- 影響する token / webhook / password をローテーションする。
- `git filter-repo` などで履歴から削除する。
- 削除後に再 scan する。

## 6. GitHub 公開前の判断

公開してよい状態:

- `starters/` の正典スターターに README / Makefile / ignore が揃っている。
- `admin-pico` などが gitlink / 壊れた submodule になっていない。
- `.env`, `env/secret.yaml`, `*.tfvars`, credential, DB dump, artifact が追跡されていない。
- 主要テストが通る。
