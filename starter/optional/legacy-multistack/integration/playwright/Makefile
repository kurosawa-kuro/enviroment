.PHONY: help install start chat fetch analyze decide normalize chunk process clean tree

# デフォルト: ヘルプ表示
help:
	@echo "=== Playwright Integration Tools ==="
	@echo ""
	@echo "Setup:"
	@echo "  make install          依存関係インストール"
	@echo ""
	@echo "AI/Chat:"
	@echo "  make start            単発チャット実行"
	@echo "  make chat             対話チャット開始"
	@echo "  make analyze          トランスクリプト分析"
	@echo "  make decide           リスク判定実行"
	@echo ""
	@echo "Subtitle Processing:"
	@echo "  make normalize FILE=<path>   字幕正規化"
	@echo "  make chunk FILE=<path>       字幕分割"
	@echo "  make process FILE=<path>     フル処理 (normalize + chunk)"
	@echo ""
	@echo "Scraping:"
	@echo "  make fetch            Playwrightサンプル実行"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            出力ファイル削除"
	@echo "  make tree             フォルダ構造表示"
	@echo ""
	@echo "Examples:"
	@echo "  make normalize FILE=data/output/xxx_subtitle.json"
	@echo "  make process FILE=data/output/xxx_subtitle.json"

# ========== Setup ==========
install:
	npm install

# ========== AI/Chat ==========
start:
	npm run start

chat:
	npm run chat

analyze:
	npm run analyze

decide:
	npm run decide

# ========== Subtitle Processing ==========
normalize:
ifndef FILE
	@echo "Error: FILE is required. Usage: make normalize FILE=<path>"
	@exit 1
endif
	npm run normalize -- $(FILE)

chunk:
ifndef FILE
	@echo "Error: FILE is required. Usage: make chunk FILE=<path>"
	@exit 1
endif
	npm run chunk -- $(FILE)

process:
ifndef FILE
	@echo "Error: FILE is required. Usage: make process FILE=<path>"
	@exit 1
endif
	npm run process -- $(FILE)

# ========== Scraping ==========
fetch:
	npm run fetch

# ========== Utilities ==========
clean:
	rm -f output/*.json
	@echo "Cleaned output files"

tree:
	@echo "=== Project Structure ==="
	@find . -type f \( -name "*.js" -o -name "*.json" \) | grep -v node_modules | grep -v package-lock | sort | sed 's|^./||'
