#!/usr/bin/env node

// =============================================================================
// EKS Platform Workflow Script (Step 4)
// =============================================================================
// このスクリプトはEKSプラットフォームの構築ワークフローの第4段階を実行します
// EKSクラスター、ワーカーノード、および関連リソースをデプロイします
// =============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// スクリプトの設定
const SCRIPT_DIR = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../../../..');
const WORK_DIR = path.resolve(SCRIPT_DIR, '../..');

// ログ設定
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', `eks-deploy-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.log`);

// 共通ファイルを読み込み
const colors = require('../common/display-colors.js');
const awsResources = require('../common/manage-aws.js');
const discordNotification = require('../common/notify-discord.js');

// Color functions
const { printInfo, printSuccess, printError, printStep } = colors;

// AWS functions
const { executeAwsCommand } = awsResources;

// Discord functions
const { sendEksWorkflowCompletionNotification } = discordNotification;

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

function logSuccess(message) {
    printSuccess(`${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '')} - ${message}`);
}

function logStart(message) {
    console.log('');
    console.log('===============================================');
    console.log(message);
    console.log('===============================================');
    console.log('');
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

// 時間推定を表示する関数
function showTimeEstimation() {
    console.log('=========================================');
    console.log('EKSデプロイ時間推定');
    console.log('=========================================');
    console.log('EKSクラスター: 約15-20分');
    console.log('ワーカーノード: 約10-15分');
    console.log('完了予定時刻: ' + new Date(Date.now() + 35 * 60 * 1000).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}));
    console.log('=========================================');
    console.log('');
}

// 進捗表示
function showProgress(step, total) {
    const percentage = Math.round((step / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    console.log('----------------------------------------');
    console.log(`進捗: [${progressBar}] ${percentage}% (${step}/${total})`);
    console.log('----------------------------------------');
}

// スタックタイミング表示
function showStackTiming(stackType, estimatedMinutes) {
    const startTime = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    const completionTime = new Date(Date.now() + estimatedMinutes * 60 * 1000).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    
    console.log('----------------------------------------');
    console.log(`スタック: ${stackType}`);
    console.log(`開始時刻: ${startTime}`);
    console.log(`所要時間: ${estimatedMinutes}分`);
    console.log(`完了予定: ${completionTime}`);
    console.log('----------------------------------------');
}

// 初期化
function initScript() {
    process.chdir(WORK_DIR);
    logInfo(`作業ディレクトリに移動: ${process.cwd()}`);
    
    logStart('EKS Platform Workflow Script (Step 4)');
    logInfo(`Script Directory: ${SCRIPT_DIR}`);
    logInfo(`Project Root: ${PROJECT_ROOT}`);
    logInfo(`Work Directory: ${WORK_DIR}`);
    logInfo(`Log File: ${LOG_FILE}`);
    
    // 時間推定を表示
    showTimeEstimation();
}

// EKSクラスターのデプロイ
function deployEksCluster() {
    logStep('[1/2] EKSクラスターのデプロイ');
    showStackTiming('eks-platform', 20);
    
    return executeMakeCommand('deploy-04-eks', 'EKSプラットフォームをデプロイ');
}

// EKSクラスターの確認
function verifyEksCluster() {
    logStep('[2/2] EKSクラスターの確認');
    
    if (executeMakeCommand('check-05-eks', 'EKSクラスターの状態を確認')) {
        showProgress(2, 2);
        console.log('');
        logSuccess('EKSクラスターのデプロイが完了しました！');
        console.log('');
        
        // スタック状態を表示
        try {
            logInfo('EKSクラスター情報を取得中...');
            executeMakeCommand('status-eks', 'EKSクラスターステータスを表示');
        } catch (error) {
            logError('クラスター情報の取得に失敗しました');
        }
        
        return true;
    }
    return false;
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
    try {
        // 初期化
        initScript();
        
        // EKSクラスターのデプロイ
        if (!deployEksCluster()) {
            logError('EKSクラスターのデプロイに失敗しました');
            sendEksWorkflowCompletionNotification('false', 'EKSクラスター構築ワークフロー');
            scriptExit(1, 'EKS Platform Workflow Script');
        }
        
        // EKSクラスターの確認
        if (!verifyEksCluster()) {
            logError('EKSクラスターの確認に失敗しました');
            sendEksWorkflowCompletionNotification('false', 'EKSクラスター構築ワークフロー');
            scriptExit(1, 'EKS Platform Workflow Script');
        }
        
        sendEksWorkflowCompletionNotification('true', 'EKSクラスター構築ワークフロー');
        
        // スクリプト終了
        scriptExit(0, 'EKS Platform Workflow Script');
        
    } catch (error) {
        logError(`予期しないエラーが発生しました: ${error.message}`);
        sendEksWorkflowCompletionNotification('false', 'EKSクラスター構築ワークフロー');
        scriptExit(1, 'EKS Platform Workflow Script');
    }
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    main,
    deployEksCluster,
    verifyEksCluster
};