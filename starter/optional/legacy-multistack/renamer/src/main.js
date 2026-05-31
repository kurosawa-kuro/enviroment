const fs = require('fs');
const path = require('path');

// ==========================================
// Constants
// ==========================================
const TARGET_DIR = 'C:\\Users\\owner\\Downloads\\Video';
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.ts'];
const EXCLUDED_DIRS = [
    path.join(TARGET_DIR, 'snagit')
];

// ==========================================
// Data Structures
// ==========================================
/**
 * 動画ファイル情報の型定義
 * @typedef {Object} VideoFileInfo
 * @property {string} fullPath - ファイルの完全パス
 * @property {string} fileName - ファイル名
 * @property {string} extension - 拡張子
 * @property {number} size - ファイルサイズ（バイト）
 * @property {Date} createdTime - 作成日時
 * @property {Date} modifiedTime - 更新日時
 */

// ==========================================
// Utility Functions
// ==========================================
/**
 * ファイルが動画ファイルかどうかを判定する
 * @param {string} filePath - ファイルパス
 * @returns {boolean} 動画ファイルの場合true
 */
function isVideoFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * ディレクトリが除外対象かどうかを判定する
 * @param {string} dirPath - ディレクトリパス
 * @returns {boolean} 除外対象の場合true
 */
function isExcludedDir(dirPath) {
    return EXCLUDED_DIRS.some(excludedDir => 
        dirPath.toLowerCase() === excludedDir.toLowerCase()
    );
}

/**
 * ファイル情報を取得する
 * @param {string} filePath - ファイルパス
 * @returns {Promise<VideoFileInfo>} ファイル情報
 */
async function getFileInfo(filePath) {
    const stats = await fs.promises.stat(filePath);
    return {
        fullPath: filePath,
        fileName: path.basename(filePath),
        extension: path.extname(filePath).toLowerCase(),
        size: stats.size,
        createdTime: stats.birthtime,
        modifiedTime: stats.mtime,
        to: '',
        category: '',
    };
}

// ==========================================
// File System Operations
// ==========================================
/**
 * ディレクトリ内の動画ファイルを再帰的に検索する関数
 * @param {string} dirPath - 検索対象のディレクトリパス
 * @returns {Promise<VideoFileInfo[]>} 動画ファイル情報の配列
 */
async function searchVideoFiles(dirPath) {
    const videoFiles = [];
    try {
        // 除外対象ディレクトリの場合はスキップ
        if (isExcludedDir(dirPath)) {
            console.log(`除外対象ディレクトリをスキップします: ${dirPath}`);
            return videoFiles;
        }

        const items = await fs.promises.readdir(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stats = await fs.promises.stat(fullPath);

            if (stats.isDirectory()) {
                const subFiles = await searchVideoFiles(fullPath);
                videoFiles.push(...subFiles);
            } else if (isVideoFile(fullPath)) {
                const fileInfo = await getFileInfo(fullPath);
                videoFiles.push(fileInfo);
            }
        }
    } catch (error) {
        console.error(`検索中にエラーが発生しました: ${error.message}`);
    }
    return videoFiles;
}

/**
 * 動画ファイルを移動する関数
 * @param {VideoFileInfo} fileInfo - ファイル情報
 * @param {string} to - 移動先のディレクトリパス
 * @returns {Promise<void>}
 */
async function moveVideoFile(fileInfo, to) {
    try {
        if (!fs.existsSync(to)) {
            await fs.promises.mkdir(to, { recursive: true });
            console.log(`ディレクトリを作成しました: ${to}`);
        }

        const destinationPath = path.join(to, fileInfo.fileName);
        await fs.promises.rename(fileInfo.fullPath, destinationPath);
        console.log(`動画ファイルを移動しました: ${fileInfo.fullPath} -> ${destinationPath}`);
    } catch (error) {
        console.error(`ファイルの移動中にエラーが発生しました: ${error.message}`);
        throw error;
    }
}

// ==========================================
// Main Process
// ==========================================
/**
 * メイン処理を実行する関数
 */
async function main() {
    try {
        console.log('動画ファイルの検索を開始します...');
        const videoFiles = await searchVideoFiles(TARGET_DIR);
        
        if (videoFiles.length === 0) {
            console.log('動画ファイルが見つかりませんでした。');
            return;
        }

        // ファイル情報をJSON形式で表示
        console.log('\n検出された動画ファイル:');
        videoFiles.forEach(fileInfo => {
            console.log(JSON.stringify({
                fileName: fileInfo.fileName,
                extension: fileInfo.extension,
                size: `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB`,
                createdTime: fileInfo.createdTime.toLocaleString(),
                modifiedTime: fileInfo.modifiedTime.toLocaleString(),
                to: fileInfo.to,
                category: fileInfo.category,
            }, null, 2));
        });

        // 動画ファイルの移動
        // const destinationDir = path.join(TARGET_DIR, 'programming');
        // for (const fileInfo of videoFiles) {
        //     await moveVideoFile(fileInfo, destinationDir);
        // }

        console.log('\n処理が完了しました。');
        console.log(`合計 ${videoFiles.length} 個の動画ファイルを検出しました。`);
    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}

// スクリプトの実行
main();
