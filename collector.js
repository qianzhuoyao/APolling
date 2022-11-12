/**
 * 心跳检测
 */
 export class ACollector {
    constructor(time = 1000) {
        this.over = false;
        this.timer = undefined;
        this.time = 1000;
        this.tasks = [];
        this.preValue = undefined;
        this.pending = false;
        this.forInstance();
        ACollector.instance.time = time;
    }
    /**
     * 单例
     * @private
     */
    forInstance() {
        if (!ACollector.instance) {
            this.preValue = undefined;
            ACollector.instance = this;
        }
        return ACollector.instance;
    }
    /**
     * 收集待执行的任务
     * @param task
     * @private
     */
    collector(task) {
        ACollector.instance.tasks.push(task);
    }
    /**
     * 任务执行倒计时
     * @private
     */
    countDown() {
        ACollector.instance.timer = setTimeout(() => {
            if (!ACollector.instance.over) {
                ACollector.instance.tasks.map(i => {
                    if (typeof i === 'function') {
                        setTimeout(async () => {
                            ACollector.instance.preValue = await i.call(this, ACollector.instance.preValue);
                        }, 0);
                    }
                });
            }
            ACollector.instance.over = true;
            ACollector.instance.pending = false;
        }, ACollector.instance.time);
    }
    /**
     * 重置自动执行倒计时
     * @param time
     */
    setTimeCount(time) {
        if (ACollector.instance.isPending()) {
            throw new Error('dont change TimeOut in pending status');
        }
        ACollector.instance.time = time;
        return ACollector.instance;
    }
    /**
     * 当前任务是否执行完毕
     */
    isOver() {
        return this.over;
    }
    /**
     * 任务是否已经开始
     */
    isPending() {
        return this.pending;
    }
    /**
     * 开始注册任务
     * @param task
     */
    do(task) {
        ACollector.instance.pending = true;
        ACollector.instance.collector(task);
        clearTimeout(ACollector.instance.timer);
        ACollector.instance.countDown();
        return ACollector.instance;
    }
    /**
     * 重置结束状态
     */
    reset() {
        ACollector.instance.over = false;
        return ACollector.instance;
    }
    /**
     * 任务队列转化为任务栈
     */
    reverse() {
        if (ACollector.instance.isPending()) {
            throw new Error('dont change TimeOut in pending status');
        }
        ACollector.instance.tasks = ACollector.instance.tasks.reverse();
        return ACollector.instance;
    }
    /**
     * 清除任务
     */
    removeTasks() {
        if (ACollector.instance.isPending()) {
            throw new Error('dont change TimeOut in pending status');
        }
        ACollector.instance.tasks = [];
        return ACollector.instance;
    }
}