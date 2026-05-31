#!/usr/bin/env node

// =============================================================================
// Discord Notification Common Functions
// =============================================================================
// このファイルはDiscord通知機能の共通関数を提供します
// =============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const util = require('util');

// Discord Webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

// ログ関数（外部から提供される場合に使用）
function logInfo(message) {
    const timestamp = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '');
    console.log('\x1b[32m[INFO]\x1b[0m ' + timestamp + ' - ' + message);
}

function logWarn(message) {
    const timestamp = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '');
    console.log('\x1b[33m[WARN]\x1b[0m ' + timestamp + ' - ' + message);
}

function logStep(message) {
    const timestamp = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'}).replace(/\//g, '-').replace(/,/g, '');
    console.log('\x1b[36m[STEP]\x1b[0m ' + timestamp + ' - ' + message);
}

// Get configuration from config.yaml
function getDiscordConfig() {
    const scriptDir = path.dirname(__filename);
    const configFile = path.join(scriptDir, '../../config.yaml');
    
    let Environment = 'learning';
    let AwsRegion = 'ap-northeast-1';
    let CLUSTER_NAME = 'eks-platform';
    
    if (fs.existsSync(configFile)) {
        try {
            Environment = execSync(`yq eval '.basic.Environment' "${configFile}" 2>/dev/null || echo "learning"`, { encoding: 'utf8' }).trim();
            AwsRegion = execSync(`yq eval '.basic.AwsRegion' "${configFile}" 2>/dev/null || echo "ap-northeast-1"`, { encoding: 'utf8' }).trim();
            CLUSTER_NAME = execSync(`yq eval '.basic.cluster_name' "${configFile}" 2>/dev/null || echo "eks-platform"`, { encoding: 'utf8' }).trim();
        } catch (error) {
            // Use default values if yq fails
        }
    }
    
    return { Environment, AwsRegion, CLUSTER_NAME };
}

// Discord通知送信関数
// 引数: status - ステータス (✅, ❌, ⚠️ など)
//       message - メッセージ
//       color - 色コード (10進数)
//       titlePrefix - タイトルプレフィックス (オプション)
function sendDiscordNotification(status, message, color, titlePrefix = '') {
    // Get configuration values
    const config = getDiscordConfig();
    
    // タイトルを構築
    const title = titlePrefix + status;

    if (!DISCORD_WEBHOOK_URL) {
        logWarn('DISCORD_WEBHOOK_URL が未設定のため Discord 通知をスキップします');
        return;
    }
    
    logStep('Discord通知を送信');
    
    const timestamp = new Date().toISOString();
    const embedData = JSON.stringify({
        embeds: [{
            title: title,
            description: message,
            color: color,
            fields: [
                {
                    name: "Environment",
                    value: config.Environment,
                    inline: true
                },
                {
                    name: "Region", 
                    value: config.AwsRegion,
                    inline: true
                },
                {
                    name: "Cluster",
                    value: config.CLUSTER_NAME,
                    inline: true
                }
            ],
            timestamp: timestamp
        }]
    });
    
    try {
        execSync(`curl -H "Content-Type: application/json" -X POST -d '${embedData}' "${DISCORD_WEBHOOK_URL}"`, 
                 { stdio: 'pipe' });
        logInfo('Discord通知送信完了');
    } catch (error) {
        logWarn('Discord通知送信に失敗しました');
    }
}

// 成功通知のショートカット関数
function sendSuccessNotification(message, titlePrefix = '') {
    sendDiscordNotification('✅', message, 3066993, titlePrefix);
}

// エラー通知のショートカット関数
function sendErrorNotification(message, titlePrefix = '') {
    sendDiscordNotification('❌', message, 15158332, titlePrefix);
}

// 警告通知のショートカット関数
function sendWarningNotification(message, titlePrefix = '') {
    sendDiscordNotification('⚠️', message, 16776960, titlePrefix);
}

// 情報通知のショートカット関数
function sendInfoNotification(message, titlePrefix = '') {
    sendDiscordNotification('ℹ️', message, 3447003, titlePrefix);
}

// EKSワークフロー完了通知の専用関数
function sendEksWorkflowCompletionNotification(success, workflowType) {
    if (success === 'true' || success === true) {
        sendSuccessNotification(`${workflowType}が正常に完了しました`, 'EKS Workflow ');
    } else {
        sendErrorNotification(`${workflowType}中にエラーが発生しました`, 'EKS Workflow ');
    }
}

// EKSクラスター破棄完了通知の専用関数
function sendEksDestructionCompletionNotification(success) {
    if (success === 'true' || success === true) {
        sendSuccessNotification('EKSクラスターの破棄が正常に完了しました', 'EKS Cluster Destruction ');
    } else {
        sendErrorNotification('EKSクラスターの破棄中にエラーが発生しました', 'EKS Cluster Destruction ');
    }
}

// ALBワークフロー完了通知の専用関数
function sendAlbWorkflowCompletionNotification(success, workflowType) {
    if (success === 'true' || success === true) {
        sendSuccessNotification(`${workflowType}が正常に完了しました`, 'ALB Workflow ');
    } else {
        sendErrorNotification(`${workflowType}中にエラーが発生しました`, 'ALB Workflow ');
    }
}

// =============================================================================
// Original Class-based Implementation (for backward compatibility)
// =============================================================================

class DiscordNotification {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.webhookUrl = this.getWebhookUrl();
        this.enabled = !!this.webhookUrl;
    }

    /**
     * WebhookURLの取得
     */
    getWebhookUrl() {
        // 環境変数から取得
        const envUrl = process.env.DISCORD_WEBHOOK_URL;
        if (envUrl) {
            return envUrl;
        }
        
        // 設定ファイルから取得
        try {
            return this.config.get('notifications.discord.webhookUrl');
        } catch {
            return null;
        }
    }

    /**
     * Discord Embedメッセージの作成
     * @param {string} title - タイトル
     * @param {string} description - 説明
     * @param {string} color - カラーコード
     * @param {Array} fields - フィールド配列
     */
    createEmbed(title, description, color = '3447003', fields = []) {
        const embed = {
            title,
            description,
            color: parseInt(color, 16),
            timestamp: new Date().toISOString(),
            footer: {
                text: 'AWS EKS Infrastructure Deployment'
            }
        };

        if (fields.length > 0) {
            embed.fields = fields;
        }

        return embed;
    }

    /**
     * Discordにメッセージを送信
     * @param {object} payload - ペイロード
     */
    async sendMessage(payload) {
        if (!this.enabled) {
            this.logger.logInfo('Discord通知が無効化されています');
            return true;
        }

        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload);
            const url = new URL(this.webhookUrl);
            
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        this.logger.logSuccess('Discord通知を送信しました');
                        resolve(true);
                    } else {
                        this.logger.logError(`Discord通知エラー: ${res.statusCode} - ${responseData}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                this.logger.logError(`Discord通知送信エラー: ${error.message}`);
                resolve(false);
            });

            req.write(data);
            req.end();
        });
    }

    /**
     * ワークフロー完了通知
     * @param {boolean} success - 成功フラグ
     * @param {string} workflowName - ワークフロー名
     * @param {object} details - 詳細情報
     */
    async sendWorkflowCompletionNotification(success, workflowName, details = {}) {
        if (!this.enabled) {
            return true;
        }

        const color = success ? '00FF00' : 'FF0000'; // 緑 or 赤
        const title = success 
            ? `✅ ${workflowName} が完了しました`
            : `❌ ${workflowName} が失敗しました`;
        
        const description = success
            ? 'すべてのステップが正常に完了しました。'
            : 'エラーが発生しました。ログを確認してください。';

        const fields = [
            {
                name: '環境',
                value: this.config.get('basic.Environment') || 'dev',
                inline: true
            },
            {
                name: 'リージョン',
                value: this.config.get('basic.AwsRegion') || 'ap-northeast-1',
                inline: true
            },
            {
                name: '実行時刻',
                value: new Date().toLocaleString('ja-JP'),
                inline: true
            }
        ];

        // 詳細情報があれば追加
        if (details.executionTime) {
            fields.push({
                name: '実行時間',
                value: `${Math.round(details.executionTime / 60000)}分`,
                inline: true
            });
        }

        if (details.stacks && details.stacks.length > 0) {
            fields.push({
                name: 'デプロイされたスタック',
                value: details.stacks.join('\n'),
                inline: false
            });
        }

        if (!success && details.error) {
            fields.push({
                name: 'エラー詳細',
                value: details.error.substring(0, 1000), // 制限
                inline: false
            });
        }

        const embed = this.createEmbed(title, description, color, fields);
        const payload = { embeds: [embed] };

        return await this.sendMessage(payload);
    }

    /**
     * エラー通知
     * @param {string} title - タイトル
     * @param {Error} error - エラーオブジェクト
     * @param {object} context - コンテキスト情報
     */
    async sendErrorNotification(title, error, context = {}) {
        if (!this.enabled) {
            return true;
        }

        const fields = [
            {
                name: 'エラーメッセージ',
                value: error.message.substring(0, 1000),
                inline: false
            }
        ];

        if (error.stack) {
            fields.push({
                name: 'スタックトレース',
                value: error.stack.substring(0, 1000),
                inline: false
            });
        }

        // コンテキスト情報を追加
        Object.keys(context).forEach(key => {
            if (context[key] && typeof context[key] === 'string') {
                fields.push({
                    name: key,
                    value: context[key].substring(0, 1000),
                    inline: true
                });
            }
        });

        const embed = this.createEmbed(title, 'エラーが発生しました', 'FF0000', fields);
        const payload = { embeds: [embed] };

        return await this.sendMessage(payload);
    }

    /**
     * 進捗通知
     * @param {string} stepName - ステップ名
     * @param {number} currentStep - 現在のステップ
     * @param {number} totalSteps - 総ステップ数
     * @param {string} status - ステータス
     */
    async sendProgressNotification(stepName, currentStep, totalSteps, status = 'running') {
        if (!this.enabled) {
            return true;
        }

        const progress = Math.round((currentStep / totalSteps) * 100);
        const color = status === 'completed' ? '00FF00' : '0099FF'; // 緑 or 青
        
        const title = status === 'completed' 
            ? `✅ ${stepName} が完了しました`
            : `⏳ ${stepName} を実行中...`;

        const description = `進捗: ${currentStep}/${totalSteps} (${progress}%)`;

        const fields = [
            {
                name: '現在のステップ',
                value: stepName,
                inline: true
            },
            {
                name: '進捗率',
                value: `${progress}%`,
                inline: true
            }
        ];

        const embed = this.createEmbed(title, description, color, fields);
        const payload = { embeds: [embed] };

        return await this.sendMessage(payload);
    }

    /**
     * カスタム通知
     * @param {string} title - タイトル
     * @param {string} message - メッセージ
     * @param {string} type - タイプ (info, success, warning, error)
     */
    async sendCustomNotification(title, message, type = 'info') {
        if (!this.enabled) {
            return true;
        }

        const colors = {
            info: '0099FF',    // 青
            success: '00FF00', // 緑  
            warning: 'FFAA00', // オレンジ
            error: 'FF0000'    // 赤
        };

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const color = colors[type] || colors.info;
        const icon = icons[type] || icons.info;

        const embed = this.createEmbed(`${icon} ${title}`, message, color);
        const payload = { embeds: [embed] };

        return await this.sendMessage(payload);
    }
}

// =============================================================================
// Export Functions  
// =============================================================================

module.exports = {
    // Constants
    DISCORD_WEBHOOK_URL,
    
    // Logging functions
    logInfo,
    logWarn,
    logStep,
    
    // Configuration
    getDiscordConfig,
    
    // Core notification functions
    sendDiscordNotification,
    sendSuccessNotification,
    sendErrorNotification,
    sendWarningNotification,
    sendInfoNotification,
    
    // Workflow-specific notifications
    sendEksWorkflowCompletionNotification,
    sendEksDestructionCompletionNotification,
    sendAlbWorkflowCompletionNotification,
    
    // Class-based implementation (for backward compatibility)
    DiscordNotification
};
