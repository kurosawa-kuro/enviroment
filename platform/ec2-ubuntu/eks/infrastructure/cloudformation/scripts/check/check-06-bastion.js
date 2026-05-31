#!/usr/bin/env node

// =============================================================================
// Bastion Host Stack Check Script
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

function checkEc2Instance(instanceId, region) {
    const command = `aws ec2 describe-instances --instance-ids "${instanceId}" --region "${region}" --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkSsmAgentStatus(instanceId, region) {
    const command = `aws ssm describe-instance-information --filters "Key=InstanceIds,Values=${instanceId}" --region "${region}" --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkAsgDetails(asgName, region) {
    const command = `aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "${asgName}" --region "${region}" --query 'AutoScalingGroups[0].[DesiredCapacity,MinSize,MaxSize]' --output text 2>/dev/null || echo "ERROR"`;
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
        const STACK_NAME = getStackName('bastion');

        printHeader('Bastion Host Stack Check');
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

        // Bastion Instance
        printSubsection('Bastion Instance');
        const bastionInstanceId = getStackOutput(STACK_NAME, 'BastionInstanceId', REGION);
        const bastionPublicIp = getStackOutput(STACK_NAME, 'BastionPublicIP', REGION);
        const bastionPrivateIp = getStackOutput(STACK_NAME, 'BastionPrivateIP', REGION);
        const bastionPublicDns = getStackOutput(STACK_NAME, 'BastionPublicDNS', REGION);

        let instanceState = 'ERROR';
        if (validateResource('Bastion Instance', bastionInstanceId, 'Instance ID', 'Bastion instance not found')) {
            printSuccess(`Public IP: ${bastionPublicIp}`);
            printSuccess(`Private IP: ${bastionPrivateIp}`);
            printSuccess(`Public DNS: ${bastionPublicDns}`);
            
            // Check instance state
            instanceState = checkEc2Instance(bastionInstanceId, REGION);
            
            if (instanceState === 'running') {
                printSuccess('Instance State: Running');
            } else {
                printWarning(`Instance State: ${instanceState}`);
            }
            
            // Check instance type
            const instanceType = executeAwsCommand(`aws ec2 describe-instances --instance-ids "${bastionInstanceId}" --region "${REGION}" --query 'Reservations[0].Instances[0].InstanceType' --output text 2>/dev/null`);
            
            if (instanceType !== 'ERROR') {
                printInfo(`Instance Type: ${instanceType}`);
            }
            
            // Check platform
            const platform = executeAwsCommand(`aws ec2 describe-instances --instance-ids "${bastionInstanceId}" --region "${REGION}" --query 'Reservations[0].Instances[0].PlatformDetails' --output text 2>/dev/null`);
            
            if (platform !== 'ERROR') {
                printInfo(`Platform: ${platform}`);
            }
        }

        // Security Group
        printSubsection('Security Configuration');
        const bastionSg = getStackOutput(STACK_NAME, 'BastionSecurityGroupId', REGION);

        if (validateResource('Security Group', bastionSg, 'Security Group', 'Security Group not found')) {
            // Check SSH ingress rules
            const sshRules = executeAwsCommand(`aws ec2 describe-security-groups --group-ids "${bastionSg}" --region "${REGION}" --query 'SecurityGroups[0].IpPermissions[?FromPort==\`22\`].[IpRanges[].CidrIp, Ipv6Ranges[].CidrIpv6]' --output text 2>/dev/null`);
            
            if (sshRules !== 'NONE' && sshRules !== 'ERROR' && sshRules) {
                printInfo('SSH Access allowed from:');
                const cidrs = sshRules.split(/\s+/).filter(cidr => cidr && cidr !== 'None');
                cidrs.forEach(cidr => {
                    if (cidr) {
                        console.log(`  - ${cidr}`);
                    }
                });
            } else {
                printWarning('No SSH ingress rules found');
            }
        }

        // SSH Key
        printSubsection('SSH Access');
        const keyName = getStackOutput(STACK_NAME, 'KeyName', REGION);

        let keyExists = 'NOT_FOUND';
        validateResourceOptional('SSH Key', keyName, 'SSH Key Name', 'No SSH Key configured', 'false');
        
        if (keyName) {
            // Check if key exists
            keyExists = executeAwsCommand(`aws ec2 describe-key-pairs --key-names "${keyName}" --region "${REGION}" --query 'KeyPairs[0].KeyName' --output text 2>/dev/null`);
            
            if (keyExists === keyName) {
                printSuccess('SSH Key exists in AWS');
            } else {
                printError('SSH Key not found in AWS');
            }
        }

        // SSH Command
        const sshCommand = getStackOutput(STACK_NAME, 'SSHCommand', REGION);

        validateResourceOptional('SSH Command', sshCommand, 'SSH Command Available', 'SSH command not available', 'false');
        
        if (sshCommand) {
            printInfo('Connect to bastion with:');
            console.log(sshCommand);
        }

        // Session Manager
        printSubsection('Session Manager');
        const sessionManagerUrl = getStackOutput(STACK_NAME, 'SessionManagerUrl', REGION);

        let ssmStatus = 'ERROR';
        validateResourceOptional('Session Manager', sessionManagerUrl, 'Session Manager Available', 'Session Manager not configured', 'false');
        
        if (sessionManagerUrl) {
            printInfo('Connect via Session Manager:');
            console.log(sessionManagerUrl);
            
            // Check if SSM agent is running (requires instance to be running)
            if (instanceState === 'running') {
                ssmStatus = checkSsmAgentStatus(bastionInstanceId, REGION);
                
                if (ssmStatus === 'Online') {
                    printSuccess('SSM Agent: Online');
                } else {
                    printWarning(`SSM Agent Status: ${ssmStatus}`);
                }
            }
        }

        // Auto Scaling
        printSubsection('Auto Scaling Configuration');
        const asgName = getStackOutput(STACK_NAME, 'AutoScalingGroupName', REGION);

        validateResourceOptional('Auto Scaling Group', asgName, 'Auto Scaling Group', 'Auto Scaling not configured (using single instance)', 'false');
        
        if (asgName) {
            // Check ASG details
            const asgDetails = checkAsgDetails(asgName, REGION);
            
            if (asgDetails !== 'ERROR') {
                const asgArray = asgDetails.split(/\s+/);
                const asgDesired = asgArray[0] || '0';
                const asgMin = asgArray[1] || '0';
                const asgMax = asgArray[2] || '0';
                
                printInfo(`Auto Scaling: Desired=${asgDesired}, Min=${asgMin}, Max=${asgMax}`);
            }
        }

        // CloudWatch Monitoring
        printSubsection('Monitoring');
        const cwDashboard = getStackOutput(STACK_NAME, 'CloudWatchDashboard', REGION);

        validateResourceOptional('CloudWatch Dashboard', cwDashboard, 'CloudWatch Dashboard', 'CloudWatch Dashboard not configured', 'false');

        // IAM Role
        printSubsection('IAM Role');
        const instanceProfile = getStackOutput(STACK_NAME, 'InstanceProfileArn', REGION);

        validateResourceOptional('Instance Profile', instanceProfile, 'Instance Profile', 'Instance Profile not configured', 'false');
        
        if (instanceProfile) {
            // Extract profile name from ARN
            const profileName = instanceProfile.split('/').pop();
            
            // Check if profile exists
            const profileExists = executeAwsCommand(`aws iam get-instance-profile --instance-profile-name "${profileName}" --query 'InstanceProfile.InstanceProfileName' --output text 2>/dev/null`);
            
            if (profileExists === profileName) {
                printSuccess('Instance Profile exists');
                
                // Check attached roles
                const attachedRoles = executeAwsCommand(`aws iam get-instance-profile --instance-profile-name "${profileName}" --query 'InstanceProfile.Roles[].RoleName' --output text 2>/dev/null`);
                
                if (attachedRoles !== 'ERROR' && attachedRoles) {
                    printInfo(`Attached Roles: ${attachedRoles}`);
                }
            } else {
                printWarning('Instance Profile not found');
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

        // Instance checks
        if (bastionInstanceId && instanceState === 'running') {
            addCheckResult(true);
        } else if (bastionInstanceId) {
            addCheckResult(false);
        } else {
            addCheckResult(false);
        }

        // Security Group check
        if (bastionSg) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // SSH Key check
        if (keyName && keyExists === keyName) {
            addCheckResult(true);
        } else if (keyName) {
            addCheckResult(false);
        } else {
            // No key is OK if using Session Manager
            if (sessionManagerUrl) {
                addCheckResult(true);
            } else {
                addCheckResult(false);
            }
        }

        // Connectivity check (SSH or Session Manager)
        if (sshCommand || ssmStatus === 'Online') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (printSummary('Bastion Host')) {
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