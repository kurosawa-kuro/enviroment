#!/usr/bin/env node

// =============================================================================
// Basic Infrastructure Deployment Workflow Script (Steps 1-3) - Refactored
// =============================================================================
// このスクリプトは基盤インフラ（前提条件、IAMロール、ネットワーク）のみをデプロイします
// 01-prerequisites.yaml, 02-iam-role.yaml, 03-network.yamlの3つのテンプレート専用
// =============================================================================

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 共通モジュール (関数ベース)
const { logInfo, logError, logSuccess, logWarning, logStep, logStart } = require('../common/write-log');
const { printSuccess } = require('../common/display-colors');
const { executeAwsCommand } = require('../common/manage-aws');
const { sendEksWorkflowCompletionNotification } = require('../common/notify-discord');
const yamlConfig = require('../common/read-config');

// スクリプトのパス設定
const SCRIPT_DIR = __dirname;
const WORK_DIR = path.resolve(SCRIPT_DIR, '../..');
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../../../..');

// グローバル設定
const basicConfig = yamlConfig.getBasicConfig();
const s3Config = yamlConfig.getS3Config();

// ユーティリティ関数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 時間推定表示（簡略化）
function showTimeEstimation(stacks) {
    const totalMinutes = stacks.reduce((sum, stack) => {
        return sum + yamlConfig.getTimeEstimation(stack);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const completionTime = new Date(Date.now() + totalMinutes * 60000);
    
    console.log('=========================================');
    console.log('デプロイ時間推定');
    console.log('=========================================');
    console.log(`対象スタック: ${stacks.join(', ')}`);
    console.log(`所要時間: ${hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`}`);
    console.log(`完了予定: ${completionTime.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}`);
    console.log('=========================================');
    console.log('');
}

// 進捗表示（簡略化）
function showProgress(completedStacks) {
    const total = 3; // prerequisites, iam-role, network
    const completed = completedStacks.length;
    const percent = Math.round((completed / total) * 100);
    
    console.log('----------------------------------------');
    console.log(`進捗: [${completed}/${total}] ${percent}% - ${completedStacks.join(', ')}`);
    console.log('----------------------------------------');
}

/**
 * Make コマンドを実行
 * @param {string} target - Make ターゲット
 * @param {string} description - 実行説明
 * @returns {Promise<void>}
 */
async function executeMakeCommand(target, description) {
    logInfo(`実行中: ${description}`);
    
    return new Promise((resolve, reject) => {
        const make = spawn('make', [target], {
            cwd: WORK_DIR,
            stdio: 'pipe',
            shell: true
        });
        
        make.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(output);
            }
        });
        
        make.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.error(output);
            }
        });
        
        make.on('close', (code) => {
            if (code === 0) {
                logSuccess(`${description} が完了しました`);
                resolve();
            } else {
                logError(`${description} が失敗しました (exit code: ${code})`);
                reject(new Error(`Make command failed with code ${code}`));
            }
        });
        
        make.on('error', (error) => {
            logError(`コマンド実行エラー: ${error.message}`);
            reject(error);
        });
    });
}

/**
 * S3バケットの利用可能性を確認
 * @param {string} bucketName - バケット名
 * @param {number} maxRetries - 最大リトライ回数
 * @returns {Promise<boolean>}
 */
async function waitForS3Bucket(bucketName, maxRetries = 10) {
    const region = basicConfig.AwsRegion;
    
    logInfo(`ℹ Processing bucket: ${bucketName}`);
    
    for (let i = 1; i <= maxRetries; i++) {
        try {
            // より直接的なS3 ls コマンドを使用
            const { execSync } = require('child_process');
            const result = execSync(`aws s3 ls s3://${bucketName} --region ${region}`, { 
                encoding: 'utf8', 
                stdio: 'pipe' 
            });
            
            logSuccess(`S3バケット ${bucketName} が利用可能です`);
            return true;
            
        } catch (error) {
            // デバッグ情報を表示（最初の試行時のみ）
            if (i === 1) {
                logWarning(`⚠ Bucket ${bucketName} not found or not accessible`);
            }
        }
        
        if (i === maxRetries) {
            logWarning(`S3バケット ${bucketName} の確認をタイムアウトしました`);
            return false;
        }
        
        if (i < maxRetries) {
            console.log(`S3バケット確認中... (${i}/${maxRetries})`);
            await sleep(3000);
        }
    }
    
    return false;
}

/**
 * スクリプトをS3にアップロード
 */
async function uploadScriptsToS3() {
    const uploadScriptPath = path.join(WORK_DIR, 'scripts/upload/01-upload-s3.js');
    
    if (!fs.existsSync(uploadScriptPath)) {
        logWarning(`アップロードスクリプトが見つかりません: ${uploadScriptPath}`);
        return;
    }
    
    logInfo('S3バケットに必要なスクリプトをアップロード中...');
    
    return new Promise((resolve, reject) => {
        const upload = spawn('node', [uploadScriptPath], {
            cwd: WORK_DIR,
            stdio: 'pipe'
        });
        
        upload.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) console.log(output);
        });
        
        upload.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output) console.error(output);
        });
        
        upload.on('close', (code) => {
            if (code === 0) {
                logSuccess('S3バケットへのスクリプトアップロードが完了しました');
                resolve();
            } else {
                logWarning('S3バケットへのスクリプトアップロードに失敗しました');
                resolve(); // 失敗しても処理を継続
            }
        });
        
        upload.on('error', (error) => {
            logWarning(`スクリプトアップロードエラー: ${error.message}`);
            resolve(); // エラーでも処理を継続
        });
    });
}

/**
 * 古いリソースのクリーンアップ
 */
async function cleanupOldResources() {
    logStep('[1/6] 古いリソースのクリーンアップ');
    
    try {
        await executeMakeCommand('cleanup-resources', 'リソースクリーンアップ');
    } catch (error) {
        logWarning('クリーンアップでエラーが発生しましたが処理を継続します');
    }
}

/**
 * 前提条件のデプロイ
 */
async function deployPrerequisites() {
    logStep('[2/6] 前提条件のデプロイ');
    
    const startTime = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    const estimatedMinutes = yamlConfig.getTimeEstimation('prerequisites');
    const completionTime = new Date(Date.now() + estimatedMinutes * 60000)
        .toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    
    console.log('----------------------------------------');
    console.log('スタック: prerequisites');
    console.log(`開始時刻: ${startTime}`);
    console.log(`所要時間: 約${estimatedMinutes}分`);
    console.log(`完了予定: ${completionTime}`);
    console.log('----------------------------------------');
    
    await executeMakeCommand('deploy-01-prerequisites', '前提条件スタックをデプロイ');
    
    // S3バケット作成の確認とスクリプトアップロード
    const bucketName = `${s3Config.BucketPrefix}-${basicConfig.Environment}-${basicConfig.AwsRegion}`;
    await waitForS3Bucket(bucketName);
    await uploadScriptsToS3();
}

/**
 * 前提条件の確認
 */
async function checkPrerequisites() {
    logStep('[3/6] 前提条件の確認');
    
    await executeMakeCommand('check-01-prerequisites', '前提条件スタックの状態を確認');
    showProgress(['prerequisites']);
}

/**
 * IAMロールのデプロイ
 */
async function deployIamRole() {
    logStep('[4/6] IAMロールのデプロイ');
    
    const estimatedMinutes = yamlConfig.getTimeEstimation('iam-role');
    const completionTime = new Date(Date.now() + estimatedMinutes * 60000)
        .toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    
    console.log(`IAMロール デプロイ開始 - 完了予定: ${completionTime}`);
    
    await executeMakeCommand('deploy-02-iam-role', 'IAMロールスタックをデプロイ');
}

/**
 * IAMロールの確認
 */
async function checkIamRole() {
    logStep('[5/6] IAMロールの確認');
    
    await executeMakeCommand('check-02-iam-role', 'IAMロールスタックの状態を確認');
    showProgress(['prerequisites', 'iam-role']);
}

/**
 * ネットワークのデプロイと確認
 */
async function deployAndCheckNetwork() {
    logStep('[6/6] ネットワークのデプロイ');
    
    const estimatedMinutes = yamlConfig.getTimeEstimation('network');
    const completionTime = new Date(Date.now() + estimatedMinutes * 60000)
        .toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    
    console.log(`ネットワーク デプロイ開始 - 完了予定: ${completionTime}`);
    
    await executeMakeCommand('deploy-03-network', 'ネットワークスタックをデプロイ');
    await executeMakeCommand('check-03-network', 'ネットワークスタックの状態を確認');
    
    showProgress(['prerequisites', 'iam-role', 'network']);
    console.log('');
    printSuccess('基盤インフラ（前提条件、IAMロール、ネットワーク）のデプロイが完了しました！');
    console.log('');
}

/**
 * 前提条件チェック
 */
function checkSystemPrerequisites() {
    logInfo('システム前提条件をチェック中...');
    
    try {
        execSync('aws --version', { stdio: 'pipe' });
        execSync('yq --version', { stdio: 'pipe' });
        execSync('make --version', { stdio: 'pipe' });
        execSync('node --version', { stdio: 'pipe' });
        
        logSuccess('システム前提条件チェックが完了しました');
        return true;
    } catch (error) {
        logError('必要なツールがインストールされていません (aws, yq, make, node)');
        return false;
    }
}

/**
 * メイン処理
 */
async function main() {
    let exitCode = 0;
    
    try {
        // 初期化とログ開始
        process.chdir(WORK_DIR);
        logStart('Basic Infrastructure Deployment Workflow Script (Steps 1-3)');
        logInfo(`作業ディレクトリ: ${WORK_DIR}`);
        logInfo(`プロジェクト名: ${basicConfig.ProjectName}`);
        logInfo(`環境: ${basicConfig.Environment}`);
        logInfo(`AWSリージョン: ${basicConfig.AwsRegion}`);
        
        // 時間推定表示
        showTimeEstimation(['prerequisites', 'iam-role', 'network']);
        
        // システム前提条件チェック
        if (!checkSystemPrerequisites()) {
            throw new Error('システム前提条件チェックに失敗しました');
        }
        
        // ワークフロー実行
        await cleanupOldResources();
        await deployPrerequisites();
        await checkPrerequisites();
        await deployIamRole();
        await checkIamRole();
        await deployAndCheckNetwork();
        
        // 成功通知
        sendEksWorkflowCompletionNotification('true', '基盤インフラ構築ワークフロー（Steps 1-3）');
        logSuccess('ワークフローが正常に完了しました');
        
    } catch (error) {
        exitCode = 1;
        logError(`ワークフロー実行エラー: ${error.message}`);
        
        // エラー通知
        sendEksWorkflowCompletionNotification('false', '基盤インフラ構築ワークフロー（Steps 1-3）');
    }
    
    process.exit(exitCode);
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled Rejection: ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logError(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = { main };