#!/bin/bash

# =============================================================================
# Common Color Output Functions
# =============================================================================
# このスクリプトは色付きログ出力の共通機能を提供します

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# =============================================================================
# Logging Functions
# =============================================================================

# Print colored output functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

print_highlight() {
    echo -e "${CYAN}[HIGHLIGHT]${NC} $1"
}

# Legacy function names for backward compatibility
log_info() {
    print_info "$1"
}

log_warn() {
    print_warning "$1"
}

log_error() {
    print_error "$1"
}

# =============================================================================
# Utility Functions
# =============================================================================

# Print section header
print_section() {
    echo -e "\n${WHITE}=== $1 ===${NC}\n"
}

# Print subsection header
print_subsection() {
    echo -e "\n${CYAN}--- $1 ---${NC}\n"
}

# Print separator line
print_separator() {
    echo -e "${YELLOW}$(printf '%.0s-' {1..50})${NC}"
}

# =============================================================================
# Export Functions
# =============================================================================

# Export all functions so they can be used by sourcing scripts
export -f print_info print_success print_warning print_error print_debug print_highlight
export -f log_info log_warn log_error
export -f print_section print_subsection print_separator
