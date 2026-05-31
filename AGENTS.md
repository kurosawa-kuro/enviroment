# AGENTS.md

このファイルは、AI コーディングアシスタントが `/home/ubuntu/repos/private-kit` で作業するときの共通ガイドです。ここは単一プロジェクトではなく、複数資産を並べて管理する親ディレクトリとして扱います。

## 1. ルートの役割

`private-kit` 直下では、主に次の 2 系統を管理します。

- `environment-kit/`
  - WSL Ubuntu、EC2 Ubuntu、Amazon Linux 向けの環境構築資産
- `starter-kit/`
  - 再利用前提のスターターキット集

ルート直下の `AGENTS.md` / `CLAUDE.md` / `README.md` は、この 2 つの入口を案内するための文書です。実装判断は、作業先ディレクトリ配下の文書を優先してください。

## 2. まず見る場所

- [`README.md`](./README.md)
- [`CLAUDE.md`](./CLAUDE.md)
- [`environment-kit/README.md`](./environment-kit/README.md)
- [`environment-kit/AGENTS.md`](./environment-kit/AGENTS.md)
- [`starter-kit/README.md`](./starter-kit/README.md)
- [`starter-kit/AGENTS.md`](./starter-kit/AGENTS.md)

## 3. 作業時の原則

- どちらの資産を触るかを最初に明確にする
- `environment-kit/` と `starter-kit/` をまたぐ変更は、参照リンクや説明の整合まで確認する
- 片方の運用ルールを、もう片方へ無条件に持ち込まない
- 実装や docs を直すときは、対象配下の `README.md` / `AGENTS.md` / `CLAUDE.md` を先に読む

## 4. ルートでやらないこと

- `environment-kit/` の詳細手順をルート文書へ重複記載しない
- `starter-kit/` の設計方針をルート文書へ展開しすぎない
- どちらか片方の前提で、親ディレクトリ全体を説明しない

## 5. 補足

`environment-kit/` は実運用寄りの環境構築資産、`starter-kit/` は新規作成用の雛形資産という性格の違いがあります。迷った場合は、まず作業対象のサブディレクトリ配下にあるガイドを正として扱ってください。
