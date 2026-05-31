#!/usr/bin/env node

// =============================================================================
// AWS Resources Cleanup Verification Script
// This script verifies that the cleanup-resources.sh script completed successfully
// by checking for remaining resources that should have been cleaned up
// =============================================================================

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SCRIPT_DIR = __dirname;
const CONFIG_FILE = path.join(path.dirname(SCRIPT_DIR), 'config.yaml');

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
function printSubsection(message) {
    console.log(`${colors.CYAN}----------------------------------------${colors.NC}`);
    console.log(`${colors.CYAN}${message}${colors.NC}`);
    console.log(`${colors.CYAN}----------------------------------------${colors.NC}`);
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

function getConfigValue(key, defaultValue) {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const value = executeAwsCommand(`yq eval '${key}' "${CONFIG_FILE}" 2>/dev/null`);
            return value !== 'ERROR' && value ? value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }
    return defaultValue;
}

// Check counters
let totalChecks = 0;
let passedChecks = 0;

function initCheckCounters() {
    totalChecks = 0;
    passedChecks = 0;
}

function printCleanupSummary(total, passed, projectName) {
    console.log(`\n${colors.BOLD}${colors.PURPLE}=== Cleanup Verification Summary ===${colors.NC}`);
    console.log(`Project: ${projectName}`);
    console.log(`Total Checks: ${total}`);
    console.log(`Passed: ${colors.GREEN}${passed}${colors.NC}`);
    console.log(`Failed: ${colors.RED}${total - passed}${colors.NC}`);
    
    if (passed === total) {
        printSuccess('All cleanup verification checks passed');
        return true;
    } else {
        printError('Some resources still remain - cleanup may be incomplete');
        return false;
    }
}

// Check functions
function checkS3Buckets(projectName, region) {
    printSubsection('Checking S3 Buckets');
    
    totalChecks++;
    
    printInfo('Searching for remaining S3 buckets...');
    const buckets = executeAwsCommand(`aws s3api list-buckets --query "Buckets[?contains(Name, '${projectName}')].Name" --output text 2>/dev/null`);
    
    if (!buckets || buckets === 'ERROR') {
        printSuccess(`No S3 buckets found containing '${projectName}'`);
        passedChecks++;
    } else {
        const bucketArray = buckets.split(/\s+/).filter(b => b);
        printError(`Found ${bucketArray.length} remaining S3 buckets:`);
        bucketArray.forEach(bucket => {
            console.log(`  - ${bucket}`);
        });
    }
    console.log('');
}

function checkEcrRepositories(projectName, region) {
    printSubsection('Checking ECR Repositories');
    
    totalChecks++;
    
    printInfo(`Checking for specific ECR repository: ${projectName}-eks-app`);
    const repositories = executeAwsCommand(`aws ecr describe-repositories --repository-names ${projectName}-eks-app --region "${region}" --query "repositories[].repositoryName" --output text 2>/dev/null`);
    
    if (!repositories || repositories === 'ERROR') {
        printSuccess(`ECR repository '${projectName}-eks-app' not found (cleanup successful)`);
        passedChecks++;
    } else {
        const repoArray = repositories.split(/\s+/).filter(r => r);
        printError(`Found ${repoArray.length} remaining ECR repositories:`);
        repoArray.forEach(repo => {
            console.log(`  - ${repo}`);
        });
    }
    console.log('');
}

function checkLogGroups(projectName, region) {
    printSubsection('Checking CloudWatch Log Groups');
    
    totalChecks++;
    
    printInfo('Searching for remaining CloudWatch Log Groups...');
    
    // Common log group patterns for EKS and related services
    const patterns = [
        `/aws/eks/${projectName}`,
        `/aws/lambda/${projectName}`,
        `/aws/codebuild/${projectName}`,
        `/aws/ecs/${projectName}`,
        `/aws/vpc/flowlogs/${projectName}`
    ];
    
    let remainingLogGroups = [];
    
    for (const pattern of patterns) {
        const logGroups = executeAwsCommand(`aws logs describe-log-groups --log-group-name-prefix "${pattern}" --region "${region}" --query 'logGroups[].logGroupName' --output text 2>/dev/null`);
        
        if (logGroups && logGroups !== 'ERROR') {
            const logGroupArray = logGroups.split(/\s+/).filter(lg => lg);
            remainingLogGroups = remainingLogGroups.concat(logGroupArray);
        }
    }
    
    if (remainingLogGroups.length === 0) {
        printSuccess('No CloudWatch Log Groups found for project patterns');
        passedChecks++;
    } else {
        printError(`Found ${remainingLogGroups.length} remaining CloudWatch Log Groups:`);
        remainingLogGroups.forEach(logGroup => {
            console.log(`  - ${logGroup}`);
        });
    }
    console.log('');
}

function checkEbsVolumes(projectName, region) {
    printSubsection('Checking EBS Volumes');
    
    totalChecks++;
    
    printInfo('Searching for remaining unattached EBS volumes...');
    const volumes = executeAwsCommand(`aws ec2 describe-volumes --filters "Name=status,Values=available" --region "${region}" --query "Volumes[?Tags[?Key=='Project' && contains(Value, '${projectName}')]].VolumeId" --output text 2>/dev/null`);
    
    if (!volumes || volumes === 'ERROR') {
        printSuccess(`No unattached EBS volumes found for project '${projectName}'`);
        passedChecks++;
    } else {
        const volumeArray = volumes.split(/\s+/).filter(v => v);
        printError(`Found ${volumeArray.length} remaining unattached EBS volumes:`);
        volumeArray.forEach(volume => {
            console.log(`  - ${volume}`);
        });
    }
    console.log('');
}

function checkElasticIps(projectName, region) {
    printSubsection('Checking Elastic IPs');
    
    totalChecks++;
    
    printInfo('Searching for remaining Elastic IPs...');
    
    // Find EIPs by project tag
    const taggedEips = executeAwsCommand(`aws ec2 describe-addresses --region "${region}" --query "Addresses[?Tags[?Key=='Project' && contains(Value, '${projectName}')]].AllocationId" --output text 2>/dev/null`);
    
    // Find EIPs by name tag pattern (like NAT Gateway EIPs)
    const namePatternEips = executeAwsCommand(`aws ec2 describe-addresses --region "${region}" --query "Addresses[?Tags[?Key=='Name' && contains(Value, '${projectName}')]].AllocationId" --output text 2>/dev/null`);
    
    // Combine and deduplicate
    let allEips = `${taggedEips} ${namePatternEips}`.split(/\s+/).filter(eip => eip && eip !== 'ERROR');
    allEips = [...new Set(allEips)]; // Remove duplicates
    
    if (allEips.length === 0) {
        printSuccess(`No Elastic IPs found for project '${projectName}'`);
        passedChecks++;
    } else {
        printError(`Found ${allEips.length} remaining Elastic IPs:`);
        allEips.forEach(eip => {
            // Check association status for additional info
            const associationId = executeAwsCommand(`aws ec2 describe-addresses --allocation-ids "${eip}" --region "${region}" --query "Addresses[0].AssociationId" --output text 2>/dev/null`);
            
            if (associationId && associationId !== 'None' && associationId !== 'null' && associationId !== 'ERROR') {
                console.log(`  - ${eip} (associated: ${associationId})`);
            } else {
                console.log(`  - ${eip} (unassociated)`);
            }
        });
    }
    console.log('');
}

function checkNetworkInterfaces(projectName, region) {
    printSubsection('Checking Network Interfaces');
    
    totalChecks++;
    
    printInfo('Searching for remaining detached network interfaces...');
    const interfaces = executeAwsCommand(`aws ec2 describe-network-interfaces --filters "Name=status,Values=available" --region "${region}" --query "NetworkInterfaces[?TagSet[?Key=='Project' && contains(Value, '${projectName}')]].NetworkInterfaceId" --output text 2>/dev/null`);
    
    if (!interfaces || interfaces === 'ERROR') {
        printSuccess(`No detached network interfaces found for project '${projectName}'`);
        passedChecks++;
    } else {
        const interfaceArray = interfaces.split(/\s+/).filter(i => i);
        printError(`Found ${interfaceArray.length} remaining detached network interfaces:`);
        interfaceArray.forEach(intf => {
            console.log(`  - ${intf}`);
        });
    }
    console.log('');
}

function checkSsmParameters(projectName, region) {
    printSubsection('Checking SSM Parameters');
    
    totalChecks++;
    
    printInfo('Searching for remaining SSM parameters...');
    
    // Search for parameters with project path pattern
    const parameters = executeAwsCommand(`aws ssm describe-parameters --region "${region}" --query "Parameters[?starts_with(Name, '/eks/${projectName}')].Name" --output text 2>/dev/null`);
    
    if (!parameters || parameters === 'ERROR') {
        printSuccess(`No SSM parameters found for project '${projectName}'`);
        passedChecks++;
    } else {
        const paramArray = parameters.split(/\s+/).filter(p => p);
        printError(`Found ${paramArray.length} remaining SSM parameters:`);
        paramArray.forEach(param => {
            console.log(`  - ${param}`);
        });
    }
    console.log('');
}

function checkSecurityGroups(projectName, region) {
    printSubsection('Checking Security Groups');
    
    totalChecks++;
    
    printInfo('Searching for remaining project security groups...');
    
    // Find security groups by project tag and name pattern
    const securityGroups = executeAwsCommand(`aws ec2 describe-security-groups --region "${region}" --filters "Name=tag:Project,Values=${projectName}" --query "SecurityGroups[].GroupId" --output text 2>/dev/null`);
    
    // Also search by name pattern
    const namePatternSgs = executeAwsCommand(`aws ec2 describe-security-groups --region "${region}" --filters "Name=group-name,Values=*${projectName}*" --query "SecurityGroups[].GroupId" --output text 2>/dev/null`);
    
    // Combine and deduplicate
    let allSgs = `${securityGroups} ${namePatternSgs}`.split(/\s+/).filter(sg => sg && sg !== 'ERROR');
    allSgs = [...new Set(allSgs)]; // Remove duplicates
    
    // Filter out default security groups
    const remainingSgs = allSgs.filter(sg => {
        const sgName = executeAwsCommand(`aws ec2 describe-security-groups --group-ids "${sg}" --region "${region}" --query "SecurityGroups[0].GroupName" --output text 2>/dev/null`);
        return sgName !== 'default';
    });
    
    if (remainingSgs.length === 0) {
        printSuccess('No project security groups found (excluding defaults)');
        passedChecks++;
    } else {
        printError(`Found ${remainingSgs.length} remaining security groups:`);
        remainingSgs.forEach(sg => {
            console.log(`  - ${sg}`);
        });
    }
    console.log('');
}

function checkLaunchTemplates(projectName, region) {
    printSubsection('Checking Launch Templates');
    
    totalChecks++;
    
    printInfo('Searching for remaining launch templates...');
    
    // Find launch templates by name pattern
    const templates = executeAwsCommand(`aws ec2 describe-launch-templates --region "${region}" --query "LaunchTemplates[?contains(LaunchTemplateName, '${projectName}')].LaunchTemplateId" --output text 2>/dev/null`);
    
    if (!templates || templates === 'ERROR') {
        printSuccess(`No launch templates found for project '${projectName}'`);
        passedChecks++;
    } else {
        const templateArray = templates.split(/\s+/).filter(t => t);
        printError(`Found ${templateArray.length} remaining launch templates:`);
        templateArray.forEach(template => {
            console.log(`  - ${template}`);
        });
    }
    console.log('');
}

function checkIamResources(projectName, region) {
    printSubsection('Checking IAM Roles and Instance Profiles');
    
    totalChecks++;
    
    printInfo('Searching for remaining IAM roles and instance profiles...');
    
    // Find roles by name pattern
    const roles = executeAwsCommand(`aws iam list-roles --query "Roles[?contains(RoleName, '${projectName}')].RoleName" --output text 2>/dev/null`);
    
    // Find instance profiles by name pattern
    const instanceProfiles = executeAwsCommand(`aws iam list-instance-profiles --query "InstanceProfiles[?contains(InstanceProfileName, '${projectName}')].InstanceProfileName" --output text 2>/dev/null`);
    
    const remainingResources = [];
    
    if (roles && roles !== 'ERROR') {
        const roleArray = roles.split(/\s+/).filter(r => r);
        roleArray.forEach(role => {
            remainingResources.push(`Role: ${role}`);
        });
    }
    
    if (instanceProfiles && instanceProfiles !== 'ERROR') {
        const ipArray = instanceProfiles.split(/\s+/).filter(ip => ip);
        ipArray.forEach(ip => {
            remainingResources.push(`Instance Profile: ${ip}`);
        });
    }
    
    if (remainingResources.length === 0) {
        printSuccess(`No IAM roles or instance profiles found for project '${projectName}'`);
        passedChecks++;
    } else {
        printError(`Found ${remainingResources.length} remaining IAM resources:`);
        remainingResources.forEach(resource => {
            console.log(`  - ${resource}`);
        });
    }
    console.log('');
}

function checkNatGateways(projectName, region) {
    printSubsection('Checking NAT Gateways');
    
    totalChecks++;
    
    printInfo('Searching for remaining NAT Gateways...');
    
    // Find NAT Gateways by tag (excluding deleted state)
    const natGws = executeAwsCommand(`aws ec2 describe-nat-gateways --region "${region}" --filter "Name=tag:Project,Values=${projectName}" "Name=state,Values=available,pending,deleting,failed" --query "NatGateways[].NatGatewayId" --output text 2>/dev/null`);
    
    if (!natGws || natGws === 'ERROR') {
        printSuccess(`No NAT Gateways found for project '${projectName}'`);
        passedChecks++;
    } else {
        const natArray = natGws.split(/\s+/).filter(nat => nat);
        printError(`Found ${natArray.length} remaining NAT Gateways:`);
        natArray.forEach(natGw => {
            // Get NAT Gateway state
            const natState = executeAwsCommand(`aws ec2 describe-nat-gateways --nat-gateway-ids "${natGw}" --region "${region}" --query "NatGateways[0].State" --output text 2>/dev/null`);
            console.log(`  - ${natGw} (${natState || 'unknown'})`);
        });
    }
    console.log('');
}

async function main() {
    try {
        // Configuration from config.yaml or defaults
        const projectName = process.argv[2] || getConfigValue('.basic.ProjectName', 'eks-platform');
        const awsRegion = process.env.AwsRegion || getConfigValue('.basic.AwsRegion', 'ap-northeast-1');
        const environment = process.env.Environment || getConfigValue('.basic.Environment', 'learning');

        console.log('=========================================');
        console.log('AWS Resources Cleanup Verification');
        console.log(`Project: ${projectName}`);
        console.log(`Environment: ${environment}`);
        console.log(`Region: ${awsRegion}`);
        console.log('=========================================');
        console.log('');

        // Track overall status
        initCheckCounters();

        printInfo('Starting cleanup verification...');
        console.log('');

        // Execute all checks in logical order
        checkSsmParameters(projectName, awsRegion);
        checkLaunchTemplates(projectName, awsRegion);
        checkIamResources(projectName, awsRegion);
        checkNatGateways(projectName, awsRegion);
        checkS3Buckets(projectName, awsRegion);
        checkEcrRepositories(projectName, awsRegion);
        checkLogGroups(projectName, awsRegion);
        checkEbsVolumes(projectName, awsRegion);
        checkElasticIps(projectName, awsRegion);
        checkNetworkInterfaces(projectName, awsRegion);
        checkSecurityGroups(projectName, awsRegion);

        // Final summary
        if (printCleanupSummary(totalChecks, passedChecks, projectName)) {
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