# Streamlit Todo アプリケーション

Streamlitで構築されたシンプルでインタラクティブなTodoアプリケーション。カテゴリ管理、フィルタリング、統計機能を備えています。

## 機能

- ✏️ タイトル付きの新しいTodoを追加
- 🏷️ カテゴリ管理（Todoにカテゴリを作成・割り当て）
- 🔍 ステータス（すべて、完了、未完了）とカテゴリによるTodoのフィルタリング
- 📊 リアルタイム統計表示
- 🎯 セッションベースの状態管理
- 🔧 デバッグ情報パネル
- 🗄️ データベース選択機能（メモリ内 / Neon PostgreSQL）

## アーキテクチャ

このアプリケーションは**リポジトリパターン**を採用しており、データアクセス層とビジネスロジック層が分離されています：

- **Service Layer**: ビジネスロジックを管理
- **Repository Layer**: データアクセスを抽象化
- **Memory Repository**: 開発・テスト用のメモリ内データ
- **Neon Repository**: 本番用のPostgreSQLデータベース

## データベース設定

環境変数ファイル `env.local` でデータベースタイプを選択できます：

### メモリ内データベース（デフォルト）
```bash
DATABASE_TYPE=MEMORY
```

### Neon PostgreSQL
```bash
DATABASE_TYPE=NEON
NEON_DATABASE_URL=postgresql://username:password@host:port/database
# または個別設定：
NEON_DATABASE_HOST=your-neon-host.neon.tech
NEON_DATABASE_PORT=5432
NEON_DATABASE_NAME=your-database-name
NEON_DATABASE_USER=your-username
NEON_DATABASE_PASSWORD=your-password
```

## 前提条件

- Python 3.7以上
- pipx（Pythonアプリケーションインストーラー）

## インストールとセットアップ

このプロジェクトは、クロスプラットフォームのMakefileを使用して**Windows**と**Ubuntu/Linux**環境の両方をサポートしています。

### クロスプラットフォームMakefile（推奨）

メインの`Makefile`は自動的にオペレーティングシステムを検出し、適切なコマンドを使用します：

```bash
# プロジェクトディレクトリに移動
cd /path/to/streamlit

# クイックスタート - 依存関係をインストールしてアプリを実行
make start

# 検出されたOSを確認
make detect-os

# 利用可能なコマンドを表示
make help
```

### OS固有のMakefile

特定のOS環境では、専用のMakefileを使用できます：

#### Windows
```bash
# Windows専用Makefileを使用
make -f Makefile.windows start

# またはショートカットを使用
make windows start
```

#### Ubuntu/Linux
```bash
# Ubuntu専用Makefileを使用（pipxを使用）
make -f Makefile.ubuntu start

# またはショートカットを使用
make ubuntu start
```

### 手動セットアップ

#### Windows
```bash
# Streamlitを直接インストール
python -m pip install -r requirements.txt

# アプリケーションを実行
cd src && python -m streamlit run app.py
```

#### Ubuntu/Linux（pipx使用）
```bash
# pipxをインストール
python3 -m pip install --user pipx
python3 -m pipx ensurepath

# pipx経由でStreamlitをインストール
pipx install streamlit

# アプリケーションを実行
cd src && PYTHONPATH=. streamlit run app.py
```

## アプリケーションの実行

### 開発モード

```bash
# 自動リロードを有効にして実行
make dev

# または手動で：
cd src && PYTHONPATH=. streamlit run app.py --server.runOnSave true
```

### 本番モード

```bash
# 標準実行
make run

# または手動で：
cd src && PYTHONPATH=. streamlit run app.py
```

アプリケーションは http://localhost:8501 で利用できます

## 利用可能なMakeコマンド

### クロスプラットフォームコマンド
```bash
make help           # 利用可能なコマンドを表示
make detect-os      # 検出されたOSとコマンドを表示
make install        # Streamlitと依存関係をインストール
make run            # Streamlitアプリケーションを実行
make dev            # 自動リロードを有効にして実行
make test           # テストを実行
make clean          # キャッシュファイルと一時ファイルをクリーン
make start          # クイックスタート（インストール + 実行）
```

### OS固有のショートカット
```bash
make windows <command>  # Windows専用Makefileを使用
make ubuntu <command>   # Ubuntu専用Makefileを使用
```

### Ubuntu/Linux固有のコマンド（Makefile.ubuntu経由）
```bash
make -f Makefile.ubuntu setup-pipx     # pipxが利用できない場合にインストール
make -f Makefile.ubuntu requirements   # 現在のpipxパッケージを表示
make -f Makefile.ubuntu build          # 基本的なビルドチェック
make -f Makefile.ubuntu setup-dev      # 開発環境をセットアップ
make -f Makefile.ubuntu format         # blackでコードをフォーマット
make -f Makefile.ubuntu lint           # flake8でコードをリント
make -f Makefile.ubuntu uninstall      # pipxからアンインストール
```

## 使用方法

1. **カテゴリの追加**: カテゴリ管理セクションを使用してTodoを整理するためのカテゴリを作成
2. **Todoの追加**: Todoのタイトルを入力し、オプションでカテゴリを割り当て
3. **フィルタリング**: フィルターセクションを使用してステータスやカテゴリでTodoを表示
4. **統計**: Todoの進捗のリアルタイム統計を表示
5. **デバッグ**: デバッグセクションを展開してアプリケーションの内部状態を表示

## アプリケーション構造

```
src/streamlit/
├── src/                # ソースコードディレクトリ
│   ├── __init__.py     # パッケージ初期化
│   ├── app.py          # メインStreamlit UIアプリケーション
│   └── service.py      # ビジネスロジックサービス層
├── requirements.txt    # Python依存関係
├── Makefile           # ビルドと実行コマンド
└── README.md          # このファイル
```

### アーキテクチャ

アプリケーションは関心の分離に従います：

- **UI層** (`src/app.py`): Streamlitインターフェースとユーザーインタラクション処理
- **ビジネスロジック** (`src/service.py`): Todo管理、フィルタリング、データ操作
- **サービスパターン**: `TodoService`クラスがすべてのビジネスロジックをカプセル化
- **セッション管理**: Streamlitセッション状態がUIフィルターとサービスインスタンスを管理

## 依存関係

- `streamlit>=1.28.0` - Webアプリケーションフレームワーク

## 開発

### 開発環境のセットアップ

```bash
# pipx経由で開発ツールをインストール
make setup-dev

# コードをフォーマット（必要に応じてblackを自動インストール）
make format

# コードをリント（必要に応じてflake8を自動インストール）
make lint
```

### 新機能の追加

1. アプリケーションはデータ永続化にStreamlitのセッション状態を使用
2. メイン関数は機能別に整理（todos、categories、display等）
3. 新機能を追加する際は既存のコード構造に従う
4. ビジネスロジックは`TodoService`クラスに追加
5. UIコンポーネントは`app.py`に残す

## トラブルシューティング

### 一般的な問題

1. **ポートが既に使用中**: ポート8501がビジーな場合、Streamlitは自動的に次の利用可能なポートを試行
2. **インポートエラー**: `make install`（pipx経由）でStreamlitがインストールされていることを確認
3. **モジュールが見つからない**: 適切なPYTHONPATHで正しいディレクトリから実行していることを確認
4. **pipxが見つからない**: `make setup-pipx`でpipxをインストールするか、手動でインストール
5. **コマンドが見つからない**: pipx PATHが適切に設定されていることを確認（`pipx ensurepath`）

### ログとデバッグ

- アプリケーションの組み込みデバッグパネルを使用してセッション状態を表示
- Streamlitサーバーログのターミナル出力を確認
- `make test`を使用して基本機能を検証

## Renderデプロイ

このプロジェクトはRenderに簡単にデプロイできます。

### デプロイ手順

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "Add Render deployment support"
   git push origin main
   ```

2. **Renderでデプロイ**
   - [Render Dashboard](https://dashboard.render.com/)にアクセス
   - "New +" → "Web Service"を選択
   - GitHubリポジトリを接続
   - 以下の設定を使用：
     - **Name**: `streamlit-todo-app`
     - **Environment**: `Python`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `cd src && streamlit run app.py --server.port $PORT --server.address 0.0.0.0`

3. **環境変数設定**
   - `PYTHON_VERSION`: `3.11.0`

### 自動デプロイ

`render.yaml`ファイルが含まれているため、Renderは自動的に設定を読み取ります。

### カスタムドメイン

デプロイ後、Renderダッシュボードでカスタムドメインを設定できます。

## Dockerサポート（オプション）

```bash
# Dockerイメージをビルド
make docker-build

# Dockerコンテナで実行
make docker-run
```

## ポート設定

- デフォルトポート: 8501
- ポート8501がビジーの場合、アプリケーションは自動的に次の利用可能なポートを見つける
- アクセス方法: http://localhost:8501（またはターミナルに表示されるポート）

## 貢献

1. 既存のコード構造と命名規則に従う
2. 変更を`make test`でテスト
3. コミット前に`make format`でコードをフォーマット
4. 必要に応じてドキュメントを更新
5. UIとビジネスロジックを分離

## 注意事項

- このプロジェクトはPythonアプリケーション管理に**pipx**を使用（仮想環境セットアップ不要）
- pipxは各アプリケーションの分離された環境を自動的に作成
- 依存関係はpipxによって分離された環境で管理
- Python 3.7+とpipxがインストールされていることを確認
- `pipx list`を実行してインストールされたアプリケーションとそのバージョンを確認