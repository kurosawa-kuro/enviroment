#!/usr/bin/env node

// =============================================================================
// Logging Common Functions
// =============================================================================
// このファイルはログ機能の共通関数を提供します
// =============================================================================

const fs = require('fs');
const path = require('path');

// ログファイルの設定
let LOG_FILE = "";

// ログファイルを設定する関数
function setLogFile(logFile) {
    LOG_FILE = logFile;
    // ログディレクトリを作成
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
}

// タイムスタンプを取得する関数
function getTimestamp() {
    return new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-').replace(/,/g, '');
}

// ログをファイルに書き込む関数
function writeToLogFile(level, timestamp, message) {
    if (LOG_FILE) {
        try {
            const logEntry = `[${level}] ${timestamp} - ${message}\n`;
            fs.appendFileSync(LOG_FILE, logEntry);
        } catch (error) {
            // ログファイルへの書き込みエラーは無視（無限ループを避けるため）
        }
    }
}

// 色付きログ関数
function logInfo(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[32m[INFO]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('INFO', timestamp, message);
}

function logWarn(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[33m[WARN]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('WARN', timestamp, message);
}

function logError(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[31m[ERROR]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('ERROR', timestamp, message);
}

function logStep(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[36m[STEP]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('STEP', timestamp, message);
}

function logDebug(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[35m[DEBUG]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('DEBUG', timestamp, message);
}

// セクション区切りログ
function logSection(message) {
    const timestamp = getTimestamp();
    const separator = "=========================================";
    
    console.log('');
    console.log('\x1b[34m' + separator + '\x1b[0m');
    console.log('\x1b[34m' + message + '\x1b[0m');
    console.log('\x1b[34m' + separator + '\x1b[0m');
    console.log('');
    
    // ログファイルが設定されている場合はファイルにも出力
    if (LOG_FILE) {
        try {
            const logEntry = `\n${separator}\n${message}\n${separator}\n\n`;
            fs.appendFileSync(LOG_FILE, logEntry);
        } catch (error) {
            // ログファイルへの書き込みエラーは無視
        }
    }
}

// 開始ログ
function logStart(scriptName) {
    logSection(`${scriptName} Started`);
}

// 完了ログ
function logComplete(scriptName, success) {
    if (success === 'true' || success === true) {
        logSection(`${scriptName} Completed Successfully`);
    } else {
        logSection(`${scriptName} Failed`);
    }
}

// 成功ログ（色付きの成功メッセージ）
function logSuccess(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[32m[SUCCESS]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('SUCCESS', timestamp, message);
}

// 警告ログ（logWarnと同じだが別名で提供）
function logWarning(message) {
    logWarn(message);
}

// ハイライトログ
function logHighlight(message) {
    const timestamp = getTimestamp();
    const coloredMessage = '\x1b[36m[HIGHLIGHT]\x1b[0m ' + timestamp + ' - ' + message;
    
    console.log(coloredMessage);
    
    // ログファイルが設定されている場合はファイルにも出力
    writeToLogFile('HIGHLIGHT', timestamp, message);
}

// ファイルログ専用（コンソール出力なし）
function logToFileOnly(level, message) {
    const timestamp = getTimestamp();
    writeToLogFile(level, timestamp, message);
}

// ログレベルチェック機能
let LOG_LEVEL = 'INFO'; // DEBUG, INFO, WARN, ERROR

function setLogLevel(level) {
    LOG_LEVEL = level.toUpperCase();
}

function shouldLog(level) {
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] >= levels[LOG_LEVEL];
}

// レベル付きログ関数
function logWithLevel(level, message) {
    if (!shouldLog(level)) return;
    
    switch (level) {
        case 'DEBUG':
            logDebug(message);
            break;
        case 'INFO':
            logInfo(message);
            break;
        case 'WARN':
            logWarn(message);
            break;
        case 'ERROR':
            logError(message);
            break;
        default:
            logInfo(message);
    }
}

// =============================================================================
// Export Functions
// =============================================================================

module.exports = {
    // Core logging functions
    logInfo,
    logWarn,
    logError,
    logStep,
    logDebug,
    logSuccess,
    logWarning,
    logHighlight,
    
    // Section functions
    logSection,
    logStart,
    logComplete,
    
    // File management
    setLogFile,
    logToFileOnly,
    
    // Log level management
    setLogLevel,
    logWithLevel,
    
    // Utility functions
    getTimestamp,
    writeToLogFile,
    
    // Global variable access
    get LOG_FILE() { return LOG_FILE; }
};