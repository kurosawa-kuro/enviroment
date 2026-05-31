#!/usr/bin/env node

// =============================================================================
// ALB Stack Check Script
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

function checkAlbStatus(albArn, region) {
    const command = `aws elbv2 describe-load-balancers --load-balancer-arns "${albArn}" --region "${region}" --query 'LoadBalancers[0].State.Code' --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkTargetGroup(targetGroupArn, region) {
    const command = `aws elbv2 describe-target-groups --target-group-arns "${targetGroupArn}" --region "${region}" --query 'TargetGroups[0].HealthCheckProtocol' --output text 2>/dev/null || echo "ERROR"`;
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
        const STACK_NAME = getStackName('alb');

        printHeader('Application Load Balancer Stack Check');
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

        // Application Load Balancer
        printSubsection('Application Load Balancer');
        const albArn = getStackOutput(STACK_NAME, 'ApplicationLoadBalancer', REGION);
        const albDns = getStackOutput(STACK_NAME, 'ALBDNSName', REGION);
        const albHostedZone = getStackOutput(STACK_NAME, 'ALBHostedZone', REGION);
        const albSg = getStackOutput(STACK_NAME, 'ALBSecurityGroup', REGION);

        let albState = 'ERROR';
        if (validateResource('ALB', albArn, 'ALB ARN', 'ALB not found')) {
            printSuccess(`ALB DNS Name: ${albDns}`);
            printSuccess(`ALB Hosted Zone: ${albHostedZone}`);
            printSuccess(`ALB Security Group: ${albSg}`);
            
            // Check ALB state
            albState = checkAlbStatus(albArn, REGION);
            
            validateStatus('ALB', albState, 'active', 'ALB State: Active', 'ALB State');
            
            // Check ALB scheme
            const albScheme = executeAwsCommand(`aws elbv2 describe-load-balancers --load-balancer-arns "${albArn}" --region "${REGION}" --query 'LoadBalancers[0].Scheme' --output text 2>/dev/null`);
            
            if (albScheme !== 'ERROR') {
                printInfo(`ALB Scheme: ${albScheme}`);
            }
            
            // Check ALB type
            const albType = executeAwsCommand(`aws elbv2 describe-load-balancers --load-balancer-arns "${albArn}" --region "${REGION}" --query 'LoadBalancers[0].Type' --output text 2>/dev/null`);
            
            if (albType !== 'ERROR') {
                printInfo(`ALB Type: ${albType}`);
            }
        }

        // Target Groups
        printSubsection('Target Groups');
        const targetGroupHttpArn = getStackOutput(STACK_NAME, 'EKSTargetGroup', REGION);
        const targetGroupHttpsArn = getStackOutput(STACK_NAME, 'TargetGroupHTTPSArn', REGION);

        validateResourceOptional('HTTP Target Group', targetGroupHttpArn, 'HTTP Target Group ARN', 'HTTP Target Group not found', 'false');
        
        if (targetGroupHttpArn) {
            // Check target group health
            const tgHealth = checkTargetGroup(targetGroupHttpArn, REGION);
            
            if (tgHealth !== 'ERROR') {
                printInfo(`HTTP Target Group Health Check Protocol: ${tgHealth}`);
                
                // Get health check path
                const healthPath = executeAwsCommand(`aws elbv2 describe-target-groups --target-group-arns "${targetGroupHttpArn}" --region "${REGION}" --query 'TargetGroups[0].HealthCheckPath' --output text 2>/dev/null`);
                
                if (healthPath !== 'ERROR') {
                    printInfo(`HTTP Target Group Health Check Path: ${healthPath}`);
                }
            }
        }

        validateResourceOptional('HTTPS Target Group', targetGroupHttpsArn, 'HTTPS Target Group ARN', 'HTTPS Target Group not found', 'false');
        
        if (targetGroupHttpsArn) {
            // Check target group health
            const tgHealth = checkTargetGroup(targetGroupHttpsArn, REGION);
            
            if (tgHealth !== 'ERROR') {
                printInfo(`HTTPS Target Group Health Check Protocol: ${tgHealth}`);
                
                // Get health check path
                const healthPath = executeAwsCommand(`aws elbv2 describe-target-groups --target-group-arns "${targetGroupHttpsArn}" --region "${REGION}" --query 'TargetGroups[0].HealthCheckPath' --output text 2>/dev/null`);
                
                if (healthPath !== 'ERROR') {
                    printInfo(`HTTPS Target Group Health Check Path: ${healthPath}`);
                }
            }
        }

        // Listeners
        printSubsection('Listeners');
        const httpListenerArn = getStackOutput(STACK_NAME, 'HTTPListener', REGION);
        const httpsListenerArn = getStackOutput(STACK_NAME, 'HTTPSListenerArn', REGION);

        validateResourceOptional('HTTP Listener', httpListenerArn, 'HTTP Listener ARN', 'HTTP Listener not found', 'false');
        
        if (httpListenerArn) {
            // Check listener port
            const listenerPort = executeAwsCommand(`aws elbv2 describe-listeners --listener-arns "${httpListenerArn}" --region "${REGION}" --query 'Listeners[0].Port' --output text 2>/dev/null`);
            
            if (listenerPort !== 'ERROR') {
                printInfo(`HTTP Listener Port: ${listenerPort}`);
            }
        }

        validateResourceOptional('HTTPS Listener', httpsListenerArn, 'HTTPS Listener ARN', 'HTTPS Listener not found (Certificate might not be configured)', 'false');
        
        if (httpsListenerArn) {
            // Check listener port
            const listenerPort = executeAwsCommand(`aws elbv2 describe-listeners --listener-arns "${httpsListenerArn}" --region "${REGION}" --query 'Listeners[0].Port' --output text 2>/dev/null`);
            
            if (listenerPort !== 'ERROR') {
                printInfo(`HTTPS Listener Port: ${listenerPort}`);
            }
            
            // Check SSL certificate
            const certArn = executeAwsCommand(`aws elbv2 describe-listeners --listener-arns "${httpsListenerArn}" --region "${REGION}" --query 'Listeners[0].Certificates[0].CertificateArn' --output text 2>/dev/null`);
            
            if (certArn !== 'NONE' && certArn !== 'None' && certArn !== 'ERROR') {
                printSuccess('SSL Certificate configured');
            } else {
                printWarning('No SSL Certificate configured');
            }
        }

        // WAF Association
        printSubsection('WAF Configuration');
        const wafAssociation = getStackOutput(STACK_NAME, 'WAFWebACLAssociation', REGION);

        if (wafAssociation) {
            printSuccess(`WAF Web ACL Associated: ${wafAssociation}`);
        } else {
            printInfo('WAF not configured (optional)');
        }

        // ALB Logs
        printSubsection('ALB Access Logs');
        const albLogBucket = getStackOutput(STACK_NAME, 'ALBLogBucket', REGION);

        if (albLogBucket) {
            printSuccess(`ALB Log Bucket: ${albLogBucket}`);
            
            // Check if logging is enabled
            const loggingEnabled = executeAwsCommand(`aws elbv2 describe-load-balancer-attributes --load-balancer-arn "${albArn}" --region "${REGION}" --query 'Attributes[?Key==\`access_logs.s3.enabled\`].Value' --output text 2>/dev/null`);
            
            if (loggingEnabled === 'true') {
                printSuccess('ALB Access Logs: Enabled');
            } else {
                printWarning('ALB Access Logs: Disabled');
            }
        } else {
            printInfo('ALB Access Logs not configured');
        }

        // Initialize summary
        initCheckCounters();

        // Count checks
        if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // ALB checks
        if (albArn && albState === 'active') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Target Group checks (at least one required)
        if (targetGroupHttpArn || targetGroupHttpsArn) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Listener checks (at least one required)
        if (httpListenerArn || httpsListenerArn) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Security Group check
        if (albSg) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (printSummary('Application Load Balancer')) {
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