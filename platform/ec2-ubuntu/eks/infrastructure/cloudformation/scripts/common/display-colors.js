#!/usr/bin/env node

// =============================================================================
// Common Color Output Functions
// =============================================================================
// このファイルは色付きログ出力の共通機能を提供します
// =============================================================================

// Color codes for output
const colors = {
    RED: '\x1b[0;31m',
    GREEN: '\x1b[0;32m',
    YELLOW: '\x1b[1;33m',
    BLUE: '\x1b[0;34m',
    PURPLE: '\x1b[0;35m',
    CYAN: '\x1b[0;36m',
    WHITE: '\x1b[1;37m',
    NC: '\x1b[0m' // No Color
};

// =============================================================================
// Print Functions
// =============================================================================

// Print section header
function printHeader(title) {
    console.log(`${colors.BLUE}=== ${title} ===${colors.NC}`);
}

// Print subsection header
function printSubsection(title) {
    console.log(`${colors.BLUE}--- ${title} ---${colors.NC}`);
}

// Print section divider
function printSection(title) {
    console.log('');
    console.log('===============================================');
    console.log(title);
    console.log('===============================================');
}

// Print separator line
function printSeparator() {
    console.log(`${colors.YELLOW}${'−'.repeat(50)}${colors.NC}`);
}

// =============================================================================
// Logging Functions
// =============================================================================

// Print info message
function printInfo(message) {
    console.log(`${colors.YELLOW}${message}${colors.NC}`);
}

// Print success message
function printSuccess(message) {
    console.log(`${colors.GREEN}✓ ${message}${colors.NC}`);
}

// Print error message
function printError(message) {
    console.log(`${colors.RED}✗ ${message}${colors.NC}`);
}

// Print warning message
function printWarning(message) {
    console.log(`${colors.YELLOW}! ${message}${colors.NC}`);
}

// Print debug message
function printDebug(message) {
    console.log(`${colors.PURPLE}[DEBUG]${colors.NC} ${message}`);
}

// Print highlight message
function printHighlight(message) {
    console.log(`${colors.CYAN}[HIGHLIGHT]${colors.NC} ${message}`);
}

// Print step message
function printStep(message) {
    console.log(`${colors.BLUE}[STEP]${colors.NC} ${message}`);
}

// Print fail message (for cleanup scripts)
function printFail(message) {
    console.log(`${colors.RED}✗ ${message}${colors.NC}`);
}

// =============================================================================
// Legacy Function Names (for backward compatibility)
// =============================================================================

// Legacy function names for backward compatibility
function logInfo(message) {
    printInfo(message);
}

function logWarn(message) {
    printWarning(message);
}

function logError(message) {
    printError(message);
}

function logSuccess(message) {
    printSuccess(message);
}

function logWarning(message) {
    printWarning(message);
}

// =============================================================================
// Export Functions
// =============================================================================

module.exports = {
    colors,
    printHeader,
    printSubsection,
    printSection,
    printSeparator,
    printInfo,
    printSuccess,
    printError,
    printWarning,
    printDebug,
    printHighlight,
    printStep,
    printFail,
    // Legacy function names
    logInfo,
    logWarn,
    logError,
    logSuccess,
    logWarning
};