#!/usr/bin/env node

// =============================================================================
// Run All Stack Checks
// =============================================================================

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SCRIPT_DIR = __dirname;
const COMMON_DIR = path.join(path.dirname(SCRIPT_DIR), 'common');

// Import common functions (would need to be converted to JS modules)
// For now, we'll implement basic functionality inline

// ANSI color codes
const colors = {
    RED: '\033[0;31m',
    GREEN: '\033[0;32m',
    YELLOW: '\033[0;33m',
    BLUE: '\033[0;34m',
    PURPLE: '\033[0;35m',
    CYAN: '\033[0;36m',
    WHITE: '\033[0;37m',
    BOLD: '\033[1m',
    NC: '\033[0m' // No Color
};

// Logging functions
function printHeader(message) {
    console.log(`\n${colors.BOLD}${colors.BLUE}===============================================${colors.NC}`);
    console.log(`${colors.BOLD}${colors.BLUE}${message}${colors.NC}`);
    console.log(`${colors.BOLD}${colors.BLUE}===============================================${colors.NC}\n`);
}

function printSeparator() {
    console.log(`${colors.CYAN}-----------------------------------------------${colors.NC}`);
}

function printError(message) {
    console.log(`${colors.RED}✗ ${message}${colors.NC}`);
}

function printSuccess(message) {
    console.log(`${colors.GREEN}✓ ${message}${colors.NC}`);
}

function printInfo(message) {
    console.log(`${colors.BLUE}ℹ ${message}${colors.NC}`);
}

function printWarning(message) {
    console.log(`${colors.YELLOW}⚠ ${message}${colors.NC}`);
}

// Get default region from environment or config
const DEFAULT_REGION = process.env.DEFAULT_REGION || 'ap-northeast-1';

async function main() {
    try {
        printHeader('Running All Stack Checks');
        console.log(`Region: ${DEFAULT_REGION}`);
        console.log('');

        // Track overall status
        let overallSuccess = true;

        // List of check scripts to run in order
        const checkScripts = [
            'check-01-prerequisites.js',
            'check-02-iam-role.js',
            'check-03-network.js',
            'check-04-eks-cluster.js',
            'check-05-alb.js',
            'check-06-bastion.js'
        ];

        // Run each check script
        for (const script of checkScripts) {
            const scriptPath = path.join(SCRIPT_DIR, script);
            
            if (fs.existsSync(scriptPath)) {
                printSeparator();
                try {
                    console.log(`\n${colors.CYAN}Running: ${script}${colors.NC}\n`);
                    execSync(`node "${scriptPath}"`, { 
                        stdio: 'inherit',
                        cwd: SCRIPT_DIR 
                    });
                    printSuccess(`Check passed: ${script}`);
                } catch (error) {
                    overallSuccess = false;
                    printError(`Check failed: ${script}`);
                }
            } else {
                printWarning(`Check script not found: ${script}`);
            }
        }

        // Final summary
        printSeparator();
        printHeader('Overall Check Summary');

        if (overallSuccess) {
            printSuccess('All stack checks passed successfully');
            process.exit(0);
        } else {
            printError('Some stack checks failed');
            process.exit(1);
        }

    } catch (error) {
        console.error(`${colors.RED}Error running checks: ${error.message}${colors.NC}`);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main();
}

module.exports = { main };