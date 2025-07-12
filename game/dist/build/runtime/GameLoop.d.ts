/**
 * 游戏主循环
 * 负责渲染和物理模拟的同步更新
 */
export declare class GameLoop {
    private renderer;
    private physics;
    private sceneManager;
    private isRunning;
    private animationId;
    private lastTime;
    private deltaTime;
    constructor(renderer: any, physics: any, sceneManager: any);
    /**
     * 开始游戏循环
     */
    start(): void;
    /**
     * 停止游戏循环
     */
    stop(): void;
    /**
     * 主循环逻辑
     */
    private loop;
    /**
     * 更新物理世界
     */
    private updatePhysics;
    /**
     * 更新游戏逻辑
     */
    private updateGameLogic;
    /**
     * 更新实体动画
     */
    private updateEntityAnimation;
    /**
     * 同步物理体位置到实体
     */
    private syncPhysicsToEntity;
    /**
     * 渲染场景
     */
    private render;
    /**
     * 获取当前 FPS
     */
    getFPS(): number;
    /**
     * 获取游戏运行状态
     */
    isGameRunning(): boolean;
}
export default GameLoop;
