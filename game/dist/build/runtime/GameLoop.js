/**
 * 游戏主循环
 * 负责渲染和物理模拟的同步更新
 */
export class GameLoop {
    constructor(renderer, physics, sceneManager) {
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        /**
         * 主循环逻辑
         */
        this.loop = () => {
            if (!this.isRunning)
                return;
            const currentTime = performance.now();
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            try {
                // 更新物理世界
                this.updatePhysics(this.deltaTime);
                // 更新游戏逻辑
                this.updateGameLogic(this.deltaTime);
                // 渲染场景
                this.render();
            }
            catch (error) {
                console.error('游戏循环出错:', error);
            }
            // 请求下一帧
            this.animationId = requestAnimationFrame(this.loop);
        };
        this.renderer = renderer;
        this.physics = physics;
        this.sceneManager = sceneManager;
    }
    /**
     * 开始游戏循环
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
        console.log('游戏循环已启动');
    }
    /**
     * 停止游戏循环
     */
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('游戏循环已停止');
    }
    /**
     * 更新物理世界
     */
    updatePhysics(deltaTime) {
        if (this.physics && this.physics.step) {
            // 固定时间步长，避免物理不稳定
            const fixedTimeStep = 1 / 60; // 60 FPS
            this.physics.step(fixedTimeStep);
        }
    }
    /**
     * 更新游戏逻辑
     */
    updateGameLogic(deltaTime) {
        const entities = this.sceneManager.getCurrentEntities();
        entities.forEach((entity) => {
            // 更新实体动画
            if (entity.animation && entity.animation.playing) {
                this.updateEntityAnimation(entity, deltaTime);
            }
            // 同步物理体位置到实体
            this.syncPhysicsToEntity(entity);
        });
    }
    /**
     * 更新实体动画
     */
    updateEntityAnimation(entity, deltaTime) {
        if (!entity.animation || !entity.animation.playing)
            return;
        const animData = this.sceneManager.getCurrentAnimations();
        const currentAnimName = entity.animation.currentAnimation;
        const animation = animData[currentAnimName];
        if (!animation)
            return;
        // 更新动画时间
        entity.animation.currentTime += deltaTime / 1000; // 转换为秒
        // 检查动画是否结束
        const maxTime = Math.max(...animation.keyframes.map((kf) => kf.time));
        if (entity.animation.currentTime >= maxTime) {
            if (entity.animation.loop) {
                entity.animation.currentTime = 0; // 循环播放
            }
            else {
                entity.animation.playing = false; // 停止播放
            }
        }
    }
    /**
     * 同步物理体位置到实体
     */
    syncPhysicsToEntity(entity) {
        if (!this.physics || !entity.physicsBody)
            return;
        // 从物理体获取位置并同步到实体
        const physicsPos = this.physics.getBodyPosition(entity.physicsBody);
        if (physicsPos) {
            entity.position.x = physicsPos.x;
            entity.position.y = physicsPos.y;
        }
    }
    /**
     * 渲染场景
     */
    render() {
        if (!this.renderer)
            return;
        const entities = this.sceneManager.getCurrentEntities();
        const animations = this.sceneManager.getCurrentAnimations();
        // 构建实体动画状态
        const entityAnimationState = {};
        entities.forEach((entity) => {
            if (entity.animation) {
                entityAnimationState[entity.id] = {
                    currentAnimation: entity.animation.currentAnimation,
                    currentTime: entity.animation.currentTime
                };
            }
        });
        // 调用渲染器渲染
        this.renderer.render(entities, animations, entityAnimationState);
    }
    /**
     * 获取当前 FPS
     */
    getFPS() {
        return this.deltaTime > 0 ? Math.round(1000 / this.deltaTime) : 0;
    }
    /**
     * 获取游戏运行状态
     */
    isGameRunning() {
        return this.isRunning;
    }
}
export default GameLoop;
//# sourceMappingURL=GameLoop.js.map