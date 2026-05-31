#!/bin/bash

# Common logging utilities for WSL Ubuntu setup scripts
# Author: AI Assistant
# Version: 2.0

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Log configuration
LOG_DIR="/var/log/wsl-setup"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d-%H%M%S).log"

# Setup logging system
setup_logging() {
    sudo mkdir -p "$LOG_DIR"
    sudo chown "$USER:$USER" "$LOG_DIR"
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
    log_info "Logging initialized: $LOG_FILE"
}

# Internal function for timestamped logging
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Enhanced logging functions with timestamps and file output
log_info() {
    local message="${BLUE}[INFO]${NC} $1"
    echo -e "$message"
    if [[ -n "${LOG_FILE:-}" && -d "$(dirname "$LOG_FILE")" ]]; then
        log_with_timestamp "[INFO] $1" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

log_success() {
    local message="${GREEN}✅ SUCCESS:${NC} $1"
    echo -e "$message"
    if [[ -n "${LOG_FILE:-}" && -d "$(dirname "$LOG_FILE")" ]]; then
        log_with_timestamp "✅ SUCCESS: $1" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

log_warning() {
    local message="${YELLOW}⚠️  WARNING:${NC} $1"
    echo -e "$message"
    if [[ -n "${LOG_FILE:-}" && -d "$(dirname "$LOG_FILE")" ]]; then
        log_with_timestamp "⚠️  WARNING: $1" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

log_error() {
    local message="${RED}❌ ERROR:${NC} $1"
    echo -e "$message" >&2
    if [[ -n "${LOG_FILE:-}" && -d "$(dirname "$LOG_FILE")" ]]; then
        log_with_timestamp "❌ ERROR: $1" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

log_debug() {
    if [[ "${DEBUG:-0}" == "1" ]]; then
        local message="${CYAN}[DEBUG]${NC} $1"
        echo -e "$message"
        if [[ -n "${LOG_FILE:-}" && -d "$(dirname "$LOG_FILE")" ]]; then
            log_with_timestamp "[DEBUG] $1" >> "$LOG_FILE" 2>/dev/null || true
        fi
    fi
}

# Progress indicator
log_step() {
    echo -e "${BLUE}==>${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Verify sudo access
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_error "This script requires sudo privileges"
        exit 1
    fi
}

# Backup file with timestamp
backup_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "Backing up $file to $backup"
        sudo cp "$file" "$backup"
    fi
}