#!/usr/bin/env node

// =============================================================================
// AWS Resources Check Common Functions
// =============================================================================
// このファイルはAWSリソースチェック機能の共通関数を提供します
// =============================================================================

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createHash } = require('crypto');

// Default Configuration
const DEFAULT_REGION = process.env.AwsRegion || 'ap-northeast-1';

// Import color functions
const { logInfo, logError, logWarn, logSuccess, printSuccess, printError } = require('./display-colors.js');

// Utility functions
function executeAwsCommand(command) {
    try {
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
        return result || '';
    } catch (error) {
        return 'ERROR';
    }
}

// Get project name from config.yaml
function getProjectName() {
    const configFile = path.join(__dirname, '../../config.yaml');
    if (fs.existsSync(configFile)) {
        const result = executeAwsCommand(`yq eval ".basic.ProjectName // \\"eks-platform\\"" "${configFile}" 2>/dev/null`);
        return result !== 'ERROR' ? result : 'eks-platform';
    }
    return 'eks-platform';
}

const DEFAULT_PROJECT = process.env.ProjectName || getProjectName();

// S3にブートストラップファイルをアップロード（冪等性保証）
async function uploadBootstrapFilesToS3() {
    const ProjectName = getProjectName();
    const version = 'v2';
    const region = DEFAULT_REGION;
    
    // S3バケット名を取得（CloudFormationスタックアウトプットから）
    const stackName = `${ProjectName}-prerequisites-${version}`;
    logInfo(`スタック名: ${stackName}`);
    
    const bucketName = getStackOutput(stackName, 'BucketName', region);
    
    if (!bucketName) {
        logError('S3バケット名をCloudFormationスタックアウトプットから取得できませんでした');
        return false;
    }
    
    logInfo(`S3バケット名: ${bucketName}`);
    
    // アップロードするファイルの定義
    const scriptDir = path.join(process.env.WORK_DIR || '.', 'scripts');
    const filesToUpload = [
        `${scriptDir}/iam_policy.json:scripts/iam_policy.json`,
        `${scriptDir}/bastion-user-data.sh:scripts/user-data.sh`
    ];
    
    // 各ファイルを冪等性を保ってアップロード
    for (const fileMapping of filesToUpload) {
        const [srcFile, destPath] = fileMapping.split(':');
        
        if (fs.existsSync(srcFile)) {
            // ファイルが変更されているかチェック（ETAGベース）
            let needsUpload = true;
            
            // ローカルファイルのMD5を計算
            const localMd5 = createHash('md5').update(fs.readFileSync(srcFile)).digest('hex');
            
            // リモートファイルのETAGを取得（存在する場合）
            const remoteEtag = executeAwsCommand(
                `aws s3api head-object --bucket "${bucketName}" --key "${destPath}" --region "${region}" --query 'ETag' --output text 2>/dev/null`
            ).replace(/"/g, '');
            
            // ETAGとMD5が一致する場合はスキップ
            if (remoteEtag === localMd5) {
                logInfo(`ファイル ${destPath} は最新です（スキップ）`);
                needsUpload = false;
            }
            
            // アップロードが必要な場合のみ実行
            if (needsUpload) {
                logInfo(`アップロード中: ${srcFile} → s3://${bucketName}/${destPath}`);
                
                const uploadResult = executeAwsCommand(
                    `aws s3 cp "${srcFile}" "s3://${bucketName}/${destPath}" --region "${region}" --quiet`
                );
                
                if (uploadResult !== 'ERROR') {
                    logSuccess(`アップロード完了: ${destPath}`);
                } else {
                    logError(`アップロード失敗: ${destPath}`);
                    return false;
                }
            }
        } else {
            logWarn(`ファイルが見つかりません: ${srcFile}`);
        }
    }
    
    logSuccess('全てのブートストラップファイルのS3アップロードが完了しました');
    return true;
}

// =============================================================================
// CloudFormation Functions
// =============================================================================

// Check if CloudFormation stack exists and get its status
function checkStackStatus(stackName, region = DEFAULT_REGION) {
    const command = `aws cloudformation describe-stacks --stack-name "${stackName}" --region "${region}" --query 'Stacks[0].StackStatus' --output text 2>/dev/null`;
    const result = executeAwsCommand(command);
    return result !== 'ERROR' ? result : 'NOT_FOUND';
}

// Validate stack status is complete
function validateStackStatus(stackStatus, stackName) {
    if (stackStatus === 'NOT_FOUND') {
        printError(`Stack ${stackName} not found`);
        return false;
    }
    
    printSuccess(`Stack Status: ${stackStatus}`);
    
    if (stackStatus !== 'CREATE_COMPLETE' && stackStatus !== 'UPDATE_COMPLETE') {
        printError('Stack not in complete state');
        return false;
    }
    
    return true;
}

// Get CloudFormation stack output value
function getStackOutput(stackName, outputKey, region = DEFAULT_REGION) {
    const command = `aws cloudformation describe-stacks --stack-name "${stackName}" --region "${region}" --query "Stacks[0].Outputs[?OutputKey==\`${outputKey}\`].OutputValue" --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Get stack name by type from config.yaml
function getStackName(stackType) {
    const configFile = path.join(__dirname, '../../config.yaml');
    
    // Check if config file exists
    if (!fs.existsSync(configFile)) {
        return '';
    }
    
    // Convert stack type to proper case for config.yaml
    let stackTypeKey = stackType;
    switch (stackType) {
        case 'prerequisites': stackTypeKey = 'Prerequisites'; break;
        case 'iam-role':
        case 'iam_role': stackTypeKey = 'IamRole'; break;
        case 'network': stackTypeKey = 'Network'; break;
        case 'alb': stackTypeKey = 'ALB'; break;
        case 'platform':
        case 'eks': stackTypeKey = 'Platform'; break;
        case 'bastion': stackTypeKey = 'Bastion'; break;
    }
    
    // Read from config.yaml using yq
    const stackName = executeAwsCommand(`yq eval ".Stacks.${stackTypeKey}" "${configFile}" 2>/dev/null`);
    
    if (stackName === 'null' || !stackName || stackName === 'ERROR') {
        return '';
    }
    
    // Expand variables in stack name
    const projectName = executeAwsCommand(`yq eval ".basic.ProjectName" "${configFile}" 2>/dev/null`);
    const version = executeAwsCommand(`yq eval ".basic.Version" "${configFile}" 2>/dev/null`);
    
    // Replace template variables
    return stackName
        .replace(/\${basic\.ProjectName}/g, projectName)
        .replace(/\${basic\.Version}/g, version);
}

// =============================================================================
// EC2 Functions
// =============================================================================

// Check EC2 instance status
function checkEc2Instance(instanceId, region = DEFAULT_REGION) {
    if (!instanceId) return 'ERROR';
    
    const command = `aws ec2 describe-instances --instance-ids "${instanceId}" --region "${region}" --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check security group accessibility
function checkSecurityGroup(sgId, region = DEFAULT_REGION) {
    if (!sgId) return 'ERROR';
    
    const command = `aws ec2 describe-security-groups --group-ids "${sgId}" --region "${region}" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check VPC status
function checkVpcStatus(vpcId, region = DEFAULT_REGION) {
    if (!vpcId) return 'ERROR';
    
    const command = `aws ec2 describe-vpcs --vpc-ids "${vpcId}" --region "${region}" --query 'Vpcs[0].State' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check subnet status
function checkSubnetStatus(subnetId, region = DEFAULT_REGION) {
    if (!subnetId) return 'ERROR';
    
    const command = `aws ec2 describe-subnets --subnet-ids "${subnetId}" --region "${region}" --query 'Subnets[0].State' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Get subnet availability zone
function getSubnetAz(subnetId, region = DEFAULT_REGION) {
    if (!subnetId) return 'ERROR';
    
    const command = `aws ec2 describe-subnets --subnet-ids "${subnetId}" --region "${region}" --query 'Subnets[0].AvailabilityZone' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check subnet with detailed info
function checkSubnetDetailed(subnetId, subnetName, region = DEFAULT_REGION) {
    if (subnetId) {
        printSuccess(`${subnetName}: ${subnetId}`);
        
        const subnetState = checkSubnetStatus(subnetId, region);
        const subnetAz = getSubnetAz(subnetId, region);
        
        if (subnetState === 'available') {
            printSuccess(`${subnetName} State: ${subnetState} (${subnetAz})`);
            return true;
        } else {
            printError(`${subnetName} State: ${subnetState}`);
            return false;
        }
    } else {
        printError(`${subnetName} not found`);
        return false;
    }
}

// =============================================================================
// S3 Functions
// =============================================================================

// Check S3 bucket accessibility
function checkS3BucketAccess(bucketName, region = DEFAULT_REGION) {
    if (!bucketName) return false;
    
    const command = `aws s3 ls "s3://${bucketName}" --region "${region}"`;
    const result = executeAwsCommand(command);
    return result !== 'ERROR';
}

// Check for remaining S3 buckets
function checkRemainingS3Buckets(ProjectName, region = DEFAULT_REGION) {
    const command = `aws s3api list-buckets --query "Buckets[?contains(Name, '${ProjectName}')].Name" --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// KMS Functions
// =============================================================================

// Check KMS key status
function checkKmsKeyStatus(keyId, region = DEFAULT_REGION) {
    if (!keyId) return 'ERROR';
    
    const command = `aws kms describe-key --key-id "${keyId}" --region "${region}" --query 'KeyMetadata.KeyState' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// ECR Functions
// =============================================================================

// Check ECR repository
function checkEcrRepository(repoName, region = DEFAULT_REGION) {
    if (!repoName) return 'ERROR';
    
    const command = `aws ecr describe-repositories --repository-names "${repoName}" --region "${region}" --query 'repositories[0].repositoryName' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check for remaining ECR repositories
function checkRemainingEcrRepositories(ProjectName, region = DEFAULT_REGION) {
    const command = `aws ecr describe-repositories --region "${region}" --query "repositories[?contains(repositoryName, '${ProjectName}')].repositoryName" --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// EKS Functions
// =============================================================================

// Check EKS cluster status
function checkEksClusterStatus(clusterName, region = DEFAULT_REGION) {
    if (!clusterName) return 'ERROR';
    
    const command = `aws eks describe-cluster --name "${clusterName}" --region "${region}" --query 'cluster.status' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check EKS nodegroup status
function checkEksNodegroupStatus(clusterName, nodegroupName, region = DEFAULT_REGION) {
    if (!clusterName || !nodegroupName) return 'ERROR';
    
    const command = `aws eks describe-nodegroup --cluster-name "${clusterName}" --nodegroup-name "${nodegroupName}" --region "${region}" --query 'nodegroup.status' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// ALB/ELB Functions
// =============================================================================

// Check ALB/ELB status
function checkAlbStatus(albArn, region = DEFAULT_REGION) {
    if (!albArn) return 'ERROR';
    
    const command = `aws elbv2 describe-load-balancers --load-balancer-arns "${albArn}" --region "${region}" --query 'LoadBalancers[0].State.Code' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check target group health
function checkTargetGroup(tgArn, region = DEFAULT_REGION) {
    if (!tgArn) return 'ERROR';
    
    const command = `aws elbv2 describe-target-groups --target-group-arns "${tgArn}" --region "${region}" --query 'TargetGroups[0].HealthCheckProtocol' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// IAM Functions
// =============================================================================

// Check IAM role by ARN
function checkIamRoleByArn(roleArn, region = DEFAULT_REGION) {
    if (!roleArn) return 'ERROR';
    
    const roleName = roleArn.split('/').pop();
    const command = `aws iam get-role --role-name "${roleName}" --region "${region}" --query 'Role.RoleName' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check OIDC provider
function checkOidcProvider(oidcArn) {
    if (!oidcArn) return 'ERROR';
    
    const command = `aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${oidcArn}" --query 'Url' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// SSM Functions
// =============================================================================

// Check SSM parameter
function checkSsmParameter(paramName, region = DEFAULT_REGION) {
    const command = `aws ssm get-parameter --name "${paramName}" --region "${region}" --query 'Parameter.Value' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check SSM Agent connectivity
function checkSsmAgentStatus(instanceId, region = DEFAULT_REGION) {
    if (!instanceId) return 'ERROR';
    
    const command = `aws ssm describe-instance-information --instance-information-filter-list key=InstanceIds,valueSet="${instanceId}" --region "${region}" --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// Auto Scaling Functions
// =============================================================================

// Check Auto Scaling Group
function checkAsgDetails(asgName, region = DEFAULT_REGION) {
    if (!asgName) return 'ERROR';
    
    const command = `aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "${asgName}" --region "${region}" --query 'AutoScalingGroups[0].[DesiredCapacity,MinSize,MaxSize]' --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// =============================================================================
// Resource Cleanup Check Functions
// =============================================================================

// Check for remaining log groups
function checkRemainingLogGroups(ProjectName, region = DEFAULT_REGION) {
    const patterns = [
        `/aws/eks/${ProjectName}`,
        `/aws/lambda/${ProjectName}`,
        `/aws/codebuild/${ProjectName}`,
        `/aws/ecs/${ProjectName}`,
        `/aws/vpc/flowlogs/${ProjectName}`
    ];
    
    const remainingLogGroups = [];
    
    for (const pattern of patterns) {
        const command = `aws logs describe-log-groups --log-group-name-prefix "${pattern}" --region "${region}" --query 'logGroups[].logGroupName' --output text 2>/dev/null`;
        const logGroups = executeAwsCommand(command);
        
        if (logGroups && logGroups !== 'ERROR') {
            const logGroupArray = logGroups.split(/\s+/).filter(lg => lg);
            remainingLogGroups.push(...logGroupArray);
        }
    }
    
    return remainingLogGroups;
}

// Check for remaining EBS volumes
function checkRemainingEbsVolumes(ProjectName, region = DEFAULT_REGION) {
    const command = `aws ec2 describe-volumes --filters "Name=status,Values=available" --region "${region}" --query "Volumes[?Tags[?Key=='Project' && contains(Value, '${ProjectName}')]].VolumeId" --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check for remaining Elastic IPs
function checkRemainingElasticIps(ProjectName, region = DEFAULT_REGION) {
    const command = `aws ec2 describe-addresses --region "${region}" --query "Addresses[?AssociationId==null && Tags[?Key=='Project' && contains(Value, '${ProjectName}')]].AllocationId" --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check for remaining network interfaces
function checkRemainingNetworkInterfaces(ProjectName, region = DEFAULT_REGION) {
    const command = `aws ec2 describe-network-interfaces --filters "Name=status,Values=available" --region "${region}" --query "NetworkInterfaces[?TagSet[?Key=='Project' && contains(Value, '${ProjectName}')]].NetworkInterfaceId" --output text 2>/dev/null`;
    return executeAwsCommand(command);
}

// Check for remaining KMS keys
function checkRemainingKmsKeys(ProjectName, region = DEFAULT_REGION) {
    const keyIdsCommand = `aws kms list-keys --region "${region}" --query 'Keys[].KeyId' --output text 2>/dev/null`;
    const keyIds = executeAwsCommand(keyIdsCommand);
    
    if (!keyIds || keyIds === 'ERROR') {
        return '0:0';
    }
    
    const keyArray = keyIds.split(/\s+/).filter(k => k);
    const projectKeys = [];
    const pendingDeletionKeys = [];
    const activeProjectKeys = [];
    
    for (const keyId of keyArray) {
        const tagsCommand = `aws kms list-resource-tags --key-id "${keyId}" --region "${region}" --query "Tags[?TagKey=='Project' && contains(TagValue, '${ProjectName}')]" --output json 2>/dev/null`;
        const tags = executeAwsCommand(tagsCommand);
        
        if (tags !== '[]' && tags !== 'ERROR' && tags) {
            projectKeys.push(keyId);
            
            const keyStateCommand = `aws kms describe-key --key-id "${keyId}" --region "${region}" --query 'KeyMetadata.KeyState' --output text 2>/dev/null`;
            const keyState = executeAwsCommand(keyStateCommand);
            
            if (keyState === 'PendingDeletion') {
                pendingDeletionKeys.push(keyId);
            } else if (keyState === 'Enabled' || keyState === 'Disabled') {
                activeProjectKeys.push(keyId);
            }
        }
    }
    
    // Return active keys count and pending deletion count
    return `${activeProjectKeys.length}:${pendingDeletionKeys.length}`;
}

// =============================================================================
// Legacy AWS Resources Class (for backward compatibility)
// =============================================================================

class AWSResources {
    constructor(config = null) {
        this.config = config;
        this.defaultRegion = config ? config.get('basic.AwsRegion') || DEFAULT_REGION : DEFAULT_REGION;
    }

    executeAwsCommand(command, options = {}) {
        const region = options.region || this.defaultRegion;
        const fullCommand = `aws ${command} --region ${region}`;
        
        try {
            const result = execSync(fullCommand, { encoding: 'utf8' });
            return result.trim();
        } catch (error) {
            if (options.ignoreError) {
                return null;
            }
            throw error;
        }
    }

    async getStackOutput(stackName, outputKey, region) {
        return getStackOutput(stackName, outputKey, region);
    }

    async getStackStatus(stackName, region) {
        return checkStackStatus(stackName, region);
    }

    async checkS3BucketExists(bucketName, region) {
        return checkS3BucketAccess(bucketName, region);
    }

    async checkEksClusterExists(clusterName, region) {
        const status = checkEksClusterStatus(clusterName, region);
        return status === 'ACTIVE';
    }

    async checkVpcExists(vpcId, region) {
        const status = checkVpcStatus(vpcId, region);
        return status === 'available';
    }

    async checkIamRoleExists(roleName) {
        const roleArn = `arn:aws:iam::${executeAwsCommand('aws sts get-caller-identity --query Account --output text')}:role/${roleName}`;
        const result = checkIamRoleByArn(roleArn);
        return result === roleName;
    }
}

// =============================================================================
// Export Functions
// =============================================================================

module.exports = {
    AWSResources,
    DEFAULT_REGION,
    DEFAULT_PROJECT,
    getProjectName,
    uploadBootstrapFilesToS3,
    // CloudFormation Functions
    checkStackStatus,
    validateStackStatus,
    getStackOutput,
    getStackName,
    // EC2 Functions
    checkEc2Instance,
    checkSecurityGroup,
    checkVpcStatus,
    checkSubnetStatus,
    getSubnetAz,
    checkSubnetDetailed,
    // S3 Functions
    checkS3BucketAccess,
    checkRemainingS3Buckets,
    // KMS Functions
    checkKmsKeyStatus,
    // ECR Functions
    checkEcrRepository,
    checkRemainingEcrRepositories,
    // EKS Functions
    checkEksClusterStatus,
    checkEksNodegroupStatus,
    // ALB/ELB Functions
    checkAlbStatus,
    checkTargetGroup,
    // IAM Functions
    checkIamRoleByArn,
    checkOidcProvider,
    // SSM Functions
    checkSsmParameter,
    checkSsmAgentStatus,
    // Auto Scaling Functions
    checkAsgDetails,
    // Resource Cleanup Check Functions
    checkRemainingLogGroups,
    checkRemainingEbsVolumes,
    checkRemainingElasticIps,
    checkRemainingNetworkInterfaces,
    checkRemainingKmsKeys
};