/**
 * Utils Module - ユーティリティ機能を提供
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class Utils {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * スリープ関数
     * @param {number} ms - ミリ秒
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * ファイルの存在確認
     * @param {string} filePath - ファイルパス
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * ディレクトリの作成
     * @param {string} dirPath - ディレクトリパス
     */
    async createDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            this.logger.logError(`ディレクトリ作成エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * JSONファイルの読み込み
     * @param {string} filePath - ファイルパス
     */
    async readJsonFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            this.logger.logError(`JSONファイル読み込みエラー: ${error.message}`);
            return null;
        }
    }

    /**
     * JSONファイルの書き込み
     * @param {string} filePath - ファイルパス
     * @param {object} data - データ
     */
    async writeJsonFile(filePath, data) {
        try {
            const content = JSON.stringify(data, null, 2);
            await fs.writeFile(filePath, content, 'utf8');
            return true;
        } catch (error) {
            this.logger.logError(`JSONファイル書き込みエラー: ${error.message}`);
            return false;
        }
    }

    /**
     * コマンドの実行
     * @param {string} command - コマンド
     * @param {object} options - オプション
     */
    executeCommand(command, options = {}) {
        try {
            const result = execSync(command, {
                encoding: 'utf8',
                cwd: options.cwd || process.cwd(),
                ...options
            });
            return { success: true, output: result.trim() };
        } catch (error) {
            return { 
                success: false, 
                output: error.stdout ? error.stdout.toString() : '',
                error: error.message 
            };
        }
    }

    /**
     * 環境変数の取得
     * @param {string} name - 環境変数名
     * @param {string} defaultValue - デフォルト値
     */
    getEnv(name, defaultValue = '') {
        return process.env[name] || defaultValue;
    }

    /**
     * プロセスの存在確認
     * @param {number} pid - プロセスID
     */
    isProcessRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 並列実行
     * @param {Array<Function>} tasks - タスク配列
     */
    async runParallel(tasks) {
        try {
            const results = await Promise.all(tasks.map(task => task()));
            return { success: true, results };
        } catch (error) {
            this.logger.logError(`並列実行エラー: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 順次実行
     * @param {Array<Function>} tasks - タスク配列
     */
    async runSequential(tasks) {
        const results = [];
        
        for (const task of tasks) {
            try {
                const result = await task();
                results.push(result);
            } catch (error) {
                this.logger.logError(`順次実行エラー: ${error.message}`);
                throw error;
            }
        }
        
        return results;
    }

    /**
     * リトライ付き実行
     * @param {Function} fn - 実行する関数
     * @param {number} maxRetries - 最大リトライ回数
     * @param {number} delay - リトライ間隔（ミリ秒）
     */
    async retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                this.logger.logWarning(`リトライ ${i + 1}/${maxRetries}: ${error.message}`);
                
                if (i < maxRetries - 1) {
                    await this.sleep(delay * Math.pow(2, i)); // 指数バックオフ
                }
            }
        }
        
        throw lastError;
    }

    /**
     * タイムアウト付き実行
     * @param {Function} fn - 実行する関数
     * @param {number} timeout - タイムアウト（ミリ秒）
     */
    async withTimeout(fn, timeout) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`タイムアウト: ${timeout}ms`)), timeout)
            )
        ]);
    }
}

module.exports = { Utils };