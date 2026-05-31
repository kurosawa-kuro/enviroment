#!/usr/bin/env node

// =============================================================================
// EKS Cluster Stack Check Script
// =============================================================================

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const SCRIPT_DIR = __dirname;
const COMMON_DIR = path.join(path.dirname(SCRIPT_DIR), 'common');

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

function validateResourceOptional(resourceType, resourceValue, successMessage, errorMessage, required = 'true') {
    if (resourceValue && resourceValue !== '' && resourceValue !== 'ERROR') {
        printSuccess(successMessage);
        return true;
    } else {
        if (required === 'true') {
            printError(errorMessage);
        } else {
            printWarning(errorMessage);
        }
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

function validateStatus(resourceType, status, expectedStatus, successMessage, errorMessage) {
    if (status === expectedStatus) {
        printSuccess(successMessage);
        return true;
    } else {
        printError(`${errorMessage}: ${status}`);
        return false;
    }
}

function checkEksClusterStatus(clusterName, region) {
    const command = `aws eks describe-cluster --name "${clusterName}" --region "${region}" --query 'cluster.status' --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkIamRoleByArn(roleArn, region) {
    const roleName = roleArn.split('/').pop();
    const command = `aws iam get-role --role-name "${roleName}" --query "Role.RoleName" --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkOidcProvider(oidcProviderArn) {
    const oidcProviderId = oidcProviderArn.split('/').pop();
    const command = `aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${oidcProviderArn}" --query "Url" --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkEksNodegroupStatus(clusterName, nodegroupName, region) {
    const command = `aws eks describe-nodegroup --cluster-name "${clusterName}" --nodegroup-name "${nodegroupName}" --region "${region}" --query 'nodegroup.status' --output text 2>/dev/null || echo "ERROR"`;
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
        const STACK_NAME = getStackName('cluster');

        printHeader('EKS Cluster Stack Check');
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

        // EKS Cluster
        printSubsection('EKS Cluster');
        const clusterName = getStackOutput(STACK_NAME, 'ClusterName', REGION);
        const clusterArn = getStackOutput(STACK_NAME, 'ClusterArn', REGION);
        const clusterEndpoint = getStackOutput(STACK_NAME, 'ClusterEndpoint', REGION);
        const clusterSecurityGroup = getStackOutput(STACK_NAME, 'ClusterSecurityGroupId', REGION);

        let clusterStatus = 'ERROR';
        if (validateResource('EKS Cluster', clusterName, 'Cluster Name', 'EKS Cluster not found')) {
            printSuccess(`Cluster ARN: ${clusterArn}`);
            printSuccess(`Cluster Endpoint: ${clusterEndpoint}`);
            printSuccess(`Cluster Security Group: ${clusterSecurityGroup}`);
            
            // Check cluster status
            clusterStatus = checkEksClusterStatus(clusterName, REGION);
            
            validateStatus('EKS Cluster', clusterStatus, 'ACTIVE', 'Cluster Status: Active', 'Cluster Status');
            
            // Check cluster version
            const clusterVersion = executeAwsCommand(`aws eks describe-cluster --name "${clusterName}" --region "${REGION}" --query 'cluster.version' --output text 2>/dev/null`);
            
            if (clusterVersion !== 'ERROR') {
                printInfo(`Kubernetes Version: ${clusterVersion}`);
            }
            
            // Check cluster logging
            const loggingEnabled = executeAwsCommand(`aws eks describe-cluster --name "${clusterName}" --region "${REGION}" --query 'cluster.logging.clusterLogging[?enabled==\`true\`].types[]' --output text 2>/dev/null`);
            
            if (loggingEnabled !== 'NONE' && loggingEnabled !== 'ERROR') {
                printSuccess(`Cluster Logging Enabled for: ${loggingEnabled}`);
            } else {
                printWarning('Cluster Logging: Disabled');
            }
        }

        // IAM Roles
        printSubsection('IAM Roles');
        const clusterRoleArn = getStackOutput(STACK_NAME, 'ClusterRoleArn', REGION);
        const nodeRoleArn = getStackOutput(STACK_NAME, 'NodeInstanceRoleArn', REGION);

        let clusterRoleExists = 'ERROR';
        let nodeRoleExists = 'ERROR';

        if (validateResource('Cluster Role', clusterRoleArn, 'Cluster Role ARN', 'Cluster Role ARN not found')) {
            // Check role exists
            clusterRoleExists = checkIamRoleByArn(clusterRoleArn, REGION);
            
            if (clusterRoleExists !== 'ERROR') {
                printSuccess('Cluster Role exists');
            } else {
                printError('Cluster Role not found');
            }
        }

        if (validateResource('Node Role', nodeRoleArn, 'Node Role ARN', 'Node Role ARN not found')) {
            // Check role exists
            nodeRoleExists = checkIamRoleByArn(nodeRoleArn, REGION);
            
            if (nodeRoleExists !== 'ERROR') {
                printSuccess('Node Role exists');
            } else {
                printError('Node Role not found');
            }
        }

        // OIDC Provider
        printSubsection('OIDC Provider');
        const oidcProviderArn = getStackOutput(STACK_NAME, 'OIDCProviderArn', REGION);

        let oidcExists = 'ERROR';
        if (validateResource('OIDC Provider', oidcProviderArn, 'OIDC Provider ARN', 'OIDC Provider not configured')) {
            // Check OIDC provider exists
            oidcExists = checkOidcProvider(oidcProviderArn);
            
            if (oidcExists !== 'ERROR') {
                printSuccess('OIDC Provider exists');
                printInfo(`OIDC URL: ${oidcExists}`);
            } else {
                printError('OIDC Provider not found');
            }
        }

        // Node Groups
        printSubsection('Node Groups');
        const nodeGroupName = getStackOutput(STACK_NAME, 'NodeGroupName', REGION);

        let nodeGroupStatus = 'ERROR';
        validateResourceOptional('Node Group', nodeGroupName, 'Node Group Name', 'Node Group not found', 'false');
        
        if (nodeGroupName && clusterName) {
            // Check node group status
            nodeGroupStatus = checkEksNodegroupStatus(clusterName, nodeGroupName, REGION);
            
            if (nodeGroupStatus === 'ACTIVE') {
                printSuccess('Node Group Status: Active');
                
                // Get node group details
                const desiredSize = executeAwsCommand(`aws eks describe-nodegroup --cluster-name "${clusterName}" --nodegroup-name "${nodeGroupName}" --region "${REGION}" --query 'nodegroup.scalingConfig.desiredSize' --output text 2>/dev/null`);
                
                const minSize = executeAwsCommand(`aws eks describe-nodegroup --cluster-name "${clusterName}" --nodegroup-name "${nodeGroupName}" --region "${REGION}" --query 'nodegroup.scalingConfig.minSize' --output text 2>/dev/null`);
                
                const maxSize = executeAwsCommand(`aws eks describe-nodegroup --cluster-name "${clusterName}" --nodegroup-name "${nodeGroupName}" --region "${REGION}" --query 'nodegroup.scalingConfig.maxSize' --output text 2>/dev/null`);
                
                printInfo(`Node Group Scaling: Desired=${desiredSize || '0'}, Min=${minSize || '0'}, Max=${maxSize || '0'}`);
                
                // Get instance types
                const instanceTypes = executeAwsCommand(`aws eks describe-nodegroup --cluster-name "${clusterName}" --nodegroup-name "${nodeGroupName}" --region "${REGION}" --query 'nodegroup.instanceTypes[]' --output text 2>/dev/null`);
                
                if (instanceTypes !== 'ERROR') {
                    printInfo(`Instance Types: ${instanceTypes}`);
                }
            } else {
                printWarning(`Node Group Status: ${nodeGroupStatus}`);
            }
        }

        // kubectl Configuration
        printSubsection('kubectl Configuration');
        const kubectlConfigCmd = getStackOutput(STACK_NAME, 'ConfigCommand', REGION);

        validateResourceOptional('kubectl Config', kubectlConfigCmd, 'kubectl Configuration Command Available', 'kubectl configuration command not available', 'false');
        
        if (kubectlConfigCmd) {
            printInfo('Configure kubectl with:');
            console.log(kubectlConfigCmd);
        }

        // EKS Add-ons
        printSubsection('EKS Add-ons');

        if (clusterName) {
            const addons = executeAwsCommand(`aws eks list-addons --cluster-name "${clusterName}" --region "${REGION}" --query 'addons[]' --output text 2>/dev/null`);
            
            if (addons && addons !== 'ERROR') {
                printSuccess('Installed Add-ons:');
                const addonList = addons.split(/\s+/);
                
                for (const addon of addonList) {
                    if (addon.trim()) {
                        const addonStatus = executeAwsCommand(`aws eks describe-addon --cluster-name "${clusterName}" --addon-name "${addon}" --region "${REGION}" --query 'addon.status' --output text 2>/dev/null`);
                        
                        const addonVersion = executeAwsCommand(`aws eks describe-addon --cluster-name "${clusterName}" --addon-name "${addon}" --region "${REGION}" --query 'addon.addonVersion' --output text 2>/dev/null`);
                        
                        printInfo(`  ${addon}: ${addonStatus || 'UNKNOWN'} (Version: ${addonVersion || 'Unknown'})`);
                    }
                }
            } else {
                printWarning('No EKS add-ons installed');
            }
        }

        // Initialize summary
        initCheckCounters();

        // Count checks
        if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Cluster checks
        if (clusterName && clusterStatus === 'ACTIVE') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // IAM Role checks
        if (clusterRoleArn && nodeRoleArn) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // OIDC Provider check
        if (oidcProviderArn && oidcExists !== 'NOT_FOUND') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Node Group check (optional but important)
        if (nodeGroupName && nodeGroupStatus === 'ACTIVE') {
            addCheckResult(true);
        } else if (nodeGroupName) {
            addCheckResult(false);
        }

        if (printSummary('EKS Cluster')) {
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