import { SceneConfig, SceneState, SceneRenderMode, SceneLayer } from '../../core/types';

/**
 * 场景组合器 - 负责多场景的渲染模式管理和场景组合
 */
export class SceneComposer {
  private activeScenes: Map<string, SceneConfig> = new Map();
  private sceneLayers: SceneLayer[] = [];
  private renderMode: SceneRenderMode = 'switch';
  private canvas: HTMLCanvasElement | null = null;
  private renderingContext: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initializeLayers();
  }

  /**
   * 设置渲染画布
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.renderingContext = canvas.getContext('2d');
  }

  /**
   * 设置场景渲染模式
   */
  setRenderMode(mode: SceneRenderMode): void {
    this.renderMode = mode;
    this.reorganizeScenes();
  }

  /**
   * 获取当前渲染模式
   */
  getRenderMode(): SceneRenderMode {
    return this.renderMode;
  }

  /**
   * 添加场景到激活列表
   */
  addActiveScene(scene: SceneConfig): void {
    if (this.renderMode === 'switch') {
      // 切换模式：只保留一个主场景
      this.clearActiveScenes('main');
    }

    this.activeScenes.set(scene.id, scene);
    scene.state = 'active';
    this.sortScenesByLayer();
  }

  /**
   * 移除激活场景
   */
  removeActiveScene(sceneId: string): void {
    const scene = this.activeScenes.get(sceneId);
    if (scene) {
      scene.state = 'paused';
      this.activeScenes.delete(sceneId);
    }
  }

  /**
   * 获取所有激活场景
   */
  getActiveScenes(): SceneConfig[] {
    return Array.from(this.activeScenes.values()).sort((a, b) =>
      a.layer.zIndex - b.layer.zIndex
    );
  }

  /**
   * 切换到指定场景
   */
  switchToScene(scene: SceneConfig): void {
    switch (this.renderMode) {
      case 'switch':
        this.switchModeTransition(scene);
        break;
      case 'overlay':
        this.overlayModeTransition(scene);
        break;
      case 'hybrid':
        this.hybridModeTransition(scene);
        break;
    }
  }

  /**
   * 暂停场景
   */
  pauseScene(sceneId: string): void {
    const scene = this.activeScenes.get(sceneId);
    if (scene && scene.state === 'active') {
      scene.state = 'pausing';

      // 执行暂停逻辑
      this.executePauseLogic(scene);

      scene.state = 'paused';
    }
  }

  /**
   * 恢复场景
   */
  resumeScene(sceneId: string): void {
    const scene = this.activeScenes.get(sceneId);
    if (scene && scene.state === 'paused') {
      scene.state = 'activating';

      // 执行恢复逻辑
      this.executeResumeLogic(scene);

      scene.state = 'active';
    }
  }

  /**
   * 预加载场景
   */
  async preloadScene(scene: SceneConfig): Promise<void> {
    scene.state = 'preloading';

    try {
      // 预加载场景资源
      await this.loadSceneResources(scene);

      // 初始化场景对象
      await this.initializeSceneObjects(scene);

      scene.state = 'loaded';
    } catch (error) {
      console.error(`场景预加载失败: ${scene.name}`, error);
      scene.state = 'unloaded';
      throw error;
    }
  }

  /**
   * 销毁场景
   */
  async destroyScene(sceneId: string): Promise<void> {
    const scene = this.activeScenes.get(sceneId);
    if (!scene) return;

    scene.state = 'destroying';

    try {
      // 清理场景资源
      await this.cleanupSceneResources(scene);

      // 从激活列表中移除
      this.activeScenes.delete(sceneId);

      scene.state = 'destroyed';
    } catch (error) {
      console.error(`场景销毁失败: ${scene.name}`, error);
    }
  }

  /**
   * 渲染所有激活场景
   */
  render(): void {
    if (!this.renderingContext || !this.canvas) return;

    // 清空画布
    this.renderingContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 按层级顺序渲染场景
    const scenes = this.getActiveScenes();
    scenes.forEach(scene => {
      if (scene.layer.visible && scene.state === 'active') {
        this.renderScene(scene);
      }
    });
  }

  /**
   * 更新场景层级
   */
  updateSceneLayers(layers: SceneLayer[]): void {
    this.sceneLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
    this.sortScenesByLayer();
  }

  /**
   * 获取场景层级配置
   */
  getSceneLayers(): SceneLayer[] {
    return [...this.sceneLayers];
  }

  // 私有方法

  private initializeLayers(): void {
    this.sceneLayers = [
      {
        id: 'background',
        name: '背景层',
        zIndex: 0,
        persistent: true,
        visible: true,
        opacity: 1,
      },
      {
        id: 'main',
        name: '主场景层',
        zIndex: 1,
        persistent: false,
        visible: true,
        opacity: 1,
      },
      {
        id: 'ui',
        name: 'UI层',
        zIndex: 2,
        persistent: true,
        visible: true,
        opacity: 1,
      },
      {
        id: 'overlay',
        name: '覆盖层',
        zIndex: 3,
        persistent: true,
        visible: true,
        opacity: 1,
      },
    ];
  }

  private reorganizeScenes(): void {
    const currentScenes = Array.from(this.activeScenes.values());
    this.activeScenes.clear();

    currentScenes.forEach(scene => {
      this.addActiveScene(scene);
    });
  }

  private clearActiveScenes(sceneType?: string): void {
    if (sceneType) {
      const scenesToRemove: string[] = [];
      this.activeScenes.forEach((scene, sceneId) => {
        if (scene.type === sceneType) {
          scenesToRemove.push(sceneId);
        }
      });
      scenesToRemove.forEach(sceneId => {
        this.removeActiveScene(sceneId);
      });
    } else {
      this.activeScenes.forEach((scene, sceneId) => {
        scene.state = 'paused';
      });
      this.activeScenes.clear();
    }
  }

  private sortScenesByLayer(): void {
    // 场景已经按照添加顺序和层级自动排序
  }

  private switchModeTransition(scene: SceneConfig): void {
    // 切换模式：暂停所有非持久化场景，激活新场景
    this.activeScenes.forEach((activeScene, sceneId) => {
      if (!activeScene.layer.persistent && activeScene.id !== scene.id) {
        this.pauseScene(sceneId);
      }
    });

    this.addActiveScene(scene);
  }

  private overlayModeTransition(scene: SceneConfig): void {
    // 叠加模式：直接添加场景到激活列表
    this.addActiveScene(scene);
  }

  private hybridModeTransition(scene: SceneConfig): void {
    // 混合模式：根据场景类型决定处理方式
    if (scene.type === 'main') {
      // 主场景使用切换模式
      this.clearActiveScenes('main');
    }
    // UI和背景场景使用叠加模式
    this.addActiveScene(scene);
  }

  private executePauseLogic(scene: SceneConfig): void {
    // 暂停场景中的动画
    // 保存场景状态
    // 停止音频播放
    console.log(`暂停场景: ${scene.name}`);
  }

  private executeResumeLogic(scene: SceneConfig): void {
    // 恢复场景中的动画
    // 恢复场景状态
    // 恢复音频播放
    console.log(`恢复场景: ${scene.name}`);
  }

  private async loadSceneResources(scene: SceneConfig): Promise<void> {
    // 加载场景相关的纹理资源
    // 加载场景相关的音频资源
    // 加载场景依赖的其他资源
    console.log(`预加载场景资源: ${scene.name}`);
  }

  private async initializeSceneObjects(scene: SceneConfig): Promise<void> {
    // 初始化场景中的实体对象
    // 设置物理世界
    // 初始化动画状态
    console.log(`初始化场景对象: ${scene.name}`);
  }

  private async cleanupSceneResources(scene: SceneConfig): Promise<void> {
    // 清理场景资源
    // 销毁物理对象
    // 清理事件监听器
    console.log(`清理场景资源: ${scene.name}`);
  }

  private renderScene(scene: SceneConfig): void {
    if (!this.renderingContext) return;

    // 设置场景透明度
    this.renderingContext.globalAlpha = scene.layer.opacity;

    // 渲染场景内容
    // 这里应该调用实际的场景渲染逻辑
    console.log(`渲染场景: ${scene.name} (层级: ${scene.layer.zIndex})`);

    // 恢复透明度
    this.renderingContext.globalAlpha = 1.0;
  }
}

// 单例实例
export const sceneComposer = new SceneComposer();
