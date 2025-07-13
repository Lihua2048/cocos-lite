/**
 * 第二期核心功能集成管理器
 * 整合渲染引擎、生命周期管理、构建系统和可视化编辑功能
 */

import { renderingEngine, RenderMode, CompositionMode, BlendMode, SceneRenderData } from '../rendering/RenderingEngine';
import { sceneLifecycleManager, SceneConfig, SceneState } from '../lifecycle/SceneLifecycleManager';
import { projectBuildSystem, BuildConfig, BuildPlatform, BuildMode, AssetOptimization } from '../build/ProjectBuildSystem';
import { SceneCompositionNode, SceneConnection, CompositionProject } from '../../editor/components/composition/SceneCompositionEditor';

export interface ProjectPhase2Config {
  id: string;
  name: string;
  description: string;
  version: string;
  renderingSettings: {
    defaultRenderMode: RenderMode;
    supportedModes: RenderMode[];
    compositionModes: CompositionMode[];
    globalBlendMode: BlendMode;
  };
  buildSettings: {
    platforms: BuildPlatform[];
    defaultMode: BuildMode;
    optimization: boolean;
  };
  compositionSettings: {
    enableVisualEditor: boolean;
    autoLayout: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
}

export interface ProjectStats {
  scenes: {
    total: number;
    active: number;
    loading: number;
    loaded: number;
  };
  rendering: {
    renderCalls: number;
    frameRate: number;
    activeContexts: number;
  };
  build: {
    lastBuildTime?: number;
    buildHistory: number;
    totalSize: number;
  };
  composition: {
    nodes: number;
    connections: number;
    selectedNodes: number;
  };
}

export class Phase2CoreManager {
  private projectConfig: ProjectPhase2Config | null = null;
  private compositionProjects: Map<string, CompositionProject> = new Map();
  private _isInitialized: boolean = false;
  private updateCallbacks: Set<(stats: ProjectStats) => void> = new Set();

  /**
   * 初始化第二期核心功能
   */
  async initialize(config: ProjectPhase2Config): Promise<void> {
    if (this._isInitialized) {
      console.warn('Phase2CoreManager already initialized');
      return;
    }

    this.projectConfig = config;

    try {
      // 初始化渲染引擎
      // Initializing rendering engine...

      // 初始化场景生命周期管理器
      // Initializing scene lifecycle manager...

      // 初始化构建系统
      // Initializing build system...

      // 创建默认组合项目
      if (config.compositionSettings.enableVisualEditor) {
        await this.createDefaultCompositionProject();
      }

      this._isInitialized = true;
      // Phase2CoreManager initialized successfully

      // 开始性能监控
      this.startPerformanceMonitoring();

    } catch (error) {
      console.error('Failed to initialize Phase2CoreManager:', error);
      throw error;
    }
  }

  /**
   * 创建场景
   */
  async createScene(config: SceneConfig): Promise<string> {
    if (!this._isInitialized || !this.projectConfig) {
      throw new Error('Manager not initialized');
    }

    // 使用生命周期管理器创建场景
    const scene = await sceneLifecycleManager.createScene(config);

    // 创建渲染上下文
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    renderingEngine.createRenderContext(
      scene.id,
      canvas,
      this.projectConfig.renderingSettings.defaultRenderMode,
      this.projectConfig.renderingSettings.compositionModes
    );

    // 添加到组合项目中
    if (this.projectConfig.compositionSettings.enableVisualEditor) {
      await this.addSceneToComposition(scene.id, config.name);
    }

    // Scene created successfully
    this.notifyStatsUpdate();

    return scene.id;
  }

  /**
   * 加载场景
   */
  async loadScene(sceneId: string): Promise<void> {
    await sceneLifecycleManager.loadScene(sceneId);
    // Scene loaded successfully
    this.notifyStatsUpdate();
  }

  /**
   * 激活场景
   */
  async activateScene(sceneId: string): Promise<void> {
    await sceneLifecycleManager.activateScene(sceneId);
    // Scene activated successfully
    this.notifyStatsUpdate();
  }

  /**
   * 渲染场景
   */
  renderScenes(): void {
    const activeScenes = sceneLifecycleManager.getActiveScenes();
    const renderData: SceneRenderData[] = activeScenes.map(scene => ({
      sceneId: scene.id,
      entities: Array.from(scene.entities.values()),
      camera: null, // 实际项目中应该有相机系统
      lighting: null, // 实际项目中应该有光照系统
      materials: [],
      textures: [],
      priority: scene.config.priority,
      visible: true,
      opacity: 1.0
    }));

    renderingEngine.renderCompositeScenes(renderData);
  }

  /**
   * 构建项目
   */
  async buildProject(platform: BuildPlatform, mode: BuildMode): Promise<void> {
    if (!this.projectConfig) {
      throw new Error('Project not configured');
    }

    const buildConfig: BuildConfig = {
      projectId: this.projectConfig.id,
      projectName: this.projectConfig.name,
      version: this.projectConfig.version,
      platform,
      mode,
      outputPath: `./dist/${platform}`,
      optimization: this.projectConfig.buildSettings.optimization ? AssetOptimization.BASIC : AssetOptimization.NONE,
      scenes: sceneLifecycleManager.getAllScenes().map((scene, index) => ({
        id: scene.id,
        include: true,
        order: index
      })),
      assets: {
        compress: true,
        format: 'auto',
        quality: 0.8
      },
      code: {
        minify: mode === BuildMode.RELEASE,
        obfuscate: mode === BuildMode.RELEASE,
        sourceMap: mode !== BuildMode.RELEASE
      },
      platformConfig: {}
    };

    // Build started successfully
    const result = await projectBuildSystem.buildProject(buildConfig);

    if (result.success) {
      // Build completed successfully
    } else {
      console.error(`Build failed: ${result.errors.length} errors`);
      result.errors.forEach(error => {
        console.error(`  ${error.file}:${error.line} - ${error.message}`);
      });
    }

    this.notifyStatsUpdate();
  }

  /**
   * 创建默认组合项目
   */
  private async createDefaultCompositionProject(): Promise<void> {
    const project: CompositionProject = {
      id: 'default',
      name: 'Default Composition',
      nodes: new Map(),
      connections: new Map(),
      viewport: { x: 0, y: 0, scale: 1.0 },
      selectedNodes: new Set(),
      settings: {
        gridSize: this.projectConfig?.compositionSettings.gridSize || 20,
        snapToGrid: this.projectConfig?.compositionSettings.snapToGrid || true,
        showGrid: true,
        autoLayout: this.projectConfig?.compositionSettings.autoLayout || false
      }
    };

    this.compositionProjects.set('default', project);
    // Default composition project created
  }

  /**
   * 添加场景到组合项目
   */
  private async addSceneToComposition(sceneId: string, sceneName: string): Promise<void> {
    const project = this.compositionProjects.get('default');
    if (!project) return;

    const node: SceneCompositionNode = {
      id: sceneId,
      name: sceneName,
      type: 'scene',
      x: project.nodes.size * 150 + 50,
      y: 100,
      width: 120,
      height: 80,
      zIndex: 1,
      visible: true,
      opacity: 1.0,
      blendMode: 'normal',
      children: [],
      metadata: {
        renderMode: this.projectConfig?.renderingSettings.defaultRenderMode || 'webgl',
        compositionModes: this.projectConfig?.renderingSettings.compositionModes || [],
        color: '#e3f2fd',
        icon: '🎬'
      }
    };

    project.nodes.set(sceneId, node);
    // Scene added to composition
  }

  /**
   * 获取组合项目
   */
  getCompositionProject(projectId: string = 'default'): CompositionProject | undefined {
    return this.compositionProjects.get(projectId);
  }

  /**
   * 更新组合项目
   */
  updateCompositionProject(projectId: string, project: CompositionProject): void {
    this.compositionProjects.set(projectId, project);
    this.notifyStatsUpdate();
  }

  /**
   * 获取项目统计信息
   */
  getProjectStats(): ProjectStats {
    const sceneStats = sceneLifecycleManager.getSceneStats();
    const renderStats = renderingEngine.getRenderStats();
    const buildHistory = projectBuildSystem.getBuildHistory();
    const compositionProject = this.compositionProjects.get('default');

    return {
      scenes: {
        total: sceneStats.total,
        active: sceneStats.active,
        loading: sceneStats.loading,
        loaded: sceneStats.loaded
      },
      rendering: {
        renderCalls: renderStats.renderCalls,
        frameRate: renderStats.frameRate,
        activeContexts: renderStats.activeContexts
      },
      build: {
        lastBuildTime: buildHistory.length > 0 ? buildHistory[buildHistory.length - 1].duration : undefined,
        buildHistory: buildHistory.length,
        totalSize: buildHistory.length > 0 ? buildHistory[buildHistory.length - 1].stats.totalSize : 0
      },
      composition: {
        nodes: compositionProject?.nodes.size || 0,
        connections: compositionProject?.connections.size || 0,
        selectedNodes: compositionProject?.selectedNodes.size || 0
      }
    };
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 获取渲染引擎
   */
  public getRenderingEngine() {
    return renderingEngine;
  }

  /**
   * 获取项目配置
   */
  public getConfig(): ProjectPhase2Config | null {
    return this.projectConfig;
  }

  /**
   * 获取生命周期管理器
   */
  public getLifecycleManager() {
    return sceneLifecycleManager;
  }

  /**
   * 获取构建系统
   */
  public getBuildSystem() {
    return projectBuildSystem;
  }

  /**
   * 更新统计信息
   */
  public async updateStats(): Promise<void> {
    if (!this._isInitialized) return;
    this.notifyStatsUpdate();
  }

  /**
   * 订阅统计更新
   */
  public subscribe(callback: (stats: ProjectStats) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * 订阅统计更新 (别名方法)
   */
  onStatsUpdate(callback: (stats: ProjectStats) => void): () => void {
    return this.subscribe(callback);
  }

  /**
   * 移除统计更新回调
   */
  offStatsUpdate(callback: (stats: ProjectStats) => void): void {
    this.updateCallbacks.delete(callback);
  }

  /**
   * 通知统计更新
   */
  private notifyStatsUpdate(): void {
    const stats = this.getProjectStats();
    this.updateCallbacks.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Error in stats update callback:', error);
      }
    });
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    // 每秒更新一次统计信息
    setInterval(() => {
      this.notifyStatsUpdate();
    }, 1000);

    // 渲染循环
    const renderLoop = () => {
      if (this._isInitialized) {
        this.renderScenes();
      }
      requestAnimationFrame(renderLoop);
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(renderLoop);
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    if (!this._isInitialized) return;

    try {
      // 销毁场景生命周期管理器
      await sceneLifecycleManager.destroy();

      // 清理渲染上下文
      sceneLifecycleManager.getAllScenes().forEach(scene => {
        renderingEngine.destroyRenderContext(scene.id);
      });

      // 清理组合项目
      this.compositionProjects.clear();

      // 清理回调
      this.updateCallbacks.clear();

      this._isInitialized = false;
      this.projectConfig = null;

      // Phase2CoreManager destroyed
    } catch (error) {
      console.error('Error destroying Phase2CoreManager:', error);
      throw error;
    }
  }

  /**
   * 获取支持的功能列表
   */
  getSupportedFeatures(): {
    rendering: string[];
    lifecycle: string[];
    building: string[];
    composition: string[];
  } {
    return {
      rendering: [
        'WebGL渲染',
        '分层组合',
        '顺序渲染',
        '并行渲染',
        '遮罩渲染',
        '多种混合模式'
      ],
      lifecycle: [
        '场景创建',
        '资源预加载',
        '场景激活/停用',
        '暂停/恢复',
        '依赖管理',
        '生命周期钩子'
      ],
      building: [
        '多平台构建',
        '资源优化',
        '代码压缩',
        '构建管道',
        '增量构建',
        '构建统计'
      ],
      composition: [
        '可视化编辑',
        '节点拖拽',
        '连接管理',
        '属性编辑',
        '自动布局',
        '实时预览'
      ]
    };
  }
}

// 全局第二期核心管理器实例
export const phase2CoreManager = new Phase2CoreManager();

// 默认配置
export const defaultPhase2Config: ProjectPhase2Config = {
  id: 'default-project',
  name: 'Cocos Creator Project',
  description: 'A multi-scene project with advanced features',
  version: '1.0.0',
  renderingSettings: {
    defaultRenderMode: RenderMode.WEBGL,
    supportedModes: [RenderMode.WEBGL, RenderMode.CANVAS2D],
    compositionModes: [CompositionMode.LAYERED, CompositionMode.SEQUENTIAL],
    globalBlendMode: BlendMode.NORMAL
  },
  buildSettings: {
    platforms: [BuildPlatform.WEB, BuildPlatform.ANDROID, BuildPlatform.IOS],
    defaultMode: BuildMode.DEBUG,
    optimization: true
  },
  compositionSettings: {
    enableVisualEditor: true,
    autoLayout: false,
    snapToGrid: true,
    gridSize: 20
  }
};
