#!/usr/bin/env node

// =============================================================================
// Prerequisites Stack Check Script (KMS, ECR, S3, IAM)
// =============================================================================

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const SCRIPT_DIR = __dirname;
const COMMON_DIR = path.join(path.dirname(SCRIPT_DIR), 'common');

// ANSI color codes
const colors = {
    RED: '\x1b[0;31m',
    GREEN: '\x1b[0;32m',
    YELLOW: '\x1b[0;33m',
    BLUE: '\x1b[0;34m',
    PURPLE: '\x1b[0;35m',
    CYAN: '\x1b[0;36m',
    WHITE: '\x1b[0;37m',
    BOLD: '\x1b[1m',
    NC: '\x1b[0m' // No Color
};

// Logging functions
function printHeader(message) {
    console.log(`\n${colors.BOLD}${colors.BLUE}===============================================${colors.NC}`);
    console.log(`${colors.BOLD}${colors.BLUE}${message}${colors.NC}`);
    console.log(`${colors.BOLD}${colors.BLUE}===============================================${colors.NC}\n`);
}

function printSubsection(message) {
    console.log(`\n${colors.BOLD}${colors.CYAN}--- ${message} ---${colors.NC}`);
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

// Utility functions
function executeAwsCommand(command) {
    try {
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
        return result || '';
    } catch (error) {
        return 'ERROR';
    }
}

function getStackName(stackType) {
    const projectName = process.env.PROJECT_NAME || 'eks-platform';
    const version = 'v2';
    return `${projectName}-${stackType}-${version}`;
}

function getStackOutput(stackName, outputKey, region) {
    const command = `aws cloudformation describe-stacks --stack-name "${stackName}" --region "${region}" --query "Stacks[0].Outputs[?OutputKey=='${outputKey}'].OutputValue" --output text 2>/dev/null || echo ""`;
    return executeAwsCommand(command);
}

function checkStackStatus(stackName, region) {
    const command = `aws cloudformation describe-stacks --stack-name "${stackName}" --region "${region}" --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "NOT_FOUND"`;
    return executeAwsCommand(command);
}

function validateResource(resourceType, resourceValue, successMessage, errorMessage) {
    if (resourceValue && resourceValue !== '' && resourceValue !== 'ERROR') {
        printSuccess(`${resourceType}: ${resourceValue}`);
        return true;
    } else {
        printError(errorMessage);
        return false;
    }
}

function validateStackStatus(stackStatus, stackName) {
    if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
        printSuccess(`Stack Status: ${stackStatus}`);
        return true;
    } else {
        printError(`Stack Status: ${stackStatus} (Expected: CREATE_COMPLETE or UPDATE_COMPLETE)`);
        return false;
    }
}

// Check counters
let totalChecks = 0;
let passedChecks = 0;

function initCheckCounters() {
    totalChecks = 0;
    passedChecks = 0;
}

function addCheckResult(passed) {
    totalChecks++;
    if (passed === 'true' || passed === true) {
        passedChecks++;
    }
}

function printSummary(componentName) {
    console.log(`\n${colors.BOLD}${colors.PURPLE}=== ${componentName} Check Summary ===${colors.NC}`);
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${colors.GREEN}${passedChecks}${colors.NC}`);
    console.log(`Failed: ${colors.RED}${totalChecks - passedChecks}${colors.NC}`);
    
    if (passedChecks === totalChecks) {
        printSuccess(`All ${componentName} checks passed`);
        return true;
    } else {
        printError(`Some ${componentName} checks failed`);
        return false;
    }
}

async function main() {
    try {
        // Configuration
        const REGION = process.env.DEFAULT_REGION || 'ap-northeast-1';
        const STACK_NAME = getStackName('prerequisites');

        printHeader('Prerequisites Stack Check');
        console.log(`Region: ${REGION}`);
        console.log(`Stack: ${STACK_NAME}`);
        console.log('');

        // Check stack status
        printInfo('Checking stack status...');
        const stackStatus = checkStackStatus(STACK_NAME, REGION);

        if (!validateStackStatus(stackStatus, STACK_NAME)) {
            process.exit(1);
        }

        // Get stack outputs
        console.log('');
        printInfo('Retrieving stack outputs...');

        // ECR Repository
        printSubsection('ECR Repository');
        const ecrRepoName = getStackOutput(STACK_NAME, 'ECRRepositoryName', REGION);
        const ecrRepoUri = getStackOutput(STACK_NAME, 'ECRRepositoryUri', REGION);
        let ecrStatus = 'ERROR';

        if (validateResource('ECR Repository', ecrRepoName, 'ECR Repository', 'ECR Repository not found')) {
            printSuccess(`ECR URI: ${ecrRepoUri}`);
            
            // Check ECR repository access
            ecrStatus = executeAwsCommand(`aws ecr describe-repositories --repository-names "${ecrRepoName}" --region "${REGION}" --query "repositories[0].repositoryName" --output text 2>/dev/null`);
            
            if (ecrStatus === ecrRepoName) {
                printSuccess('ECR Repository accessible');
                
                // Check lifecycle policy
                const lifecyclePolicy = executeAwsCommand(`aws ecr get-lifecycle-policy --repository-name "${ecrRepoName}" --region "${REGION}" --query 'lifecyclePolicyText' --output text 2>/dev/null`);
                
                if (lifecyclePolicy !== 'NONE' && lifecyclePolicy !== 'ERROR') {
                    printSuccess('ECR Lifecycle Policy configured');
                } else {
                    printWarning('No ECR Lifecycle Policy configured');
                }
            } else {
                printError('ECR Repository access failed');
            }
        }

        // S3 Bucket
        printSubsection('S3 Bucket');
        const bucketName = getStackOutput(STACK_NAME, 'BucketName', REGION);
        const bucketArn = getStackOutput(STACK_NAME, 'BucketArn', REGION);

        if (validateResource('S3 Bucket', bucketName, 'S3 Bucket', 'S3 Bucket not found')) {
            printSuccess(`S3 Bucket ARN: ${bucketArn}`);
            
            // Check bucket access
            const bucketAccess = executeAwsCommand(`aws s3api head-bucket --bucket "${bucketName}" 2>/dev/null && echo "accessible" || echo "ERROR"`);
            
            // if (bucketAccess === 'accessible') {
            //     printSuccess('S3 Bucket accessible');
                
            //     // Check versioning
            //     const versioning = executeAwsCommand(`aws s3api get-bucket-versioning --bucket "${bucketName}" --region "${REGION}" --query 'Status' --output text 2>/dev/null`);
                
            //     if (versioning === 'Enabled') {
            //         printSuccess('S3 Versioning: Enabled');
            //     } else {
            //         printWarning(`S3 Versioning: ${versioning || 'Disabled'}`);
            //     }
            // } else {
            //     printError('S3 Bucket access failed');
            // }
            
            // Check bucket encryption
            const encryption = executeAwsCommand(`aws s3api get-bucket-encryption --bucket "${bucketName}" --region "${REGION}" --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text 2>/dev/null`);
            
            if (encryption !== 'NONE' && encryption !== 'ERROR') {
                printSuccess(`S3 Bucket Encryption: ${encryption}`);
            } else {
                printWarning('S3 Bucket not encrypted');
            }
        }

        // Upload Command
        printSubsection('Script Upload');
        const uploadCommand = getStackOutput(STACK_NAME, 'UploadCommand', REGION);

        if (uploadCommand) {
            printSuccess('Upload Command Available');
            printInfo('Command to upload scripts to S3:');
            console.log(uploadCommand);
        } else {
            printInfo('Upload Command not available');
        }

        // Initialize summary
        initCheckCounters();

        // Count checks
        if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (ecrRepoName && ecrStatus === ecrRepoName) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (bucketName) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (printSummary('Prerequisites')) {
            process.exit(0);
        } else {
            process.exit(1);
        }

    } catch (error) {
        console.error(`${colors.RED}Error: ${error.message}${colors.NC}`);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main();
}

module.exports = { main };