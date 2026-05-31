#!/usr/bin/env node

// =============================================================================
// IAM Roles Stack Check Script
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

function checkIamRoleByArn(roleArn, region) {
    const roleName = roleArn.split('/').pop();
    const command = `aws iam get-role --role-name "${roleName}" --query "Role.RoleName" --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
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
        const STACK_NAME = getStackName('iam-role');

        printHeader('IAM Roles Stack Check');
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

        // EC2 IAM Role
        printSubsection('EC2 IAM Role');
        const ec2RoleName = getStackOutput(STACK_NAME, 'EC2RoleName', REGION);
        const ec2RoleArn = getStackOutput(STACK_NAME, 'EC2RoleArn', REGION);

        let roleExists = 'ERROR';
        if (validateResource('EC2 Role', ec2RoleName, 'EC2 Role Name', 'EC2 Role not found')) {
            printSuccess(`EC2 Role ARN: ${ec2RoleArn}`);
            
            // Check role exists
            roleExists = checkIamRoleByArn(ec2RoleArn, REGION);
            
            if (roleExists !== 'ERROR') {
                printSuccess('EC2 Role exists and is accessible');
                
                // Check attached policies
                const attachedPolicies = executeAwsCommand(`aws iam list-attached-role-policies --role-name "${ec2RoleName}" --query 'AttachedPolicies[].PolicyName' --output text 2>/dev/null`);
                
                if (attachedPolicies !== 'ERROR') {
                    printInfo(`Attached Managed Policies: ${attachedPolicies}`);
                }
                
                // Check inline policies
                const inlinePolicies = executeAwsCommand(`aws iam list-role-policies --role-name "${ec2RoleName}" --query 'PolicyNames[]' --output text 2>/dev/null`);
                
                if (inlinePolicies !== 'ERROR' && inlinePolicies) {
                    printInfo(`Inline Policies: ${inlinePolicies}`);
                }
            } else {
                printError('EC2 Role not accessible');
            }
        }

        // Instance Profile
        printSubsection('Instance Profile');
        const instanceProfileName = getStackOutput(STACK_NAME, 'InstanceProfileName', REGION);
        const instanceProfileArn = getStackOutput(STACK_NAME, 'InstanceProfileArn', REGION);

        let profileExists = 'ERROR';
        if (validateResource('Instance Profile', instanceProfileName, 'Instance Profile Name', 'Instance Profile not found')) {
            printSuccess(`Instance Profile ARN: ${instanceProfileArn}`);
            
            // Check instance profile exists
            profileExists = executeAwsCommand(`aws iam get-instance-profile --instance-profile-name "${instanceProfileName}" --query 'InstanceProfile.Arn' --output text 2>/dev/null`);
            
            if (profileExists !== 'ERROR') {
                printSuccess('Instance Profile exists and is accessible');
                
                // Check associated roles
                const profileRoles = executeAwsCommand(`aws iam get-instance-profile --instance-profile-name "${instanceProfileName}" --query 'InstanceProfile.Roles[].RoleName' --output text 2>/dev/null`);
                
                if (profileRoles !== 'ERROR') {
                    printInfo(`Associated Roles: ${profileRoles}`);
                }
            } else {
                printError('Instance Profile not accessible');
            }
        }

        // SSM Parameters
        printSubsection('SSM Parameters');
        const ec2RoleParam = executeAwsCommand(`aws ssm get-parameter --name "/eks/eks-platform-v2/ec2-role-arn" --query 'Parameter.Value' --output text 2>/dev/null`);

        const instanceProfileParam = executeAwsCommand(`aws ssm get-parameter --name "/eks/eks-platform-v2/instance-profile-arn" --query 'Parameter.Value' --output text 2>/dev/null`);

        if (ec2RoleParam !== 'ERROR') {
            printSuccess('EC2 Role ARN Parameter stored in SSM');
        } else {
            printWarning('EC2 Role ARN Parameter not found in SSM');
        }

        if (instanceProfileParam !== 'ERROR') {
            printSuccess('Instance Profile ARN Parameter stored in SSM');
        } else {
            printWarning('Instance Profile ARN Parameter not found in SSM');
        }

        // Initialize summary
        initCheckCounters();

        // Count checks
        if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // IAM Role checks
        if (ec2RoleName && roleExists !== 'ERROR') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Instance Profile checks
        if (instanceProfileName && profileExists !== 'ERROR') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // SSM Parameter checks
        if (ec2RoleParam !== 'ERROR' && instanceProfileParam !== 'ERROR') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (printSummary('IAM Roles')) {
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