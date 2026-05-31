#!/usr/bin/env node

// =============================================================================
// Bastion Host Deployment Workflow Script
// =============================================================================
// このスクリプトは既存のネットワーク（VPC、EKS）環境に
// Bastionホストとその関連リソースをデプロイします
// =============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// スクリプトの設定
const SCRIPT_DIR = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../../../..');
const WORK_DIR = path.resolve(SCRIPT_DIR, '../..');

// ログ設定
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', `bastion-deploy-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.log`);

// 共通ファイルを読み込み
const colors = require('../common/display-colors.js');
const awsResources = require('../common/manage-aws.js');
const discordNotification = require('../common/notify-discord.js');

// Color functions
const { printInfo, printSuccess, printError, printStep } = colors;

// AWS functions
const { executeAwsCommand } = awsResources;

// Discord functions
const { sendSuccessNotification, sendErrorNotification } = discordNotification;

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

// Bastionワークフロー完了通知
function sendBastionWorkflowCompletionNotification(success, workflowType) {
    if (success === 'true' || success === true) {
        sendSuccessNotification(`${workflowType}が正常に完了しました`, 'Bastion Workflow ');
    } else {
        sendErrorNotification(`${workflowType}中にエラーが発生しました`, 'Bastion Workflow ');
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

// 時間推定を表示する関数（簡易版）
function showTimeEstimation(stackType) {
    console.log('=========================================');
    console.log('デプロイ時間推定');
    console.log('=========================================');
    console.log(`対象スタック: ${stackType}`);
    console.log('Bastionホスト: 約5-10分');
    console.log('完了予定時刻: ' + new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}));
    console.log('=========================================');
    console.log('');
}

// 進捗表示
function showProgress(stackType) {
    console.log('----------------------------------------');
    console.log(`進捗: [████████████████████] 100% (${stackType})`);
    console.log('----------------------------------------');
}

// スタックタイミング表示
function showStackTiming(stackType) {
    const startTime = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    const completionTime = new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    
    console.log('----------------------------------------');
    console.log(`スタック: ${stackType}`);
    console.log(`開始時刻: ${startTime}`);
    console.log('所要時間: 5-10分');
    console.log(`完了予定: ${completionTime}`);
    console.log('----------------------------------------');
}

// 初期化
function initScript() {
    process.chdir(WORK_DIR);
    logInfo(`作業ディレクトリに移動: ${process.cwd()}`);
    
    logStart('Bastion Host Deployment Workflow Script');
    logInfo(`Script Directory: ${SCRIPT_DIR}`);
    logInfo(`Project Root: ${PROJECT_ROOT}`);
    logInfo(`Work Directory: ${WORK_DIR}`);
    logInfo(`Log File: ${LOG_FILE}`);
    
    // 時間推定を表示
    showTimeEstimation('bastion');
}

// 前提条件の確認
function checkPrerequisitesDeployment() {
    logStep('[1/4] 前提条件の確認');
    
    return executeMakeCommand('check-01-prerequisites', '前提条件スタックの状態を確認');
}

// ネットワークの確認
function checkNetwork() {
    logStep('[2/4] ネットワークの確認');
    
    return executeMakeCommand('check-02-network', 'ネットワークスタックの状態を確認');
}

// Bastionホストのデプロイ
function deployBastion() {
    logStep('[3/4] Bastionホストのデプロイ');
    showStackTiming('bastion');
    
    return executeMakeCommand('deploy-05-bastion', 'Bastionホストスタックをデプロイ');
}

// Bastionホストの確認
function checkBastion() {
    logStep('[4/4] Bastionホストの確認');
    
    if (executeMakeCommand('check-05-bastion', 'Bastionホストスタックの状態を確認')) {
        showProgress('bastion');
        console.log('');
        logSuccess('Bastionホストのデプロイが完了しました！');
        console.log('');
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
        
        // 前提条件チェック
        if (!checkPrerequisites()) {
            logError('前提条件チェックに失敗しました');
            sendBastionWorkflowCompletionNotification('false', 'Bastionホスト管理ワークフロー');
            scriptExit(1, 'Bastion Workflow Script');
        }
        
        // 前提条件の確認
        if (!checkPrerequisitesDeployment()) {
            logError('前提条件の確認に失敗しました');
            sendBastionWorkflowCompletionNotification('false', 'Bastionホスト管理ワークフロー');
            scriptExit(1, 'Bastion Workflow Script');
        }
        
        // ネットワークの確認
        if (!checkNetwork()) {
            logError('ネットワークの確認に失敗しました');
            sendBastionWorkflowCompletionNotification('false', 'Bastionホスト管理ワークフロー');
            scriptExit(1, 'Bastion Workflow Script');
        }
        
        // Bastionホストのデプロイと確認
        if (!deployBastion()) {
            logError('Bastionホストのデプロイに失敗しました');
            sendBastionWorkflowCompletionNotification('false', 'Bastionホスト管理ワークフロー');
            scriptExit(1, 'Bastion Workflow Script');
        }
        
        if (!checkBastion()) {
            logError('Bastionホストの確認に失敗しました');
            sendBastionWorkflowCompletionNotification('false', 'Bastionホスト管理ワークフロー');
            scriptExit(1, 'Bastion Workflow Script');
        }
        
        sendBastionWorkflowCompletionNotification('true', 'Bastionホスト管理ワークフロー');
        
        // スクリプト終了
        scriptExit(0, 'Bastion Workflow Script');
        
    } catch (error) {
        logError(`予期しないエラーが発生しました: ${error.message}`);
        sendBastionWorkflowCompletionNotification('false', 'Bastionホスト管理ワークフロー');
        scriptExit(1, 'Bastion Workflow Script');
    }
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    main,
    checkPrerequisites,
    checkPrerequisitesDeployment,
    checkNetwork,
    deployBastion,
    checkBastion
};