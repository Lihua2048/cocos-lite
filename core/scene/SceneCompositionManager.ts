/**
 * 场景组合管理器
 * 支持叠加模式、切换模式、混合模式三种场景组合方式
 */

export enum CompositionMode {
  LAYERED = 'layered',    // 叠加模式：多场景同时存在，按层级渲染
  SWITCH = 'switch',      // 切换模式：同时只有一个主场景激活
  HYBRID = 'hybrid'       // 混合模式：主场景+持久化UI场景组合
}

export interface SceneLayer {
  sceneId: string;
  layerIndex: number;     // 层级索引，数值越大越在上层
  visible: boolean;
  alpha: number;          // 透明度 0-1
  interactive: boolean;   // 是否可交互
}

export interface CompositionProject {
  id: string;
  name: string;
  mode: CompositionMode;
  layers: SceneLayer[];
  activeSceneId?: string; // 切换模式下的当前激活场景
  persistentUIScenes: string[]; // 混合模式下的持久化UI场景
  mainSceneId?: string;   // 混合模式下的主场景
}

export class SceneCompositionManager {
  private compositionProjects: Map<string, CompositionProject> = new Map();
  private currentProjectId: string | null = null;
  private renderCallback?: (project: CompositionProject) => void;

  /**
   * 创建组合项目
   */
  createCompositionProject(name: string, mode: CompositionMode): CompositionProject {
    const project: CompositionProject = {
      id: `comp_${Date.now()}`,
      name,
      mode,
      layers: [],
      persistentUIScenes: [],
    };

    this.compositionProjects.set(project.id, project);
    return project;
  }

  /**
   * 添加场景到组合
   */
  addSceneToComposition(projectId: string, sceneId: string, layerIndex: number = 0): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project) return false;

    // 检查是否已存在
    const existingIndex = project.layers.findIndex(layer => layer.sceneId === sceneId);
    if (existingIndex !== -1) {
      // 更新层级
      project.layers[existingIndex].layerIndex = layerIndex;
    } else {
      // 添加新层
      const newLayer: SceneLayer = {
        sceneId,
        layerIndex,
        visible: true,
        alpha: 1.0,
        interactive: true,
      };
      project.layers.push(newLayer);
    }

    // 按层级排序
    project.layers.sort((a, b) => a.layerIndex - b.layerIndex);
    this.notifyRenderUpdate(project);
    return true;
  }

  /**
   * 移除场景从组合
   */
  removeSceneFromComposition(projectId: string, sceneId: string): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project) return false;

    project.layers = project.layers.filter(layer => layer.sceneId !== sceneId);
    project.persistentUIScenes = project.persistentUIScenes.filter(id => id !== sceneId);

    if (project.activeSceneId === sceneId) {
      project.activeSceneId = undefined;
    }
    if (project.mainSceneId === sceneId) {
      project.mainSceneId = undefined;
    }

    this.notifyRenderUpdate(project);
    return true;
  }

  /**
   * 设置场景层级
   */
  setSceneLayer(projectId: string, sceneId: string, layerIndex: number): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project) return false;

    const layer = project.layers.find(l => l.sceneId === sceneId);
    if (layer) {
      layer.layerIndex = layerIndex;
      project.layers.sort((a, b) => a.layerIndex - b.layerIndex);
      this.notifyRenderUpdate(project);
      return true;
    }
    return false;
  }

  /**
   * 设置场景可见性
   */
  setSceneVisibility(projectId: string, sceneId: string, visible: boolean): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project) return false;

    const layer = project.layers.find(l => l.sceneId === sceneId);
    if (layer) {
      layer.visible = visible;
      this.notifyRenderUpdate(project);
      return true;
    }
    return false;
  }

  /**
   * 设置场景透明度
   */
  setSceneAlpha(projectId: string, sceneId: string, alpha: number): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project) return false;

    const layer = project.layers.find(l => l.sceneId === sceneId);
    if (layer) {
      layer.alpha = Math.max(0, Math.min(1, alpha));
      this.notifyRenderUpdate(project);
      return true;
    }
    return false;
  }

  /**
   * 切换模式：激活指定场景
   */
  activateScene(projectId: string, sceneId: string): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project || project.mode !== CompositionMode.SWITCH) return false;

    project.activeSceneId = sceneId;
    this.notifyRenderUpdate(project);
    return true;
  }

  /**
   * 混合模式：设置主场景
   */
  setMainScene(projectId: string, sceneId: string): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project || project.mode !== CompositionMode.HYBRID) return false;

    project.mainSceneId = sceneId;
    this.notifyRenderUpdate(project);
    return true;
  }

  /**
   * 混合模式：添加持久化UI场景
   */
  addPersistentUIScene(projectId: string, sceneId: string): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project || project.mode !== CompositionMode.HYBRID) return false;

    if (!project.persistentUIScenes.includes(sceneId)) {
      project.persistentUIScenes.push(sceneId);
      this.notifyRenderUpdate(project);
      return true;
    }
    return false;
  }

  /**
   * 混合模式：移除持久化UI场景
   */
  removePersistentUIScene(projectId: string, sceneId: string): boolean {
    const project = this.compositionProjects.get(projectId);
    if (!project || project.mode !== CompositionMode.HYBRID) return false;

    const index = project.persistentUIScenes.indexOf(sceneId);
    if (index !== -1) {
      project.persistentUIScenes.splice(index, 1);
      this.notifyRenderUpdate(project);
      return true;
    }
    return false;
  }

  /**
   * 获取当前渲染顺序
   */
  getRenderOrder(projectId: string): string[] {
    const project = this.compositionProjects.get(projectId);
    if (!project) return [];

    switch (project.mode) {
      case CompositionMode.LAYERED:
        return project.layers
          .filter(layer => layer.visible)
          .map(layer => layer.sceneId);

      case CompositionMode.SWITCH:
        return project.activeSceneId ? [project.activeSceneId] : [];

      case CompositionMode.HYBRID:
        const renderOrder: string[] = [];
        if (project.mainSceneId) {
          renderOrder.push(project.mainSceneId);
        }
        renderOrder.push(...project.persistentUIScenes);
        return renderOrder;

      default:
        return [];
    }
  }

  /**
   * 设置当前组合项目
   */
  setCurrentProject(projectId: string): boolean {
    if (this.compositionProjects.has(projectId)) {
      this.currentProjectId = projectId;
      return true;
    }
    return false;
  }

  /**
   * 获取当前组合项目
   */
  getCurrentProject(): CompositionProject | null {
    return this.currentProjectId ?
      this.compositionProjects.get(this.currentProjectId) || null : null;
  }

  /**
   * 获取所有组合项目
   */
  getAllProjects(): CompositionProject[] {
    return Array.from(this.compositionProjects.values());
  }

  /**
   * 设置渲染回调
   */
  setRenderCallback(callback: (project: CompositionProject) => void): void {
    this.renderCallback = callback;
  }

  /**
   * 通知渲染更新
   */
  private notifyRenderUpdate(project: CompositionProject): void {
    if (this.renderCallback) {
      this.renderCallback(project);
    }
  }

  /**
   * 导出组合配置
   */
  exportComposition(projectId: string): string | null {
    const project = this.compositionProjects.get(projectId);
    if (!project) return null;

    return JSON.stringify(project, null, 2);
  }

  /**
   * 导入组合配置
   */
  importComposition(configJson: string): CompositionProject | null {
    try {
      const project: CompositionProject = JSON.parse(configJson);
      project.id = `comp_${Date.now()}`; // 重新生成ID
      this.compositionProjects.set(project.id, project);
      return project;
    } catch (error) {
      console.error('导入组合配置失败:', error);
      return null;
    }
  }
}

// 单例实例
export const sceneCompositionManager = new SceneCompositionManager();
