/**
 * Time Estimation Module - 時間推定機能を提供
 */

class TimeEstimation {
    constructor(logger) {
        this.logger = logger;
        this.stackTimings = {
            'prerequisites': { minutes: 2, description: '前提条件（S3, ECR, KMS）' },
            'iam-role': { minutes: 1, description: 'IAMロール' },
            'network': { minutes: 3, description: 'ネットワーク（VPC, Subnet, IGW, NAT）' },
            'alb': { minutes: 2, description: 'Application Load Balancer' },
            'eks': { minutes: 15, description: 'EKSクラスター' },
            'bastion': { minutes: 2, description: '踏み台サーバー' },
            'cleanup': { minutes: 1, description: 'クリーンアップ' }
        };
        
        this.startTimes = {};
        this.completedStacks = new Set();
    }

    /**
     * 時間推定の表示
     * @param {Array<string>} stacks - スタック名の配列
     */
    showTimeEstimation(stacks) {
        console.log('');
        this.logger.logInfo('📊 デプロイ時間の推定:');
        console.log('');
        
        let totalMinutes = 0;
        
        for (const stack of stacks) {
            if (this.stackTimings[stack]) {
                const timing = this.stackTimings[stack];
                console.log(`  • ${timing.description}: 約${timing.minutes}分`);
                totalMinutes += timing.minutes;
            }
        }
        
        console.log('');
        console.log(`  合計推定時間: 約${totalMinutes}分`);
        console.log('');
    }

    /**
     * スタックのタイミング表示
     * @param {string} stack - スタック名
     */
    showStackTiming(stack) {
        if (this.stackTimings[stack]) {
            const timing = this.stackTimings[stack];
            this.logger.logInfo(`⏱️  推定時間: 約${timing.minutes}分`);
            this.startTimes[stack] = Date.now();
        }
    }

    /**
     * 進捗状況の表示
     * @param {Array<string>} completedStacks - 完了したスタック
     */
    showProgress(completedStacks) {
        console.log('');
        this.logger.logInfo('📈 進捗状況:');
        
        for (const stack of completedStacks) {
            this.completedStacks.add(stack);
            if (this.stackTimings[stack]) {
                const timing = this.stackTimings[stack];
                const elapsed = this.startTimes[stack] 
                    ? Math.round((Date.now() - this.startTimes[stack]) / 60000)
                    : 0;
                console.log(`  ✅ ${timing.description}: 完了 (${elapsed}分経過)`);
            }
        }
        
        console.log('');
    }

    /**
     * 残り時間の表示
     * @param {Array<string>} completedStacks - 完了したスタック
     */
    showRemainingTime(completedStacks) {
        const allStacks = Object.keys(this.stackTimings);
        const remainingStacks = allStacks.filter(s => !completedStacks.includes(s));
        
        if (remainingStacks.length > 0) {
            let remainingMinutes = 0;
            
            for (const stack of remainingStacks) {
                if (this.stackTimings[stack]) {
                    remainingMinutes += this.stackTimings[stack].minutes;
                }
            }
            
            if (remainingMinutes > 0) {
                this.logger.logInfo(`⏳ 推定残り時間: 約${remainingMinutes}分`);
            }
        }
    }

    /**
     * 実行時間の計測開始
     * @param {string} taskName - タスク名
     */
    startTimer(taskName) {
        this.startTimes[taskName] = Date.now();
    }

    /**
     * 実行時間の計測終了
     * @param {string} taskName - タスク名
     */
    endTimer(taskName) {
        if (this.startTimes[taskName]) {
            const elapsed = Date.now() - this.startTimes[taskName];
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            this.logger.logInfo(`⏱️  ${taskName} の実行時間: ${minutes}分${seconds}秒`);
            delete this.startTimes[taskName];
            
            return elapsed;
        }
        
        return 0;
    }

    /**
     * 全体の進捗率を計算
     * @param {Array<string>} completedStacks - 完了したスタック
     * @param {Array<string>} totalStacks - 全スタック
     */
    calculateProgress(completedStacks, totalStacks) {
        const progress = (completedStacks.length / totalStacks.length) * 100;
        return Math.round(progress);
    }

    /**
     * 進捗バーの表示
     * @param {number} progress - 進捗率（0-100）
     */
    showProgressBar(progress) {
        const barLength = 30;
        const filled = Math.round((progress / 100) * barLength);
        const empty = barLength - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        console.log(`  進捗: [${bar}] ${progress}%`);
    }
}

module.exports = { TimeEstimation };