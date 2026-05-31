#!/usr/bin/env node

// =============================================================================
// EKS Cluster Destruction Script
// =============================================================================
// このスクリプトはEKSクラスターとその関連リソースを破棄します
// =============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// スクリプトの設定
const SCRIPT_DIR = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../../../..');
const WORK_DIR = path.resolve(SCRIPT_DIR, '../..');

// ログ設定
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', `eks-destroy-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.log`);

// 共通ファイルを読み込み
const colors = require('../common/display-colors.js');
const awsResources = require('../common/manage-aws.js');
const discordNotification = require('../common/notify-discord.js');

// Color functions
const { printInfo, printSuccess, printError, printStep, printWarning } = colors;

// AWS functions
const { executeAwsCommand } = awsResources;

// Discord functions
const { sendEksDestructionCompletionNotification } = discordNotification;

// Global variables
let CLUSTER_EXISTS = false;
let CLUSTER_NAME = 'eks-platform';
let AwsRegion = 'ap-northeast-1';

// ログ関数
function logInfo(message) {
    printInfo(`${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '')} - ${message}`);
}

function logError(message) {
    printError(`${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '')} - ${message}`);
}

function logStep(message) {
    printStep(`${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '')} - ${message}`);
}

function logWarn(message) {
    printWarning(`${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '')} - ${message}`);
}

function logStart(message) {
    console.log('');
    console.log('===============================================');
    console.log(message);
    console.log('===============================================');
    console.log('');
}

// Configuration from config.yaml
function getConfigValues() {
    const configFile = path.join(WORK_DIR, 'config.yaml');
    if (fs.existsSync(configFile)) {
        try {
            CLUSTER_NAME = execSync(`yq eval '.basic.cluster_name' "${configFile}" 2>/dev/null || echo "eks-platform"`, { encoding: 'utf8' }).trim();
            AwsRegion = execSync(`yq eval '.basic.AwsRegion' "${configFile}" 2>/dev/null || echo "ap-northeast-1"`, { encoding: 'utf8' }).trim();
        } catch (error) {
            CLUSTER_NAME = 'eks-platform';
            AwsRegion = 'ap-northeast-1';
        }
    } else {
        CLUSTER_NAME = 'eks-platform';
        AwsRegion = 'ap-northeast-1';
    }
}

// Makefileコマンド実行関数
function executeMakeCommand(command, description) {
    logInfo(description);
    logInfo(`実行コマンド: make ${command}`);
    
    try {
        process.chdir(WORK_DIR);
        execSync(`make ${command}`, { stdio: 'inherit' });
        logInfo(`${description}が正常に完了しました`);
        return true;
    } catch (error) {
        logError(`${description}に失敗しました`);
        return false;
    }
}

// Makefileコマンド実行関数（警告を許可）
function executeMakeCommandWithWarning(command, description) {
    logInfo(description);
    logInfo(`実行コマンド: make ${command}`);
    
    try {
        process.chdir(WORK_DIR);
        execSync(`make ${command}`, { stdio: 'inherit' });
        logInfo(`${description}が正常に完了しました`);
        return true;
    } catch (error) {
        logWarn(`${description}で警告が発生しました`);
        return true; // 警告でも継続
    }
}

// 前提条件チェック
function checkPrerequisites() {
    // 必要なコマンドの存在確認
    const requiredCommands = ['aws', 'kubectl', 'make', 'curl'];
    for (const cmd of requiredCommands) {
        try {
            execSync(`command -v ${cmd}`, { stdio: 'pipe' });
        } catch (error) {
            logError(`必要なコマンドが見つかりません: ${cmd}`);
            return false;
        }
    }
    
    // AWS認証情報の確認
    try {
        execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    } catch (error) {
        logError('AWS認証情報が設定されていません');
        return false;
    }
    
    // 作業ディレクトリの存在確認
    if (!fs.existsSync(WORK_DIR)) {
        logError(`作業ディレクトリが存在しません: ${WORK_DIR}`);
        return false;
    }
    
    // Makefileの存在確認
    if (!fs.existsSync(path.join(WORK_DIR, 'Makefile'))) {
        logError(`Makefileが見つかりません: ${path.join(WORK_DIR, 'Makefile')}`);
        return false;
    }
    
    logInfo('前提条件チェック完了');
    return true;
}

// 初期化
function initScript() {
    getConfigValues();
    
    process.chdir(WORK_DIR);
    logInfo(`作業ディレクトリに移動: ${process.cwd()}`);
    
    logStart('EKS Cluster Destruction Script');
    logInfo(`Script Directory: ${SCRIPT_DIR}`);
    logInfo(`Project Root: ${PROJECT_ROOT}`);
    logInfo(`Work Directory: ${WORK_DIR}`);
    logInfo(`Log File: ${LOG_FILE}`);
    logInfo(`Cluster Name: ${CLUSTER_NAME}`);
    logInfo(`AWS Region: ${AwsRegion}`);
}

// 現在のリソース状態確認
function checkCurrentResources() {
    logStep('現在のリソース状態を確認');
    
    // EKSクラスターの存在確認
    try {
        execSync(`aws eks describe-cluster --name ${CLUSTER_NAME} --region ${AwsRegion}`, { stdio: 'pipe' });
        logWarn(`EKSクラスター '${CLUSTER_NAME}' が存在します`);
        CLUSTER_EXISTS = true;
    } catch (error) {
        logInfo(`EKSクラスター '${CLUSTER_NAME}' は存在しません`);
        CLUSTER_EXISTS = false;
    }
    
    // CloudFormationスタックの確認
    try {
        const stacks = execSync('aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query \'StackSummaries[?contains(StackName, `eks`)].StackName\' --output text --region ap-northeast-1 2>/dev/null', { encoding: 'utf8' }).trim();
        
        if (stacks && stacks !== '') {
            logWarn('以下のCloudFormationスタックが存在します:');
            stacks.split(/\s+/).forEach(stack => {
                if (stack) {
                    logWarn(`  - ${stack}`);
                }
            });
        } else {
            logInfo('関連するCloudFormationスタックは見つかりませんでした');
        }
    } catch (error) {
        logInfo('CloudFormationスタックの確認でエラーが発生しました');
    }
}

// リソース削除実行
function executeDestruction() {
    logStep('リソース削除を開始');
    
    // メインの削除処理
    if (!executeMakeCommand('destroy', 'CloudFormationスタックの削除')) {
        return false;
    }
    
    // リソースクリーンアップ
    if (!executeMakeCommandWithWarning('cleanup-resources', 'リソースクリーンアップ')) {
        return false;
    }
    
    // クリーンアップ確認
    if (!executeMakeCommandWithWarning('check-cleanup-resources', 'クリーンアップ結果を確認')) {
        return false;
    }
    
    logInfo('リソース削除完了');
    return true;
}

// スクリプト終了処理
function scriptExit(exitCode, scriptName) {
    if (exitCode === 0) {
        logInfo('スクリプトが正常に終了しました');
        logInfo(`${scriptName} 完了`);
    } else {
        logError(`スクリプトがエラーで終了しました (終了コード: ${exitCode})`);
        logError(`${scriptName} 失敗`);
    }
    
    process.exit(exitCode);
}

// メイン処理
function main() {
    let exitCode = 0;
    
    try {
        // 初期化
        initScript();
        
        // 前提条件チェック
        if (!checkPrerequisites()) {
            exitCode = 1;
            logError('前提条件チェックに失敗しました');
        } else {
            // 現在のリソース状態確認
            checkCurrentResources();
            
            // リソース削除実行
            if (!executeDestruction()) {
                exitCode = 1;
                logError('リソース削除に失敗しました');
            } else {
                // 成功通知
                sendEksDestructionCompletionNotification('true');
            }
        }
        
        // エラー通知
        if (exitCode !== 0) {
            sendEksDestructionCompletionNotification('false');
        }
        
    } catch (error) {
        exitCode = 1;
        logError(`予期しないエラーが発生しました: ${error.message}`);
        sendEksDestructionCompletionNotification('false');
    }
    
    // スクリプト終了
    scriptExit(exitCode, 'EKS Cluster Destruction Script');
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    main,
    checkPrerequisites,
    initScript,
    checkCurrentResources,
    executeDestruction
};