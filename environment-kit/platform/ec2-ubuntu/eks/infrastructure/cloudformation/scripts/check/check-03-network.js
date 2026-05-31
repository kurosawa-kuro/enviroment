#!/usr/bin/env node

// =============================================================================
// Network Stack Check Script
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

function checkVpcStatus(vpcId, region) {
    const command = `aws ec2 describe-vpcs --vpc-ids "${vpcId}" --region "${region}" --query "Vpcs[0].State" --output text 2>/dev/null || echo "ERROR"`;
    return executeAwsCommand(command);
}

function checkSubnetDetailed(subnetId, subnetName, region) {
    if (subnetId && subnetId !== '' && subnetId !== 'ERROR') {
        printSuccess(`${subnetName}: ${subnetId}`);
        
        // Check subnet state
        const subnetState = executeAwsCommand(`aws ec2 describe-subnets --subnet-ids "${subnetId}" --region "${region}" --query "Subnets[0].State" --output text 2>/dev/null`);
        
        if (subnetState === 'available') {
            printSuccess(`${subnetName} State: Available`);
        } else {
            printWarning(`${subnetName} State: ${subnetState}`);
        }
        
        // Check availability zone
        const az = executeAwsCommand(`aws ec2 describe-subnets --subnet-ids "${subnetId}" --region "${region}" --query "Subnets[0].AvailabilityZone" --output text 2>/dev/null`);
        
        if (az !== 'ERROR') {
            printInfo(`${subnetName} AZ: ${az}`);
        }
        
        // Check CIDR
        const cidr = executeAwsCommand(`aws ec2 describe-subnets --subnet-ids "${subnetId}" --region "${region}" --query "Subnets[0].CidrBlock" --output text 2>/dev/null`);
        
        if (cidr !== 'ERROR') {
            printInfo(`${subnetName} CIDR: ${cidr}`);
        }
        
        return true;
    } else {
        printError(`${subnetName} not found`);
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
        const STACK_NAME = getStackName('network');

        printHeader('Network Stack Check');
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

        // VPC
        printSubsection('VPC Configuration');
        const vpcId = getStackOutput(STACK_NAME, 'VpcId', REGION);
        const vpcCidr = getStackOutput(STACK_NAME, 'VpcCidr', REGION);

        let vpcState = 'ERROR';
        if (validateResource('VPC', vpcId, 'VPC ID', 'VPC not found')) {
            printSuccess(`VPC CIDR: ${vpcCidr}`);
            
            // Check VPC state
            vpcState = checkVpcStatus(vpcId, REGION);
            
            validateStatus('VPC', vpcState, 'available', 'VPC State: Available', 'VPC State');
            
            // Check DNS settings
            const dnsSupport = executeAwsCommand(`aws ec2 describe-vpc-attribute --vpc-id "${vpcId}" --attribute enableDnsSupport --region "${REGION}" --query 'EnableDnsSupport.Value' --output text 2>/dev/null`);
            
            const dnsHostnames = executeAwsCommand(`aws ec2 describe-vpc-attribute --vpc-id "${vpcId}" --attribute enableDnsHostnames --region "${REGION}" --query 'EnableDnsHostnames.Value' --output text 2>/dev/null`);
            
            printInfo(`DNS Support: ${dnsSupport || 'false'}`);
            printInfo(`DNS Hostnames: ${dnsHostnames || 'false'}`);
        }

        // Public Subnets
        printSubsection('Public Subnets');
        const publicSubnet1 = getStackOutput(STACK_NAME, 'PublicSubnet1Id', REGION);
        const publicSubnet2 = getStackOutput(STACK_NAME, 'PublicSubnet2Id', REGION);

        checkSubnetDetailed(publicSubnet1, 'Public Subnet 1', REGION);
        checkSubnetDetailed(publicSubnet2, 'Public Subnet 2', REGION);

        // Private Subnets
        printSubsection('Private Subnets');
        const privateSubnet1 = getStackOutput(STACK_NAME, 'PrivateSubnet1Id', REGION);
        const privateSubnet2 = getStackOutput(STACK_NAME, 'PrivateSubnet2Id', REGION);

        checkSubnetDetailed(privateSubnet1, 'Private Subnet 1', REGION);
        checkSubnetDetailed(privateSubnet2, 'Private Subnet 2', REGION);

        // Internet Gateway
        printSubsection('Internet Gateway');
        let igwId = '';
        let igwAttached = 'NOT_ATTACHED';
        
        if (vpcId) {
            igwId = executeAwsCommand(`aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=${vpcId}" --region "${REGION}" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null`);
            
            if (igwId && igwId !== 'None' && igwId !== 'ERROR') {
                printSuccess(`Internet Gateway: ${igwId}`);
                
                // Check attachment
                igwAttached = executeAwsCommand(`aws ec2 describe-internet-gateways --internet-gateway-ids "${igwId}" --region "${REGION}" --query 'InternetGateways[0].Attachments[0].State' --output text 2>/dev/null`);
                
                validateStatus('Internet Gateway', igwAttached, 'available', 'Internet Gateway attached to VPC', 'Internet Gateway attachment state');
            } else {
                printWarning('Internet Gateway not found for VPC');
            }
        } else {
            printWarning('Cannot check Internet Gateway without VPC ID');
        }

        // NAT Gateways
        printSubsection('NAT Gateways');
        const natGatewayStatus = getStackOutput(STACK_NAME, 'NatGatewayStatus', REGION);

        if (natGatewayStatus === 'Created') {
            // NAT Gateway was created, find it by VPC and subnet
            if (publicSubnet1) {
                const natGatewayId = executeAwsCommand(`aws ec2 describe-nat-gateways --filter "Name=subnet-id,Values=${publicSubnet1}" "Name=state,Values=available" --region "${REGION}" --query 'NatGateways[0].NatGatewayId' --output text 2>/dev/null`);
                
                if (natGatewayId && natGatewayId !== 'None' && natGatewayId !== 'ERROR') {
                    printSuccess(`NAT Gateway: ${natGatewayId} (available)`);
                } else {
                    printWarning('NAT Gateway reported as created but not found');
                }
            }
        } else {
            printInfo(`NAT Gateway Status: ${natGatewayStatus || 'Not Created'}`);
        }

        // Security Groups
        printSubsection('Security Groups');
        const eksClusterSg = getStackOutput(STACK_NAME, 'EKSClusterSecurityGroupId', REGION);
        const bastionSg = getStackOutput(STACK_NAME, 'BastionSecurityGroupId', REGION);

        validateResource('EKS Cluster Security Group', eksClusterSg, 'Security Group ID', 'Security Group not found');
        validateResource('Bastion Security Group', bastionSg, 'Security Group ID', 'Security Group not found');

        // Route Tables
        printSubsection('Route Tables');
        let routeTables = '';
        
        if (vpcId) {
            routeTables = executeAwsCommand(`aws ec2 describe-route-tables --filters "Name=vpc-id,Values=${vpcId}" --region "${REGION}" --query 'RouteTables[*].RouteTableId' --output text 2>/dev/null`);
            
            if (routeTables) {
                const routeTableCount = routeTables.split(/\s+/).length;
                printSuccess(`Route Tables found: ${routeTableCount} route tables in VPC`);
            } else {
                printWarning('No route tables found in VPC');
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

        // VPC checks
        if (vpcId && vpcState === 'available') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Subnet checks
        if (publicSubnet1 && publicSubnet2 && privateSubnet1 && privateSubnet2) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Internet Gateway check
        if (igwId && igwAttached === 'available') {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // NAT Gateway check (optional - not required for basic setup)
        if (natGatewayStatus) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Security Group checks
        if (eksClusterSg && bastionSg) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        // Route Tables check
        if (routeTables) {
            addCheckResult(true);
        } else {
            addCheckResult(false);
        }

        if (printSummary('Network')) {
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