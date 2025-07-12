import { SceneData } from '../../core/types';

/**
 * 游戏运行时场景管理器
 * 纯运行时版本，不依赖编辑器 Redux 状态
 */
export class RuntimeSceneManager {
  private scenes: Map<string, SceneData> = new Map();
  private currentSceneId: string | null = null;
  private onSceneChangeCallback?: (sceneId: string) => void;

  constructor(scenesData: SceneData[]) {
    // 加载所有场景数据
    scenesData.forEach(scene => {
      this.scenes.set(scene.id, scene);
    });
  }

  /**
   * 获取第一个场景
   */
  getFirstScene(): SceneData | null {
    const firstScene = Array.from(this.scenes.values())[0];
    return firstScene || null;
  }

  /**
   * 加载场景
   */
  loadScene(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      console.error(`Scene ${sceneId} not found`);
      return false;
    }

    this.currentSceneId = sceneId;

    if (this.onSceneChangeCallback) {
      this.onSceneChangeCallback(sceneId);
    }

    console.log(`Loaded scene: ${scene.name}`);
    return true;
  }

  /**
   * 获取当前场景
   */
  getCurrentScene(): SceneData | null {
    if (!this.currentSceneId) return null;
    return this.scenes.get(this.currentSceneId) || null;
  }

  /**
   * 获取当前场景的实体列表
   */
  getCurrentEntities(): any[] {
    const scene = this.getCurrentScene();
    if (!scene) return [];
    return Object.values(scene.entities);
  }

  /**
   * 获取当前场景的动画数据
   */
  getCurrentAnimations(): any {
    const scene = this.getCurrentScene();
    if (!scene) return {};
    return scene.animations || {};
  }

  /**
   * 设置场景切换回调
   */
  setOnSceneChange(callback: (sceneId: string) => void): void {
    this.onSceneChangeCallback = callback;
  }

  /**
   * 获取所有场景列表
   */
  getAllScenes(): SceneData[] {
    return Array.from(this.scenes.values());
  }

  /**
   * 根据名称查找场景
   */
  findSceneByName(name: string): SceneData | null {
    for (const scene of this.scenes.values()) {
      if (scene.name === name) {
        return scene;
      }
    }
    return null;
  }
}

export default RuntimeSceneManager;
