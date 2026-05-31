#!/usr/bin/env node

// =============================================================================
// Validation Common Functions
// =============================================================================
// このファイルはバリデーション機能の共通関数を提供します
// =============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import color functions
const colors = require('./display-colors.js');
const { printSuccess, printError, printWarning, printInfo } = colors;

// Default region
const DEFAULT_REGION = 'ap-northeast-1';

// Check counters
let TOTAL_CHECKS = 0;
let PASSED_CHECKS = 0;

// =============================================================================
// Resource Validation Functions
// =============================================================================

// Validate resource exists and print result
function validateResource(resourceName, resourceValue, successMessage, errorMessage) {
    if (resourceValue && resourceValue !== '' && resourceValue !== 'ERROR') {
        printSuccess(`${successMessage}: ${resourceValue}`);
        return true;
    } else {
        printError(errorMessage);
        return false;
    }
}

// Validate resource status
function validateStatus(resourceName, statusValue, expectedStatus, successMessage, errorMessage) {
    if (statusValue === expectedStatus) {
        printSuccess(`${successMessage}: ${statusValue}`);
        return true;
    } else {
        printError(`${errorMessage}: ${statusValue}`);
        return false;
    }
}

// Enhanced validation with optional checks
function validateResourceOptional(resourceName, resourceValue, successMessage, warningMessage, isRequired = false) {
    if (resourceValue && resourceValue !== '' && resourceValue !== 'ERROR') {
        printSuccess(`${successMessage}: ${resourceValue}`);
        return 0; // Success
    } else {
        if (isRequired === true || isRequired === 'true') {
            printError(warningMessage);
            return 1; // Error
        } else {
            printWarning(warningMessage);
            return 2; // Warning
        }
    }
}

// =============================================================================
// Summary Functions
// =============================================================================

// Initialize check counters
function initCheckCounters() {
    TOTAL_CHECKS = 0;
    PASSED_CHECKS = 0;
}

// Add check result
function addCheckResult(passed) {
    TOTAL_CHECKS++;
    if (passed === true || passed === 'true') {
        PASSED_CHECKS++;
    }
}

// Print final summary
function printSummary(serviceName) {
    console.log('');
    printInfo('Summary');
    console.log(`Passed: ${PASSED_CHECKS}/${TOTAL_CHECKS}`);
    
    if (PASSED_CHECKS === TOTAL_CHECKS) {
        printSuccess(`All checks passed - ${serviceName} ready`);
        return true;
    } else {
        printError('Some checks failed - Review issues above');
        return false;
    }
}

// Enhanced summary with detailed breakdown
function printDetailedSummary(serviceName, warnings = 0) {
    console.log('');
    printInfo('Summary');
    console.log(`Passed: ${PASSED_CHECKS}/${TOTAL_CHECKS}`);
    
    if (warnings > 0) {
        console.log(`Warnings: ${warnings}`);
    }
    
    if (PASSED_CHECKS === TOTAL_CHECKS) {
        printSuccess(`All checks passed - ${serviceName} ready`);
        if (warnings > 0) {
            printWarning(`Note: ${warnings} warnings present (non-critical)`);
        }
        return true;
    } else {
        printError('Some checks failed - Review issues above');
        return false;
    }
}

// Cleanup verification summary
function printCleanupSummary(totalChecks, passedChecks, projectName) {
    console.log('=========================================');
    console.log('Cleanup Verification Summary');
    console.log('=========================================');
    console.log(`Total checks: ${totalChecks}`);
    console.log(`Passed checks: ${passedChecks}`);
    console.log(`Failed checks: ${totalChecks - passedChecks}`);
    console.log('');
    
    if (passedChecks === totalChecks) {
        printSuccess('✓ Cleanup completed successfully - No remaining resources found');
        console.log('');
        printInfo(`All resources for project '${projectName}' have been properly cleaned up`);
        return true;
    } else {
        printError('✗ Cleanup verification failed - Some resources still remain');
        console.log('');
        printError('Some resources were not cleaned up properly. Please review the output above');
        printWarning('You may need to run the cleanup script again or manually clean up remaining resources');
        return false;
    }
}

// =============================================================================
// Batch Check Functions
// =============================================================================

// Batch check results with status tracking
function addCheckResults(results) {
    for (const result of results) {
        addCheckResult(result);
    }
}

// Check multiple SSM parameters
function checkSsmParameters(region = DEFAULT_REGION, ...params) {
    let total = 0;
    let success = 0;
    
    for (const param of params) {
        total++;
        try {
            const paramValue = execSync(`aws ssm get-parameter --name "${param}" --region "${region}" --query 'Parameter.Value' --output text 2>/dev/null`, { encoding: 'utf8' }).trim();
            
            if (paramValue && paramValue !== 'ERROR') {
                printSuccess(`SSM Parameter: ${param}`);
                success++;
            } else {
                printWarning(`SSM Parameter missing: ${param} (may not be configured)`);
            }
        } catch (error) {
            printWarning(`SSM Parameter missing: ${param} (may not be configured)`);
        }
    }
    
    return `${success}/${total}`;
}

// =============================================================================
// Utility Validation Functions
// =============================================================================

// Validate AWS credentials
function validateAwsCredentials() {
    try {
        execSync('aws sts get-caller-identity', { stdio: 'pipe' });
        
        const accountId = execSync('aws sts get-caller-identity --query Account --output text 2>/dev/null', { encoding: 'utf8' }).trim();
        const userArn = execSync('aws sts get-caller-identity --query Arn --output text 2>/dev/null', { encoding: 'utf8' }).trim();
        
        printSuccess('AWS credentials validated');
        printInfo(`Account ID: ${accountId}`);
        printInfo(`User ARN: ${userArn}`);
        return true;
    } catch (error) {
        printError('AWS credentials are not configured or invalid');
        return false;
    }
}

// Validate required commands
function validateRequiredCommands(commands) {
    const missingCommands = [];
    
    for (const cmd of commands) {
        try {
            execSync(`command -v ${cmd}`, { stdio: 'pipe' });
        } catch (error) {
            missingCommands.push(cmd);
        }
    }
    
    if (missingCommands.length === 0) {
        printSuccess('All required commands are available');
        return true;
    } else {
        printError(`Missing required commands: ${missingCommands.join(', ')}`);
        return false;
    }
}

// Validate file exists
function validateFileExists(filePath, description = 'File') {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        printSuccess(`${description} exists: ${filePath}`);
        return true;
    } else {
        printError(`${description} not found: ${filePath}`);
        return false;
    }
}

// Validate directory exists
function validateDirectoryExists(dirPath, description = 'Directory') {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        printSuccess(`${description} exists: ${dirPath}`);
        return true;
    } else {
        printError(`${description} not found: ${dirPath}`);
        return false;
    }
}

// Validate Environment variable
function validateEnvVar(varName, isRequired = false) {
    const varValue = process.env[varName];
    
    if (varValue) {
        printSuccess(`Environment variable ${varName} is set`);
        return true;
    } else {
        if (isRequired === true || isRequired === 'true') {
            printError(`Required Environment variable ${varName} is not set`);
            return false;
        } else {
            printWarning(`Environment variable ${varName} is not set (optional)`);
            return true; // Return true for optional variables
        }
    }
}

// =============================================================================
// Network Validation Functions
// =============================================================================

// Validate IP address format
function validateIpAddress(ip) {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipRegex);
    
    if (match) {
        const octets = match.slice(1, 5).map(Number);
        return octets.every(octet => octet >= 0 && octet <= 255);
    }
    return false;
}

// Validate CIDR format
function validateCidr(cidr) {
    const cidrRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
    const match = cidr.match(cidrRegex);
    
    if (match) {
        const ipPart = match.slice(1, 5).join('.');
        const prefixPart = Number(match[5]);
        
        return validateIpAddress(ipPart) && prefixPart >= 0 && prefixPart <= 32;
    }
    return false;
}

// Validate port number
function validatePort(port) {
    const portNum = Number(port);
    return Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;
}

// =============================================================================
// String Validation Functions
// =============================================================================

// Validate string length
function validateStringLength(string, minLength = 0, maxLength = 999999) {
    const length = string.length;
    return length >= minLength && length <= maxLength;
}

// Validate string contains only allowed characters
function validateStringChars(string, pattern) {
    const regex = new RegExp(`^[${pattern}]+$`);
    return regex.test(string);
}

// Validate string is alphanumeric
function validateAlphanumeric(string) {
    return /^[a-zA-Z0-9]+$/.test(string);
}

// Validate string is lowercase
function validateLowercase(string) {
    return /^[a-z0-9-]+$/.test(string);
}

// =============================================================================
// AWS Resource Validation Functions
// =============================================================================

// Validate CloudFormation stack exists
function validateStackExists(stackName, region = DEFAULT_REGION) {
    try {
        const result = execSync(`aws cloudformation describe-stacks --stack-name "${stackName}" --region "${region}" --query 'Stacks[0].StackName' --output text 2>/dev/null`, { encoding: 'utf8' }).trim();
        return result === stackName;
    } catch (error) {
        return false;
    }
}

// Validate S3 bucket exists
function validateS3BucketExists(bucketName, region = DEFAULT_REGION) {
    try {
        execSync(`aws s3api head-bucket --bucket "${bucketName}" --region "${region}" 2>/dev/null`, { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

// Validate EKS cluster exists
function validateEksClusterExists(clusterName, region = DEFAULT_REGION) {
    try {
        const result = execSync(`aws eks describe-cluster --name "${clusterName}" --region "${region}" --query 'cluster.name' --output text 2>/dev/null`, { encoding: 'utf8' }).trim();
        return result === clusterName;
    } catch (error) {
        return false;
    }
}

// =============================================================================
// Export Functions
// =============================================================================

module.exports = {
    // Core validation functions
    validateResource,
    validateStatus,
    validateResourceOptional,
    
    // Summary functions
    initCheckCounters,
    addCheckResult,
    addCheckResults,
    printSummary,
    printDetailedSummary,
    printCleanupSummary,
    
    // SSM functions
    checkSsmParameters,
    
    // Utility validation
    validateAwsCredentials,
    validateRequiredCommands,
    validateFileExists,
    validateDirectoryExists,
    validateEnvVar,
    
    // Network validation
    validateIpAddress,
    validateCidr,
    validatePort,
    
    // String validation
    validateStringLength,
    validateStringChars,
    validateAlphanumeric,
    validateLowercase,
    
    // AWS resource validation
    validateStackExists,
    validateS3BucketExists,
    validateEksClusterExists,
    
    // Constants and variables
    DEFAULT_REGION,
    get TOTAL_CHECKS() { return TOTAL_CHECKS; },
    get PASSED_CHECKS() { return PASSED_CHECKS; },
    set TOTAL_CHECKS(value) { TOTAL_CHECKS = value; },
    set PASSED_CHECKS(value) { PASSED_CHECKS = value; }
};