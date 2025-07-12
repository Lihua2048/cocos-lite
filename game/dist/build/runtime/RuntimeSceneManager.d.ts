import { SceneData } from '../../core/types';
/**
 * 游戏运行时场景管理器
 * 纯运行时版本，不依赖编辑器 Redux 状态
 */
export declare class RuntimeSceneManager {
    private scenes;
    private currentSceneId;
    private onSceneChangeCallback?;
    constructor(scenesData: SceneData[]);
    /**
     * 获取第一个场景
     */
    getFirstScene(): SceneData | null;
    /**
     * 加载场景
     */
    loadScene(sceneId: string): boolean;
    /**
     * 获取当前场景
     */
    getCurrentScene(): SceneData | null;
    /**
     * 获取当前场景的实体列表
     */
    getCurrentEntities(): any[];
    /**
     * 获取当前场景的动画数据
     */
    getCurrentAnimations(): any;
    /**
     * 设置场景切换回调
     */
    setOnSceneChange(callback: (sceneId: string) => void): void;
    /**
     * 获取所有场景列表
     */
    getAllScenes(): SceneData[];
    /**
     * 根据名称查找场景
     */
    findSceneByName(name: string): SceneData | null;
}
export default RuntimeSceneManager;
