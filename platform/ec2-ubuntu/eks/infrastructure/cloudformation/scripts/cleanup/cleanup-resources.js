#!/usr/bin/env node

// =============================================================================
// Comprehensive AWS Resources Cleanup Script
// This script cleans up all AWS resources created by the CloudFormation stacks
// including S3 buckets, ECR repositories, and network resources
// =============================================================================

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SCRIPT_DIR = __dirname;
const CONFIG_FILE = path.join(path.dirname(SCRIPT_DIR), 'config.yaml');

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Cleanup functions
async function cleanupS3Buckets(projectName, region) {
    console.log('----------------------------------------');
    console.log('S3 Bucket Cleanup');
    console.log('----------------------------------------');
    
    // Find S3 buckets with project name
    printInfo('Searching for S3 buckets...');
    const buckets = executeAwsCommand(`aws s3api list-buckets --query "Buckets[?contains(Name, '${projectName}')].Name" --output text 2>/dev/null`);
    
    // Also check for specific bootstrap bucket pattern
    const bootstrapBuckets = executeAwsCommand(`aws s3api list-buckets --query "Buckets[?contains(Name, 'bootstrap')].Name" --output text 2>/dev/null`);
    
    let allBuckets = '';
    if (buckets && buckets !== 'ERROR') {
        allBuckets += buckets;
    }
    if (bootstrapBuckets && bootstrapBuckets !== 'ERROR') {
        allBuckets += ` ${bootstrapBuckets}`;
    }
    
    if (!allBuckets.trim()) {
        printWarning(`No S3 buckets found containing '${projectName}' or 'bootstrap'`);
        return;
    }
    
    // Convert to array and remove duplicates
    const bucketArray = [...new Set(allBuckets.trim().split(/\s+/).filter(b => b))];
    printInfo(`Found ${bucketArray.length} S3 buckets to clean up`);
    
    for (const bucket of bucketArray) {
        console.log('');
        printInfo(`Processing bucket: ${bucket}`);
        
        // Check if bucket exists
        const bucketExists = executeAwsCommand(`aws s3api head-bucket --bucket "${bucket}" --region "${region}" 2>/dev/null && echo "exists" || echo "not_found"`);
        
        if (bucketExists.includes('exists')) {
            await emptyS3BucketCompletely(bucket);
            await deleteS3Bucket(bucket, region);
        } else {
            printWarning(`Bucket ${bucket} not found or not accessible`);
        }
    }
    console.log('');
}

async function emptyS3BucketCompletely(bucket) {
    printInfo(`  Emptying bucket contents completely: ${bucket}`);
    
    // Remove bucket policy if exists
    printInfo('    Removing bucket policy...');
    executeAwsCommand(`aws s3api delete-bucket-policy --bucket "${bucket}" 2>/dev/null`);
    
    // Remove bucket notifications
    printInfo('    Removing bucket notifications...');
    executeAwsCommand(`aws s3api put-bucket-notification-configuration --bucket "${bucket}" --notification-configuration '{}' 2>/dev/null`);
    
    // Disable versioning
    printInfo('    Suspending bucket versioning...');
    executeAwsCommand(`aws s3api put-bucket-versioning --bucket "${bucket}" --versioning-configuration Status=Suspended 2>/dev/null`);
    
    // Delete all multipart uploads
    printInfo('    Aborting multipart uploads...');
    const multipartUploads = executeAwsCommand(`aws s3api list-multipart-uploads --bucket "${bucket}" --query "Uploads[].{Key: Key, UploadId: UploadId}" --output json 2>/dev/null`);
    
    if (multipartUploads && multipartUploads !== 'ERROR') {
        try {
            const uploads = JSON.parse(multipartUploads);
            for (const upload of uploads) {
                if (upload.Key && upload.UploadId) {
                    executeAwsCommand(`aws s3api abort-multipart-upload --bucket "${bucket}" --key "${upload.Key}" --upload-id "${upload.UploadId}" 2>/dev/null`);
                }
            }
        } catch (error) {
            printWarning('    Error aborting multipart uploads');
        }
    }
    
    // Delete all object versions and delete markers in batches
    printInfo('    Deleting all object versions and delete markers...');
    let hasMoreObjects = true;
    let attempts = 0;
    const maxAttempts = 50;
    
    while (hasMoreObjects && attempts < maxAttempts) {
        attempts++;
        
        const versions = executeAwsCommand(`aws s3api list-object-versions --bucket "${bucket}" --max-items 1000 --output json 2>/dev/null`);
        
        if (!versions || versions === 'ERROR') {
            break;
        }
        
        try {
            const versionsData = JSON.parse(versions);
            let objectsToDelete = [];
            
            // Collect versions for batch delete
            if (versionsData.Versions && versionsData.Versions.length > 0) {
                for (const version of versionsData.Versions) {
                    if (version.Key && version.VersionId) {
                        objectsToDelete.push({
                            Key: version.Key,
                            VersionId: version.VersionId
                        });
                    }
                }
            }
            
            // Collect delete markers for batch delete
            if (versionsData.DeleteMarkers && versionsData.DeleteMarkers.length > 0) {
                for (const marker of versionsData.DeleteMarkers) {
                    if (marker.Key && marker.VersionId) {
                        objectsToDelete.push({
                            Key: marker.Key,
                            VersionId: marker.VersionId
                        });
                    }
                }
            }
            
            if (objectsToDelete.length === 0) {
                hasMoreObjects = false;
                break;
            }
            
            // Batch delete objects (up to 1000 at a time)
            const batchSize = 1000;
            for (let i = 0; i < objectsToDelete.length; i += batchSize) {
                const batch = objectsToDelete.slice(i, i + batchSize);
                const deleteRequest = {
                    Objects: batch,
                    Quiet: true
                };
                
                // Write delete request to temporary file to avoid command line length limits
                const tempFile = `/tmp/delete-batch-${Date.now()}.json`;
                try {
                    require('fs').writeFileSync(tempFile, JSON.stringify(deleteRequest));
                    const result = executeAwsCommand(`aws s3api delete-objects --bucket "${bucket}" --delete file://${tempFile} 2>/dev/null`);
                    
                    if (result === 'ERROR') {
                        // Fallback to individual deletion
                        printWarning(`    Batch delete failed, falling back to individual deletion for ${batch.length} objects`);
                        for (const obj of batch) {
                            const individualResult = executeAwsCommand(`aws s3api delete-object --bucket "${bucket}" --key "${obj.Key}" --version-id "${obj.VersionId}" 2>/dev/null && echo "success" || echo "failed"`);
                            if (individualResult !== 'success') {
                                printWarning(`    Failed to delete individual object: ${obj.Key} (version: ${obj.VersionId})`);
                            }
                        }
                    } else {
                        // Parse result to check for errors
                        try {
                            const deleteResult = JSON.parse(result);
                            if (deleteResult.Errors && deleteResult.Errors.length > 0) {
                                printWarning(`    Batch delete had ${deleteResult.Errors.length} errors`);
                                // Retry failed objects individually
                                for (const error of deleteResult.Errors) {
                                    printWarning(`    Retrying individual delete for: ${error.Key} (${error.Code}: ${error.Message})`);
                                    executeAwsCommand(`aws s3api delete-object --bucket "${bucket}" --key "${error.Key}" --version-id "${error.VersionId}" 2>/dev/null`);
                                }
                            }
                        } catch (parseError) {
                            // If result is not JSON, assume success
                        }
                    }
                } catch (fileError) {
                    // If temp file creation fails, fallback to individual deletion
                    printWarning(`    Temp file creation failed, using individual deletion for ${batch.length} objects`);
                    for (const obj of batch) {
                        executeAwsCommand(`aws s3api delete-object --bucket "${bucket}" --key "${obj.Key}" --version-id "${obj.VersionId}" 2>/dev/null`);
                    }
                } finally {
                    // Clean up temp file
                    try {
                        if (require('fs').existsSync(tempFile)) {
                            require('fs').unlinkSync(tempFile);
                        }
                    } catch (unlinkError) {
                        // Ignore cleanup errors
                    }
                }
            }
            
            printInfo(`    Processed ${objectsToDelete.length} object versions (attempt ${attempts})`);
            
        } catch (error) {
            printWarning(`    Error in batch ${attempts}: ${error.message}`);
            break;
        }
    }
    
    // Final cleanup with recursive delete for any remaining objects
    printInfo('    Final cleanup of remaining objects...');
    executeAwsCommand(`aws s3 rm "s3://${bucket}" --recursive 2>/dev/null`);
    
    // Verify bucket is empty
    const remainingObjects = executeAwsCommand(`aws s3api list-objects-v2 --bucket "${bucket}" --max-keys 1 --query "Contents[0].Key" --output text 2>/dev/null`);
    const remainingVersions = executeAwsCommand(`aws s3api list-object-versions --bucket "${bucket}" --max-keys 1 --query "Versions[0].Key" --output text 2>/dev/null`);
    
    if (remainingObjects === 'None' && remainingVersions === 'None') {
        printSuccess(`    Bucket ${bucket} is now completely empty`);
    } else {
        printWarning(`    Bucket ${bucket} may still contain some objects`);
    }
}

async function deleteS3Bucket(bucket, region) {
    printInfo(`    Deleting bucket: ${bucket}`);
    
    // Remove remaining bucket configurations
    executeAwsCommand(`aws s3api delete-bucket-cors --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-lifecycle --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-replication --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-website --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-encryption --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-public-access-block --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-policy --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-tagging --bucket "${bucket}" 2>/dev/null`);
    executeAwsCommand(`aws s3api delete-bucket-notification-configuration --bucket "${bucket}" --notification-configuration '{}' 2>/dev/null`);
    
    // Attempt to delete the bucket with retry logic
    let deleteSuccess = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!deleteSuccess && attempts < maxAttempts) {
        attempts++;
        
        // First check if bucket is truly empty
        const stillHasObjects = executeAwsCommand(`aws s3api list-objects-v2 --bucket "${bucket}" --max-keys 1 --query "Contents[0].Key" --output text 2>/dev/null`);
        const stillHasVersions = executeAwsCommand(`aws s3api list-object-versions --bucket "${bucket}" --max-keys 1 --query "Versions[0].Key" --output text 2>/dev/null`);
        const stillHasMarkers = executeAwsCommand(`aws s3api list-object-versions --bucket "${bucket}" --max-keys 1 --query "DeleteMarkers[0].Key" --output text 2>/dev/null`);
        
        if (stillHasObjects !== 'None' && stillHasObjects !== 'ERROR') {
            printWarning(`    Bucket still has objects, running additional cleanup...`);
            executeAwsCommand(`aws s3 rm "s3://${bucket}" --recursive --include "*" 2>/dev/null`);
        }
        
        if ((stillHasVersions !== 'None' && stillHasVersions !== 'ERROR') || 
            (stillHasMarkers !== 'None' && stillHasMarkers !== 'ERROR')) {
            printWarning(`    Bucket still has versions or delete markers, cleaning up...`);
            await emptyS3BucketCompletely(bucket);
        }
        
        const deleteResult = executeAwsCommand(`aws s3api delete-bucket --bucket "${bucket}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (deleteResult === 'success') {
            printSuccess(`    Bucket ${bucket} deleted successfully`);
            deleteSuccess = true;
        } else {
            if (attempts < maxAttempts) {
                printWarning(`    Delete attempt ${attempts} failed, retrying in 3 seconds...`);
                await sleep(3000);
                
                // Try force deletion using rb command as alternative
                if (attempts === 5) {
                    printInfo(`    Attempting force deletion with aws s3 rb --force...`);
                    const forceResult = executeAwsCommand(`aws s3 rb "s3://${bucket}" --force 2>/dev/null && echo "success" || echo "failed"`);
                    if (forceResult === 'success') {
                        printSuccess(`    Bucket ${bucket} force deleted successfully`);
                        deleteSuccess = true;
                    }
                }
            } else {
                printError(`    Failed to delete bucket ${bucket} after ${maxAttempts} attempts`);
                // Try one final force delete as last resort
                printInfo(`    Final attempt with force delete...`);
                const finalForceResult = executeAwsCommand(`aws s3 rb "s3://${bucket}" --force 2>/dev/null && echo "success" || echo "failed"`);
                if (finalForceResult === 'success') {
                    printSuccess(`    Bucket ${bucket} force deleted on final attempt`);
                } else {
                    printError(`    Bucket ${bucket} could not be deleted - may require manual intervention`);
                }
            }
        }
    }
}

async function cleanupEcrRepositories(projectName, region) {
    console.log('----------------------------------------');
    console.log('ECR Repository Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for ECR repositories...');
    
    // Get all repositories and filter
    const allRepositories = executeAwsCommand(`aws ecr describe-repositories --region "${region}" --query "repositories[].repositoryName" --output text 2>/dev/null`);
    
    let repositories = '';
    if (allRepositories && allRepositories !== 'ERROR') {
        const allRepoArray = allRepositories.split(/\s+/).filter(r => r);
        
        for (const repoName of allRepoArray) {
            // Check if repository name contains project name
            if (repoName.includes(projectName)) {
                repositories += `${repoName} `;
            } else {
                // Check if repository has project tag
                const accountId = executeAwsCommand(`aws sts get-caller-identity --query Account --output text`);
                if (accountId !== 'ERROR') {
                    const tags = executeAwsCommand(`aws ecr list-tags-for-resource --resource-arn "arn:aws:ecr:${region}:${accountId}:repository/${repoName}" --query "tags[?key=='Project' && contains(value, '${projectName}')]" --output json 2>/dev/null`);
                    
                    if (tags && tags !== 'ERROR' && tags !== '[]') {
                        repositories += `${repoName} `;
                    }
                }
            }
        }
    }
    
    // Also search specifically for repositories with project name pattern
    const projectRepos = executeAwsCommand(`aws ecr describe-repositories --region "${region}" --query "repositories[?contains(repositoryName, '${projectName}')].repositoryName" --output text 2>/dev/null`);
    
    if (projectRepos && projectRepos !== 'ERROR') {
        repositories += projectRepos;
    }
    
    // Remove duplicates and convert to array
    const uniqueRepos = [...new Set(repositories.trim().split(/\s+/).filter(r => r))];
    
    if (uniqueRepos.length === 0) {
        printWarning(`No ECR repositories found for project '${projectName}'`);
        return;
    }
    
    printInfo(`Found ${uniqueRepos.length} ECR repositories to clean up`);
    
    for (const repo of uniqueRepos) {
        console.log('');
        printInfo(`Processing repository: ${repo}`);
        
        // Check if repository exists
        const repoExists = executeAwsCommand(`aws ecr describe-repositories --repository-names "${repo}" --region "${region}" 2>/dev/null && echo "exists" || echo "not_found"`);
        
        if (repoExists === 'exists') {
            // Force delete the repository with all its contents
            printInfo('  Force deleting repository and all its contents...');
            
            // Use --force flag for immediate deletion of repository and all images
            const forceDeleteResult = executeAwsCommand(`aws ecr delete-repository --repository-name "${repo}" --region "${region}" --force 2>/dev/null && echo "success" || echo "failed"`);
            
            if (forceDeleteResult === 'success') {
                printSuccess(`Repository ${repo} deleted successfully with --force flag`);
            } else {
                printWarning('  Force delete failed, attempting manual cleanup...');
                
                // Delete lifecycle policy if exists
                executeAwsCommand(`aws ecr delete-lifecycle-policy --repository-name "${repo}" --region "${region}" 2>/dev/null`);
                
                // Delete repository policy if exists
                executeAwsCommand(`aws ecr delete-repository-policy --repository-name "${repo}" --region "${region}" 2>/dev/null`);
                
                // List and delete all images in batches
                printInfo('  Deleting all images in batches...');
                let attempts = 0;
                const maxAttempts = 10;
                
                while (attempts < maxAttempts) {
                    const imageIds = executeAwsCommand(`aws ecr list-images --repository-name "${repo}" --region "${region}" --max-items 100 --query 'imageIds[*]' --output json 2>/dev/null`);
                    
                    if (!imageIds || imageIds === 'ERROR' || imageIds === '[]') {
                        break;
                    }
                    
                    // Delete images in this batch
                    executeAwsCommand(`aws ecr batch-delete-image --repository-name "${repo}" --region "${region}" --image-ids '${imageIds}' 2>/dev/null`);
                    attempts++;
                }
                
                // Now try to delete the empty repository with force flag
                printInfo('  Attempting to delete empty repository with --force...');
                const finalDeleteResult = executeAwsCommand(`aws ecr delete-repository --repository-name "${repo}" --region "${region}" --force 2>/dev/null && echo "success" || echo "failed"`);
                
                if (finalDeleteResult === 'success') {
                    printSuccess(`Repository ${repo} deleted after manual cleanup`);
                } else {
                    printError(`Failed to delete repository ${repo} after manual cleanup`);
                }
            }
        } else {
            printWarning(`Repository ${repo} not found or already deleted`);
        }
    }
    console.log('');
}

async function cleanupLogGroups(projectName, region) {
    console.log('----------------------------------------');
    console.log('CloudWatch Log Groups Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for CloudWatch Log Groups...');
    
    // Common log group patterns for EKS and related services
    const patterns = [
        `/aws/eks/${projectName}`,
        `/aws/lambda/${projectName}`,
        `/aws/codebuild/${projectName}`,
        `/aws/ecs/${projectName}`,
        `/aws/vpc/flowlogs/${projectName}`
    ];
    
    for (const pattern of patterns) {
        const logGroups = executeAwsCommand(`aws logs describe-log-groups --log-group-name-prefix "${pattern}" --region "${region}" --query 'logGroups[].logGroupName' --output text 2>/dev/null`);
        
        if (logGroups && logGroups !== 'ERROR') {
            const logGroupArray = logGroups.split(/\s+/).filter(lg => lg);
            
            for (const logGroup of logGroupArray) {
                printInfo(`Deleting log group: ${logGroup}`);
                const deleteResult = executeAwsCommand(`aws logs delete-log-group --log-group-name "${logGroup}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
                
                if (deleteResult === 'success') {
                    printSuccess(`Log group ${logGroup} deleted`);
                } else {
                    printWarning(`Failed to delete log group ${logGroup}`);
                }
            }
        }
    }
    console.log('');
}

async function cleanupEbsVolumes(projectName, region) {
    console.log('----------------------------------------');
    console.log('EBS Volumes Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for unattached EBS volumes...');
    const volumes = executeAwsCommand(`aws ec2 describe-volumes --filters "Name=status,Values=available" --region "${region}" --query "Volumes[?Tags[?Key=='Project' && contains(Value, '${projectName}')]].VolumeId" --output text 2>/dev/null`);
    
    if (!volumes || volumes === 'ERROR') {
        printWarning(`No unattached EBS volumes found for project '${projectName}'`);
        return;
    }
    
    const volumeArray = volumes.split(/\s+/).filter(v => v);
    printInfo(`Found ${volumeArray.length} unattached EBS volumes`);
    
    for (const volume of volumeArray) {
        printInfo(`Deleting volume: ${volume}`);
        const deleteResult = executeAwsCommand(`aws ec2 delete-volume --volume-id "${volume}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (deleteResult === 'success') {
            printSuccess(`Volume ${volume} deleted`);
        } else {
            printWarning(`Failed to delete volume ${volume}`);
        }
    }
    console.log('');
}

async function cleanupElasticIps(projectName, region) {
    console.log('----------------------------------------');
    console.log('Elastic IP Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for Elastic IPs...');
    
    // Find EIPs by project tag
    const taggedEips = executeAwsCommand(`aws ec2 describe-addresses --region "${region}" --query "Addresses[?Tags[?Key=='Project' && contains(Value, '${projectName}')]].AllocationId" --output text 2>/dev/null`);
    
    // Find EIPs by name tag pattern (like NAT Gateway EIPs)
    const namePatternEips = executeAwsCommand(`aws ec2 describe-addresses --region "${region}" --query "Addresses[?Tags[?Key=='Name' && contains(Value, '${projectName}')]].AllocationId" --output text 2>/dev/null`);
    
    // Combine and deduplicate
    let allEips = `${taggedEips} ${namePatternEips}`.split(/\s+/).filter(eip => eip && eip !== 'ERROR');
    allEips = [...new Set(allEips)]; // Remove duplicates
    
    if (allEips.length === 0) {
        printWarning(`No Elastic IPs found for project '${projectName}'`);
        return;
    }
    
    printInfo(`Found ${allEips.length} Elastic IPs to release`);
    
    for (const eip of allEips) {
        // Check association status
        const associationId = executeAwsCommand(`aws ec2 describe-addresses --allocation-ids "${eip}" --region "${region}" --query "Addresses[0].AssociationId" --output text 2>/dev/null`);
        
        if (associationId && associationId !== 'None' && associationId !== 'null' && associationId !== 'ERROR') {
            printWarning(`EIP ${eip} is still associated (${associationId}). It will be released after disassociation.`);
        }
        
        printInfo(`Releasing Elastic IP: ${eip}`);
        const releaseResult = executeAwsCommand(`aws ec2 release-address --allocation-id "${eip}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (releaseResult === 'success') {
            printSuccess(`Elastic IP ${eip} released`);
        } else {
            printWarning(`Failed to release Elastic IP ${eip}`);
        }
    }
    console.log('');
}

async function cleanupNetworkInterfaces(projectName, region) {
    console.log('----------------------------------------');
    console.log('Network Interfaces Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for detached network interfaces...');
    const interfaces = executeAwsCommand(`aws ec2 describe-network-interfaces --filters "Name=status,Values=available" --region "${region}" --query "NetworkInterfaces[?TagSet[?Key=='Project' && contains(Value, '${projectName}')]].NetworkInterfaceId" --output text 2>/dev/null`);
    
    if (!interfaces || interfaces === 'ERROR') {
        printWarning(`No detached network interfaces found for project '${projectName}'`);
        return;
    }
    
    const interfaceArray = interfaces.split(/\s+/).filter(i => i);
    printInfo(`Found ${interfaceArray.length} detached network interfaces`);
    
    for (const intf of interfaceArray) {
        printInfo(`Deleting network interface: ${intf}`);
        const deleteResult = executeAwsCommand(`aws ec2 delete-network-interface --network-interface-id "${intf}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (deleteResult === 'success') {
            printSuccess(`Network interface ${intf} deleted`);
        } else {
            printWarning(`Failed to delete network interface ${intf}`);
        }
    }
    console.log('');
}

async function cleanupSsmParameters(projectName, region) {
    console.log('----------------------------------------');
    console.log('SSM Parameters Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for SSM parameters...');
    
    // Search for parameters with project path pattern
    const parameters = executeAwsCommand(`aws ssm describe-parameters --region "${region}" --query "Parameters[?starts_with(Name, '/eks/${projectName}')].Name" --output text 2>/dev/null`);
    
    if (!parameters || parameters === 'ERROR') {
        printWarning(`No SSM parameters found for project '${projectName}'`);
        return;
    }
    
    const paramArray = parameters.split(/\s+/).filter(p => p);
    printInfo(`Found ${paramArray.length} SSM parameters to delete`);
    
    for (const param of paramArray) {
        printInfo(`Deleting parameter: ${param}`);
        const deleteResult = executeAwsCommand(`aws ssm delete-parameter --name "${param}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (deleteResult === 'success') {
            printSuccess(`Parameter ${param} deleted`);
        } else {
            printWarning(`Failed to delete parameter ${param}`);
        }
    }
    console.log('');
}

async function cleanupSecurityGroups(projectName, region) {
    console.log('----------------------------------------');
    console.log('Security Groups Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for project security groups...');
    
    // Find security groups by project tag and name pattern
    const securityGroups = executeAwsCommand(`aws ec2 describe-security-groups --region "${region}" --filters "Name=tag:Project,Values=${projectName}" --query "SecurityGroups[].GroupId" --output text 2>/dev/null`);
    
    // Also search by name pattern
    const namePatternSgs = executeAwsCommand(`aws ec2 describe-security-groups --region "${region}" --filters "Name=group-name,Values=*${projectName}*" --query "SecurityGroups[].GroupId" --output text 2>/dev/null`);
    
    // Combine and deduplicate
    let allSgs = `${securityGroups} ${namePatternSgs}`.split(/\s+/).filter(sg => sg && sg !== 'ERROR');
    allSgs = [...new Set(allSgs)]; // Remove duplicates
    
    if (allSgs.length === 0) {
        printWarning(`No security groups found for project '${projectName}'`);
        return;
    }
    
    printInfo(`Found ${allSgs.length} security groups to delete`);
    
    // Delete security groups (may need multiple passes due to dependencies)
    for (let attempt = 1; attempt <= 3; attempt++) {
        printInfo(`Deletion attempt ${attempt}/3`);
        const remainingSgs = [];
        
        for (const sg of allSgs) {
            // Check if it's the default security group (cannot be deleted)
            const sgName = executeAwsCommand(`aws ec2 describe-security-groups --group-ids "${sg}" --region "${region}" --query "SecurityGroups[0].GroupName" --output text 2>/dev/null`);
            
            if (sgName === 'default') {
                printWarning(`Skipping default security group: ${sg}`);
                continue;
            }
            
            printInfo(`Attempting to delete security group: ${sg}`);
            const deleteResult = executeAwsCommand(`aws ec2 delete-security-group --group-id "${sg}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
            
            if (deleteResult === 'success') {
                printSuccess(`Security group ${sg} deleted`);
            } else {
                printWarning(`Failed to delete security group ${sg} (may have dependencies)`);
                remainingSgs.push(sg);
            }
        }
        
        allSgs = remainingSgs;
        if (allSgs.length === 0) {
            break;
        }
        
        if (attempt < 3) {
            printInfo('Waiting 10 seconds before retry...');
            await sleep(10000);
        }
    }
    
    if (allSgs.length > 0) {
        printWarning('Some security groups could not be deleted due to dependencies');
    }
    console.log('');
}

async function cleanupLaunchTemplates(projectName, region) {
    console.log('----------------------------------------');
    console.log('Launch Templates Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for launch templates...');
    
    // Find launch templates by name pattern
    const templates = executeAwsCommand(`aws ec2 describe-launch-templates --region "${region}" --query "LaunchTemplates[?contains(LaunchTemplateName, '${projectName}')].LaunchTemplateId" --output text 2>/dev/null`);
    
    if (!templates || templates === 'ERROR') {
        printWarning(`No launch templates found for project '${projectName}'`);
        return;
    }
    
    const templateArray = templates.split(/\s+/).filter(t => t);
    printInfo(`Found ${templateArray.length} launch templates to delete`);
    
    for (const template of templateArray) {
        printInfo(`Deleting launch template: ${template}`);
        const deleteResult = executeAwsCommand(`aws ec2 delete-launch-template --launch-template-id "${template}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (deleteResult === 'success') {
            printSuccess(`Launch template ${template} deleted`);
        } else {
            printWarning(`Failed to delete launch template ${template}`);
        }
    }
    console.log('');
}

async function cleanupIamResources(projectName, region) {
    console.log('----------------------------------------');
    console.log('IAM Roles and Instance Profiles Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for IAM roles and instance profiles...');
    
    // Find roles by name pattern
    const roles = executeAwsCommand(`aws iam list-roles --query "Roles[?contains(RoleName, '${projectName}')].RoleName" --output text 2>/dev/null`);
    
    if (roles && roles !== 'ERROR') {
        const roleArray = roles.split(/\s+/).filter(r => r);
        printInfo(`Found ${roleArray.length} IAM roles to delete`);
        
        for (const role of roleArray) {
            printInfo(`Processing role: ${role}`);
            
            // Detach managed policies
            const managedPolicies = executeAwsCommand(`aws iam list-attached-role-policies --role-name "${role}" --query "AttachedPolicies[].PolicyArn" --output text 2>/dev/null`);
            
            if (managedPolicies && managedPolicies !== 'ERROR') {
                const policyArray = managedPolicies.split(/\s+/).filter(p => p);
                
                for (const policy of policyArray) {
                    printInfo(`  Detaching managed policy: ${policy}`);
                    executeAwsCommand(`aws iam detach-role-policy --role-name "${role}" --policy-arn "${policy}" 2>/dev/null`);
                }
            }
            
            // Delete inline policies
            const inlinePolicies = executeAwsCommand(`aws iam list-role-policies --role-name "${role}" --query "PolicyNames" --output text 2>/dev/null`);
            
            if (inlinePolicies && inlinePolicies !== 'ERROR') {
                const inlinePolicyArray = inlinePolicies.split(/\s+/).filter(p => p);
                
                for (const policy of inlinePolicyArray) {
                    printInfo(`  Deleting inline policy: ${policy}`);
                    executeAwsCommand(`aws iam delete-role-policy --role-name "${role}" --policy-name "${policy}" 2>/dev/null`);
                }
            }
            
            // Remove role from instance profiles
            const instanceProfiles = executeAwsCommand(`aws iam list-instance-profiles-for-role --role-name "${role}" --query "InstanceProfiles[].InstanceProfileName" --output text 2>/dev/null`);
            
            if (instanceProfiles && instanceProfiles !== 'ERROR') {
                const ipArray = instanceProfiles.split(/\s+/).filter(ip => ip);
                
                for (const ip of ipArray) {
                    printInfo(`  Removing role from instance profile: ${ip}`);
                    executeAwsCommand(`aws iam remove-role-from-instance-profile --instance-profile-name "${ip}" --role-name "${role}" 2>/dev/null`);
                }
            }
            
            // Delete the role
            printInfo(`  Deleting role: ${role}`);
            const deleteResult = executeAwsCommand(`aws iam delete-role --role-name "${role}" 2>/dev/null && echo "success" || echo "failed"`);
            
            if (deleteResult === 'success') {
                printSuccess(`Role ${role} deleted`);
            } else {
                printWarning(`Failed to delete role ${role}`);
            }
        }
    }
    
    // Clean up instance profiles
    const instanceProfiles = executeAwsCommand(`aws iam list-instance-profiles --query "InstanceProfiles[?contains(InstanceProfileName, '${projectName}')].InstanceProfileName" --output text 2>/dev/null`);
    
    if (instanceProfiles && instanceProfiles !== 'ERROR') {
        const ipArray = instanceProfiles.split(/\s+/).filter(ip => ip);
        printInfo(`Found ${ipArray.length} instance profiles to delete`);
        
        for (const ip of ipArray) {
            printInfo(`Deleting instance profile: ${ip}`);
            const deleteResult = executeAwsCommand(`aws iam delete-instance-profile --instance-profile-name "${ip}" 2>/dev/null && echo "success" || echo "failed"`);
            
            if (deleteResult === 'success') {
                printSuccess(`Instance profile ${ip} deleted`);
            } else {
                printWarning(`Failed to delete instance profile ${ip}`);
            }
        }
    }
    console.log('');
}

async function cleanupNatGateways(projectName, region) {
    console.log('----------------------------------------');
    console.log('NAT Gateway Cleanup');
    console.log('----------------------------------------');
    
    printInfo('Searching for NAT Gateways...');
    
    // Find NAT Gateways by tag
    const natGws = executeAwsCommand(`aws ec2 describe-nat-gateways --region "${region}" --filter "Name=tag:Project,Values=${projectName}" "Name=state,Values=available,pending,deleting" --query "NatGateways[].NatGatewayId" --output text 2>/dev/null`);
    
    if (!natGws || natGws === 'ERROR') {
        printWarning(`No NAT Gateways found for project '${projectName}'`);
        return;
    }
    
    const natArray = natGws.split(/\s+/).filter(nat => nat);
    printInfo(`Found ${natArray.length} NAT Gateways to delete`);
    
    for (const natGw of natArray) {
        printInfo(`Deleting NAT Gateway: ${natGw}`);
        const deleteResult = executeAwsCommand(`aws ec2 delete-nat-gateway --nat-gateway-id "${natGw}" --region "${region}" 2>/dev/null && echo "success" || echo "failed"`);
        
        if (deleteResult === 'success') {
            printSuccess(`NAT Gateway ${natGw} deletion initiated`);
        } else {
            printWarning(`Failed to delete NAT Gateway ${natGw}`);
        }
    }
    
    // Wait for NAT Gateways to be deleted before proceeding
    if (natArray.length > 0) {
        printInfo('Waiting for NAT Gateways to be deleted...');
        
        for (const natGw of natArray) {
            // Check status periodically
            let attempts = 0;
            const maxAttempts = 30; // 5 minutes with 10-second intervals
            
            while (attempts < maxAttempts) {
                const state = executeAwsCommand(`aws ec2 describe-nat-gateways --nat-gateway-ids "${natGw}" --region "${region}" --query "NatGateways[0].State" --output text 2>/dev/null`);
                
                if (state === 'deleted' || state === 'ERROR') {
                    break;
                }
                
                await sleep(10000); // Wait 10 seconds
                attempts++;
            }
        }
        
        printSuccess('All NAT Gateways processed');
    }
    console.log('');
}

async function main() {
    try {
        // Configuration from config.yaml or defaults
        const projectName = getConfigValue('.basic.ProjectName', 'eks-platform');
        const awsRegion = process.env.AwsRegion || getConfigValue('.basic.AwsRegion', 'ap-northeast-1');
        const environment = process.env.Environment || getConfigValue('.basic.Environment', 'learning');

        console.log('=========================================');
        console.log('AWS Resources Comprehensive Cleanup');
        console.log(`Project: ${projectName}`);
        console.log(`Environment: ${environment}`);
        console.log(`Region: ${awsRegion}`);
        console.log('=========================================');
        console.log('');

        // Execute cleanup functions in proper order
        await cleanupSsmParameters(projectName, awsRegion);
        await cleanupLaunchTemplates(projectName, awsRegion);
        await cleanupIamResources(projectName, awsRegion);
        await cleanupNatGateways(projectName, awsRegion);
        await cleanupS3Buckets(projectName, awsRegion);
        await cleanupEcrRepositories(projectName, awsRegion);
        await cleanupLogGroups(projectName, awsRegion);
        await cleanupEbsVolumes(projectName, awsRegion);
        await cleanupElasticIps(projectName, awsRegion);
        await cleanupNetworkInterfaces(projectName, awsRegion);
        await cleanupSecurityGroups(projectName, awsRegion);

        console.log('=========================================');
        printSuccess('Resource cleanup completed successfully');
        console.log('=========================================');
        console.log('');
        printWarning('Note: Some resources may still be terminating in the background');

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