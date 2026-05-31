#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');

// =============================================================================
// Upload Scripts to S3
// =============================================================================

// Configuration
const CONFIG = {
  region: process.env.DEFAULT_REGION || 'ap-northeast-1',
  stackName: 'eks-platform-prerequisites-v2',
  maxRetries: 10,
  retryDelay: 3,
  scripts: [
    {
      localPath: './scripts/user-data/bastion-user-data.sh',
      s3Key: 'scripts/bastion-user-data.sh',
      description: 'Bastion User Data Script'
    }
  ]
};

// Color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function printHeader(message) {
  console.log(`${colors.blue}${colors.bold}=== ${message} ===${colors.reset}`);
}

function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printError(message) {
  console.log(`${colors.red}ERROR: ${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      throw new Error(`Command failed: ${command}\nError: ${error.message}`);
    }
    return null;
  }
}

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function validateWorkingDirectory() {
  const currentDir = process.cwd();
  const expectedDir = '/home/wsl/local_ubuntu/environment-kit/platform/ec2-ubuntu/eks/infrastructure/cloudformation';
  
  if (!currentDir.includes('cloudformation')) {
    printWarning(`Current directory: ${currentDir}`);
    printWarning(`Expected to run from: ${expectedDir}`);
    printInfo('Attempting to continue with current directory...');
  }
}

function getBucketName() {
  printInfo('Retrieving S3 bucket name from CloudFormation stack...');
  
  const bucketCommand = `aws cloudformation describe-stacks --stack-name ${CONFIG.stackName} --region ${CONFIG.region} --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text`;
  
  const bucketName = execCommand(bucketCommand, { silent: true, ignoreError: true });
  
  if (!bucketName || bucketName.trim() === '' || bucketName.includes('None')) {
    throw new Error(`Could not retrieve bucket name from stack ${CONFIG.stackName}. Please ensure the prerequisites stack is deployed.`);
  }

  const cleanBucketName = bucketName.trim();
  printSuccess(`S3 bucket name retrieved: ${cleanBucketName}`);
  return cleanBucketName;
}

async function waitForBucketAvailability(bucketName) {
  printInfo('Checking S3 bucket availability...');
  
  for (let i = 1; i <= CONFIG.maxRetries; i++) {
    try {
      execCommand(`aws s3api head-bucket --bucket "${bucketName}" --region "${CONFIG.region}"`, { silent: true });
      printSuccess('S3 bucket is ready and accessible');
      return true;
    } catch (error) {
      if (i === CONFIG.maxRetries) {
        throw new Error(`S3 bucket ${bucketName} is not accessible after ${CONFIG.maxRetries * CONFIG.retryDelay} seconds`);
      }
      printInfo(`Waiting for S3 bucket to be ready... (attempt ${i}/${CONFIG.maxRetries})`);
      await sleep(CONFIG.retryDelay);
    }
  }
  
  return false;
}

function validateScriptFile(scriptPath) {
  const absolutePath = path.resolve(scriptPath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Script file not found: ${absolutePath}`);
  }
  
  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${absolutePath}`);
  }
  
  printSuccess(`Script file validated: ${absolutePath}`);
  return absolutePath;
}

function uploadScript(localPath, s3Key, bucketName, description) {
  printInfo(`Uploading ${description}...`);
  
  const uploadCommand = `aws s3 cp "${localPath}" s3://${bucketName}/${s3Key} --region ${CONFIG.region}`;
  execCommand(uploadCommand);
  
  printSuccess(`Successfully uploaded ${description} to s3://${bucketName}/${s3Key}`);
}

async function main() {
  try {
    printHeader('Uploading Scripts to S3');
    console.log(`Region: ${CONFIG.region}`);
    console.log(`Stack Name: ${CONFIG.stackName}`);
    console.log('');

    // Validate working directory
    validateWorkingDirectory();
    console.log('');

    // Get bucket name
    const bucketName = getBucketName();
    console.log('');

    // Wait for bucket availability
    await waitForBucketAvailability(bucketName);
    console.log('');

    // Upload each script
    for (const script of CONFIG.scripts) {
      try {
        const validatedPath = validateScriptFile(script.localPath);
        uploadScript(validatedPath, script.s3Key, bucketName, script.description);
        console.log('');
      } catch (error) {
        printError(`Failed to upload ${script.description}: ${error.message}`);
        throw error;
      }
    }

    printSuccess('All scripts uploaded successfully!');
    console.log('');
    printInfo('Upload Summary:');
    CONFIG.scripts.forEach(script => {
      console.log(`  - ${script.description}: s3://${bucketName}/${script.s3Key}`);
    });

  } catch (error) {
    printError(`Script execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };
