/**
 * 场景生命周期管理器 - 第二期核心功能
 * 负责完整的场景生命周期管理，包括创建、加载、激活、暂停、恢复、销毁等
 */

export enum SceneState {
  CREATED = 'created',       // 已创建
  LOADING = 'loading',       // 加载中
  LOADED = 'loaded',         // 已加载
  ACTIVE = 'active',         // 激活状态
  PAUSED = 'paused',         // 暂停状态
  DEACTIVATED = 'deactivated', // 未激活
  DESTROYED = 'destroyed'    // 已销毁
}

export interface SceneLifecycleHooks {
  onPreload?: () => Promise<void>;
  onLoad?: () => Promise<void>;
  onStart?: () => void;
  onEnable?: () => void;
  onDisable?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDestroy?: () => Promise<void>;
  onUpdate?: (deltaTime: number) => void;
  onLateUpdate?: (deltaTime: number) => void;
}

export interface SceneConfig {
  id: string;
  name: string;
  description?: string;
  renderMode: string;
  compositionModes: string[];
  priority: number;
  preloadAssets: string[];
  dependencies: string[];
  persistent: boolean;
  autoStart: boolean;
  hooks?: SceneLifecycleHooks;
}

export interface SceneAsset {
  id: string;
  type: 'texture' | 'model' | 'audio' | 'script' | 'material';
  url: string;
  loaded: boolean;
  data?: any;
}

export class SceneInstance {
  public id: string;
  public name: string;
  public config: SceneConfig;
  public state: SceneState;
  public assets: Map<string, SceneAsset>;
  public entities: Map<string, any>;
  public components: Map<string, any>;
  public createTime: number;
  public loadTime?: number;
  public activeTime?: number;
  public hooks: SceneLifecycleHooks;

  constructor(config: SceneConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.state = SceneState.CREATED;
    this.assets = new Map();
    this.entities = new Map();
    this.components = new Map();
    this.createTime = Date.now();
    this.hooks = config.hooks || {};

    console.log(`Scene created: ${this.name} (${this.id})`);
  }

  /**
   * 获取场景运行时长
   */
  getRuntime(): number {
    if (this.activeTime) {
      return Date.now() - this.activeTime;
    }
    return 0;
  }

  /**
   * 添加实体
   */
  addEntity(id: string, entity: any): void {
    this.entities.set(id, entity);
  }

  /**
   * 移除实体
   */
  removeEntity(id: string): boolean {
    return this.entities.delete(id);
  }

  /**
   * 添加组件
   */
  addComponent(id: string, component: any): void {
    this.components.set(id, component);
  }

  /**
   * 移除组件
   */
  removeComponent(id: string): boolean {
    return this.components.delete(id);
  }
}

export class SceneLifecycleManager {
  private scenes: Map<string, SceneInstance> = new Map();
  private activeScenes: Set<string> = new Set();
  private loadingQueue: string[] = [];
  private updateTimer?: NodeJS.Timeout;
  private lastFrameTime: number = 0;
  private isUpdating: boolean = false;

  constructor() {
    this.startUpdateLoop();
  }

  /**
   * 创建场景
   */
  async createScene(config: SceneConfig): Promise<SceneInstance> {
    if (this.scenes.has(config.id)) {
      throw new Error(`Scene with id ${config.id} already exists`);
    }

    const scene = new SceneInstance(config);
    this.scenes.set(config.id, scene);

    // 触发预加载钩子
    if (scene.hooks.onPreload) {
      try {
        await scene.hooks.onPreload();
      } catch (error) {
        console.error(`Scene preload failed: ${scene.name}`, error);
      }
    }

    return scene;
  }

  /**
   * 加载场景
   */
  async loadScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    if (scene.state !== SceneState.CREATED) {
      console.warn(`Scene ${scene.name} is not in CREATED state`);
      return;
    }

    scene.state = SceneState.LOADING;
    this.loadingQueue.push(sceneId);

    try {
      // 加载依赖场景
      await this.loadDependencies(scene);

      // 加载预设资源
      await this.loadAssets(scene);

      // 触发加载钩子
      if (scene.hooks.onLoad) {
        await scene.hooks.onLoad();
      }

      scene.state = SceneState.LOADED;
      scene.loadTime = Date.now();

      // 自动启动
      if (scene.config.autoStart) {
        await this.activateScene(sceneId);
      }

      console.log(`Scene loaded: ${scene.name}`);
    } catch (error) {
      scene.state = SceneState.CREATED; // 回滚状态
      console.error(`Scene load failed: ${scene.name}`, error);
      throw error;
    } finally {
      const index = this.loadingQueue.indexOf(sceneId);
      if (index > -1) {
        this.loadingQueue.splice(index, 1);
      }
    }
  }

  /**
   * 激活场景
   */
  async activateScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    if (scene.state !== SceneState.LOADED && scene.state !== SceneState.DEACTIVATED) {
      throw new Error(`Scene ${scene.name} is not ready for activation`);
    }

    try {
      // 触发启动钩子
      if (scene.hooks.onStart) {
        scene.hooks.onStart();
      }

      // 触发启用钩子
      if (scene.hooks.onEnable) {
        scene.hooks.onEnable();
      }

      scene.state = SceneState.ACTIVE;
      scene.activeTime = Date.now();
      this.activeScenes.add(sceneId);

      console.log(`Scene activated: ${scene.name}`);
    } catch (error) {
      console.error(`Scene activation failed: ${scene.name}`, error);
      throw error;
    }
  }

  /**
   * 暂停场景
   */
  pauseScene(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene || scene.state !== SceneState.ACTIVE) {
      return;
    }

    try {
      // 触发暂停钩子
      if (scene.hooks.onPause) {
        scene.hooks.onPause();
      }

      scene.state = SceneState.PAUSED;
      console.log(`Scene paused: ${scene.name}`);
    } catch (error) {
      console.error(`Scene pause failed: ${scene.name}`, error);
    }
  }

  /**
   * 恢复场景
   */
  resumeScene(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene || scene.state !== SceneState.PAUSED) {
      return;
    }

    try {
      // 触发恢复钩子
      if (scene.hooks.onResume) {
        scene.hooks.onResume();
      }

      scene.state = SceneState.ACTIVE;
      console.log(`Scene resumed: ${scene.name}`);
    } catch (error) {
      console.error(`Scene resume failed: ${scene.name}`, error);
    }
  }

  /**
   * 停用场景
   */
  deactivateScene(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene || (scene.state !== SceneState.ACTIVE && scene.state !== SceneState.PAUSED)) {
      return;
    }

    try {
      // 触发禁用钩子
      if (scene.hooks.onDisable) {
        scene.hooks.onDisable();
      }

      scene.state = SceneState.DEACTIVATED;
      this.activeScenes.delete(sceneId);

      console.log(`Scene deactivated: ${scene.name}`);
    } catch (error) {
      console.error(`Scene deactivation failed: ${scene.name}`, error);
    }
  }

  /**
   * 销毁场景
   */
  async destroyScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return;
    }

    try {
      // 先停用场景
      if (scene.state === SceneState.ACTIVE || scene.state === SceneState.PAUSED) {
        this.deactivateScene(sceneId);
      }

      // 触发销毁钩子
      if (scene.hooks.onDestroy) {
        await scene.hooks.onDestroy();
      }

      // 清理资源
      scene.assets.clear();
      scene.entities.clear();
      scene.components.clear();

      scene.state = SceneState.DESTROYED;
      this.scenes.delete(sceneId);
      this.activeScenes.delete(sceneId);

      console.log(`Scene destroyed: ${scene.name}`);
    } catch (error) {
      console.error(`Scene destruction failed: ${scene.name}`, error);
      throw error;
    }
  }

  /**
   * 加载场景依赖
   */
  private async loadDependencies(scene: SceneInstance): Promise<void> {
    for (const depId of scene.config.dependencies) {
      const depScene = this.scenes.get(depId);
      if (!depScene) {
        throw new Error(`Dependency scene not found: ${depId}`);
      }

      if (depScene.state === SceneState.CREATED) {
        await this.loadScene(depId);
      }
    }
  }

  /**
   * 加载场景资源
   */
  private async loadAssets(scene: SceneInstance): Promise<void> {
    const loadPromises = scene.config.preloadAssets.map(async (assetId) => {
      const asset: SceneAsset = {
        id: assetId,
        type: 'texture', // 简化示例
        url: `/assets/${assetId}`,
        loaded: false
      };

      try {
        // 模拟资源加载
        await new Promise(resolve => setTimeout(resolve, 100));
        asset.loaded = true;
        asset.data = `data_${assetId}`;
        scene.assets.set(assetId, asset);
      } catch (error) {
        console.error(`Failed to load asset: ${assetId}`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * 启动更新循环
   */
  private startUpdateLoop(): void {
    this.lastFrameTime = Date.now();

    const update = () => {
      if (this.isUpdating) return;
      this.isUpdating = true;

      const currentTime = Date.now();
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // 更新所有激活的场景
      this.activeScenes.forEach(sceneId => {
        const scene = this.scenes.get(sceneId);
        if (scene && scene.state === SceneState.ACTIVE) {
          // 触发更新钩子
          if (scene.hooks.onUpdate) {
            scene.hooks.onUpdate(deltaTime);
          }

          // 触发延迟更新钩子
          if (scene.hooks.onLateUpdate) {
            scene.hooks.onLateUpdate(deltaTime);
          }
        }
      });

      this.isUpdating = false;
    };

    // 使用 requestAnimationFrame 进行更新（如果在浏览器环境）
    if (typeof requestAnimationFrame !== 'undefined') {
      const loop = () => {
        update();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } else {
      // 回退到 setInterval
      this.updateTimer = setInterval(update, 16); // 约 60fps
    }
  }

  /**
   * 获取场景
   */
  getScene(sceneId: string): SceneInstance | undefined {
    return this.scenes.get(sceneId);
  }

  /**
   * 获取所有场景
   */
  getAllScenes(): SceneInstance[] {
    return Array.from(this.scenes.values());
  }

  /**
   * 获取激活的场景
   */
  getActiveScenes(): SceneInstance[] {
    return Array.from(this.activeScenes).map(id => this.scenes.get(id)!).filter(Boolean);
  }

  /**
   * 获取场景状态统计
   */
  getSceneStats(): {
    total: number;
    created: number;
    loading: number;
    loaded: number;
    active: number;
    paused: number;
    deactivated: number;
    destroyed: number;
  } {
    const stats = {
      total: this.scenes.size,
      created: 0,
      loading: 0,
      loaded: 0,
      active: 0,
      paused: 0,
      deactivated: 0,
      destroyed: 0
    };

    this.scenes.forEach(scene => {
      switch (scene.state) {
        case SceneState.CREATED: stats.created++; break;
        case SceneState.LOADING: stats.loading++; break;
        case SceneState.LOADED: stats.loaded++; break;
        case SceneState.ACTIVE: stats.active++; break;
        case SceneState.PAUSED: stats.paused++; break;
        case SceneState.DEACTIVATED: stats.deactivated++; break;
        case SceneState.DESTROYED: stats.destroyed++; break;
      }
    });

    return stats;
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    // 停止更新循环
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    // 销毁所有场景
    const destroyPromises = Array.from(this.scenes.keys()).map(sceneId =>
      this.destroyScene(sceneId)
    );

    await Promise.all(destroyPromises);

    this.scenes.clear();
    this.activeScenes.clear();
    this.loadingQueue.length = 0;
  }
}

// 全局场景生命周期管理器
export const sceneLifecycleManager = new SceneLifecycleManager();
