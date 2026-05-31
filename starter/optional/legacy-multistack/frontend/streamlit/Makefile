# Streamlit Todo App Makefile - Cross Platform
# Automatically detects OS and uses appropriate commands with pipx

.PHONY: install run dev clean test help detect-os setup-pipx

# OS Detection
ifeq ($(OS),Windows_NT)
    # Windows
    OS_TYPE := windows
    PYTHON_CMD := python
    CLEAN_CMD := del /s /q *.pyc 2>nul || true && rmdir /s /q __pycache__ 2>nul || true && rmdir /s /q *.egg-info 2>nul || true && rmdir /s /q .streamlit 2>nul || true
    FILE_CHECK := if not exist
    COMMAND_CHECK := where
else
    # Unix-like (Linux, macOS)
    OS_TYPE := unix
    PYTHON_CMD := python3
    CLEAN_CMD := find . -type f -name "*.pyc" -delete && find . -type d -name "__pycache__" -delete && find . -type d -name "*.egg-info" -exec rm -rf {} + && rm -rf .streamlit
    FILE_CHECK := test -f
    COMMAND_CHECK := command -v
endif

# Settings
PYTHONPATH = src
STREAMLIT = streamlit

detect-os: ## Detect current operating system
	@echo "Detected OS: $(OS_TYPE)"
	@echo "Python command: $(PYTHON_CMD)"
	@echo "Clean command: $(CLEAN_CMD)"

help: ## Show this help message
	@echo "Streamlit Todo App - Cross Platform Makefile"
	@echo "Detected OS: $(OS_TYPE)"
	@echo ""
	@echo "Available commands:"
	@echo "  setup-pipx   - Setup pipx environment"
	@echo "  install      - Install Streamlit and dependencies via pipx"
	@echo "  run          - Run Streamlit application"
	@echo "  dev          - Run in development mode with auto-reload"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean cache files"
	@echo "  start        - Quick start (setup + install + run)"
	@echo "  detect-os    - Show OS detection info"
	@echo "  render-deploy - Show Render deployment guide"
	@echo "  render-test  - Test Render deployment locally"
	@echo ""
	@echo "OS-specific files:"
	@echo "  Makefile.windows - Windows-specific version"
	@echo "  Makefile.ubuntu  - Ubuntu/Linux-specific version"

setup-pipx: ## Setup pipx environment
	@echo "Setting up pipx environment for $(OS_TYPE)..."
	$(PYTHON_CMD) -m pip install --user pipx
	$(PYTHON_CMD) -m pipx ensurepath
	@echo "✅ pipx setup completed"

install: setup-pipx ## Install Streamlit and dependencies via pipx
	@echo "Installing Streamlit via pipx for $(OS_TYPE)..."
	pipx install streamlit
	pipx install python-dotenv
	@echo "✅ Streamlit installed via pipx"

run: ## Run Streamlit application
	@echo "Starting Streamlit application..."
	cd $(PYTHONPATH) && streamlit run app.py

dev: ## Run Streamlit application in development mode
	@echo "Starting Streamlit in development mode..."
	cd $(PYTHONPATH) && streamlit run app.py --server.runOnSave true

test: ## Run tests
	@echo "Running tests..."
	cd $(PYTHONPATH) && $(PYTHON_CMD) -m pytest ../tests/ -v

clean: ## Clean cache and temporary files
	@echo "Cleaning cache files for $(OS_TYPE)..."
	$(CLEAN_CMD)
	@echo "✅ Clean completed"

start: install run ## Quick start: setup pipx, install dependencies and run the application

# OS-specific shortcuts
windows: ## Use Windows-specific Makefile
	@echo "Using Windows-specific Makefile..."
	@make -f Makefile.windows $(MAKECMDGOALS)

ubuntu: ## Use Ubuntu-specific Makefile
	@echo "Using Ubuntu-specific Makefile..."
	@make -f Makefile.ubuntu $(MAKECMDGOALS)

# Render deployment
render-deploy: ## Deploy to Render (requires git push first)
	@echo "🚀 Deploying to Render..."
	@echo "1. Make sure your code is pushed to GitHub"
	@echo "2. Go to https://dashboard.render.com/"
	@echo "3. Create new Web Service"
	@echo "4. Connect your GitHub repository"
	@echo "5. Use the following settings:"
	@echo "   - Environment: Python"
	@echo "   - Build Command: pip install -r requirements.txt"
	@echo "   - Start Command: cd src && streamlit run app.py --server.port \$PORT --server.address 0.0.0.0"
	@echo "✅ Render deployment guide displayed"

render-test: ## Test Render deployment locally
	@echo "🧪 Testing Render deployment locally..."
	cd src && PORT=8501 streamlit run app.py --server.port 8501 --server.address 0.0.0.0