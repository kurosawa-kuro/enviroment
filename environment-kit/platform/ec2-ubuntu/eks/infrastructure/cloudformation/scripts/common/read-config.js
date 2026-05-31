#!/usr/bin/env node

// =============================================================================
// YAML Config Reader - YAMLファイルから設定を読み込むシンプルな関数群
// =============================================================================
// このファイルはconfig.yamlファイルを直接読み込み、設定値を取得する機能を提供します
// シングルソースオリジン原則に従い、config.yamlのみを参照します
// =============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// デフォルトの設定ファイルパス
const DEFAULT_CONFIG_PATH = path.join(__dirname, '../../config.yaml');

// 設定ファイルの存在確認
function configExists(configPath = DEFAULT_CONFIG_PATH) {
    return fs.existsSync(configPath);
}

// yqコマンドを使用して設定値を取得（元のシェルスクリプトと同じ方法）
function getConfigValue(path, defaultValue = '', configPath = DEFAULT_CONFIG_PATH) {
    if (!configExists(configPath)) {
        console.warn(`設定ファイルが見つかりません: ${configPath}`);
        return defaultValue;
    }
    
    try {
        const command = `yq eval '.${path}' "${configPath}" 2>/dev/null || echo "${defaultValue}"`;
        const result = execSync(command, { encoding: 'utf8' }).trim();
        
        // yqがnullを返した場合はデフォルト値を使用
        if (result === 'null' || result === '') {
            return defaultValue;
        }
        
        return result;
    } catch (error) {
        console.warn(`設定値の取得に失敗: ${path} - ${error.message}`);
        return defaultValue;
    }
}

// 基本設定を取得
function getBasicConfig(configPath = DEFAULT_CONFIG_PATH) {
    return {
        ProjectName: getConfigValue('basic.ProjectName', 'eks-platform', configPath),
        Version: getConfigValue('basic.Version', 'v2', configPath),
        AwsRegion: getConfigValue('basic.AwsRegion', 'ap-northeast-1', configPath),
        Environment: getConfigValue('basic.Environment', 'learning', configPath),
        ClusterName: getConfigValue('basic.ClusterName', 'eks-platform', configPath),
        Owner: getConfigValue('basic.Owner', 'admin', configPath)
    };
}

// スタック名を取得（変数展開あり）
function getStackName(stackType, configPath = DEFAULT_CONFIG_PATH) {
    const basic = getBasicConfig(configPath);
    const stackNameTemplate = getConfigValue(`Stacks.${stackType}`, '', configPath);
    
    if (!stackNameTemplate) {
        return `${basic.ProjectName}-${stackType.toLowerCase()}-${basic.Version}`;
    }
    
    // 変数展開を実行
    return stackNameTemplate
        .replace('${basic.ProjectName}', basic.ProjectName)
        .replace('${basic.Version}', basic.Version)
        .replace('${basic.Environment}', basic.Environment);
}

// テンプレートパスを取得
function getTemplatePath(templateType, configPath = DEFAULT_CONFIG_PATH) {
    const templatePath = getConfigValue(`Templates.${templateType}`, '', configPath);
    if (templatePath) {
        return path.resolve(path.dirname(configPath), templatePath);
    }
    return '';
}

// パラメータ値を取得
function getParameter(parameterPath, defaultValue = '', configPath = DEFAULT_CONFIG_PATH) {
    return getConfigValue(`Parameters.${parameterPath}`, defaultValue, configPath);
}

// 時間推定値を取得
function getTimeEstimation(stackType, configPath = DEFAULT_CONFIG_PATH) {
    const minutes = getConfigValue(`TimeEstimation.${stackType}`, '0', configPath);
    return parseInt(minutes) || 0;
}

// デプロイメント順序を取得
function getDeploymentOrder(configPath = DEFAULT_CONFIG_PATH) {
    try {
        const command = `yq eval '.DeploymentOrder[]' "${configPath}" 2>/dev/null`;
        const result = execSync(command, { encoding: 'utf8' }).trim();
        
        if (result) {
            return result.split('\n').filter(item => item.trim());
        }
        
        // デフォルトの順序
        return ['prerequisites', 'iam_role', 'network', 'platform', 'alb', 'bastion'];
    } catch (error) {
        console.warn('デプロイメント順序の取得に失敗、デフォルト値を使用');
        return ['prerequisites', 'iam_role', 'network', 'platform', 'alb', 'bastion'];
    }
}

// EKS設定を取得
function getEksConfig(configPath = DEFAULT_CONFIG_PATH) {
    return {
        KubernetesVersion: getParameter('EKS.KubernetesVersion', '1.31', configPath),
        NodeInstanceType: getParameter('EKS.NodeInstanceType', 't3.small', configPath),
        NodeGroupMinSize: getParameter('EKS.NodeGroupMinSize', '1', configPath),
        NodeGroupDesiredSize: getParameter('EKS.NodeGroupDesiredSize', '2', configPath),
        NodeGroupMaxSize: getParameter('EKS.NodeGroupMaxSize', '3', configPath),
        EndpointPublicAccess: getParameter('EKS.EndpointPublicAccess', 'false', configPath),
        EndpointPrivateAccess: getParameter('EKS.EndpointPrivateAccess', 'true', configPath)
    };
}

// ネットワーク設定を取得
function getNetworkConfig(configPath = DEFAULT_CONFIG_PATH) {
    return {
        VpcCidr: getParameter('Network.VpcCidr', '10.0.0.0/16', configPath),
        PublicSubnet1Cidr: getParameter('Network.PublicSubnet1Cidr', '10.0.1.0/24', configPath),
        PublicSubnet2Cidr: getParameter('Network.PublicSubnet2Cidr', '10.0.2.0/24', configPath),
        PrivateSubnet1Cidr: getParameter('Network.PrivateSubnet1Cidr', '10.0.10.0/24', configPath),
        PrivateSubnet2Cidr: getParameter('Network.PrivateSubnet2Cidr', '10.0.11.0/24', configPath),
        EnableNatGateway: getParameter('Network.EnableNatGateway', 'true', configPath)
    };
}

// ALB設定を取得
function getAlbConfig(configPath = DEFAULT_CONFIG_PATH) {
    return {
        TargetGroupPort: getParameter('ALB.TargetGroupPort', '30080', configPath),
        TargetGroupProtocol: getParameter('ALB.TargetGroupProtocol', 'HTTP', configPath),
        HealthCheckEnabled: getParameter('ALB.HealthCheckEnabled', 'true', configPath),
        HealthCheckPath: getParameter('ALB.HealthCheckPath', '/', configPath),
        HealthCheckProtocol: getParameter('ALB.HealthCheckProtocol', 'HTTP', configPath)
    };
}

// Bastion設定を取得
function getBastionConfig(configPath = DEFAULT_CONFIG_PATH) {
    return {
        InstanceType: getParameter('Bastion.InstanceType', 't3.micro', configPath),
        UbuntuAmiParameter: getParameter('Bastion.UbuntuAmiParameter', '/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id', configPath)
    };
}

// S3設定を取得
function getS3Config(configPath = DEFAULT_CONFIG_PATH) {
    return {
        BucketPrefix: getParameter('S3.BucketPrefix', 'eks-platform-bootstrap', configPath),
        EnableVersioning: getParameter('S3.EnableVersioning', 'true', configPath),
        EnableEncryption: getParameter('S3.EnableEncryption', 'true', configPath)
    };
}

// ECR設定を取得
function getEcrConfig(configPath = DEFAULT_CONFIG_PATH) {
    const basic = getBasicConfig(configPath);
    const repositoryNameTemplate = getParameter('ECR.RepositoryName', '${basic.ProjectName}-app-${basic.Version}', configPath);
    
    const repositoryName = repositoryNameTemplate
        .replace('${basic.ProjectName}', basic.ProjectName)
        .replace('${basic.Version}', basic.Version);
    
    return {
        RepositoryName: repositoryName
    };
}

// 設定ファイルの妥当性を確認
function validateConfig(configPath = DEFAULT_CONFIG_PATH) {
    if (!configExists(configPath)) {
        return {
            isValid: false,
            errors: [`設定ファイルが見つかりません: ${configPath}`]
        };
    }
    
    const errors = [];
    const basic = getBasicConfig(configPath);
    
    // 必須項目のチェック
    if (!basic.ProjectName) errors.push('basic.ProjectName が設定されていません');
    if (!basic.AwsRegion) errors.push('basic.AwsRegion が設定されていません');
    if (!basic.Environment) errors.push('basic.Environment が設定されていません');
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// 設定情報を表示
function showConfigSummary(configPath = DEFAULT_CONFIG_PATH) {
    if (!configExists(configPath)) {
        console.error(`設定ファイルが見つかりません: ${configPath}`);
        return;
    }
    
    const basic = getBasicConfig(configPath);
    
    console.log('=== Configuration Summary ===');
    console.log(`Config File: ${configPath}`);
    console.log(`Project Name: ${basic.ProjectName}`);
    console.log(`Version: ${basic.Version}`);
    console.log(`AWS Region: ${basic.AwsRegion}`);
    console.log(`Environment: ${basic.Environment}`);
    console.log(`Cluster Name: ${basic.ClusterName}`);
    console.log(`Owner: ${basic.Owner}`);
    console.log('===============================');
}

// =============================================================================
// Export Functions
// =============================================================================

module.exports = {
    // Core functions
    configExists,
    getConfigValue,
    validateConfig,
    showConfigSummary,
    
    // Basic configuration
    getBasicConfig,
    
    // Stack and template functions
    getStackName,
    getTemplatePath,
    getParameter,
    getTimeEstimation,
    getDeploymentOrder,
    
    // Service-specific configurations
    getEksConfig,
    getNetworkConfig,
    getAlbConfig,
    getBastionConfig,
    getS3Config,
    getEcrConfig,
    
    // Constants
    DEFAULT_CONFIG_PATH
};