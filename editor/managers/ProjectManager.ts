import { ProjectConfig, ProjectTemplate, SceneConfig, SceneState } from '../../core/types';

/**
 * 项目管理器 - 负责项目的创建、加载、保存和管理
 */
export class ProjectManager {
  private projects: Map<string, ProjectConfig> = new Map();
  private currentProject: ProjectConfig | null = null;
  private projectTemplates: ProjectTemplate[] = [];

  constructor() {
    this.loadProjects();
    this.initializeTemplates();
  }

  /**
   * 获取所有项目列表
   */
  getProjects(): ProjectConfig[] {
    return Array.from(this.projects.values());
  }

  /**
   * 获取当前项目
   */
  getCurrentProject(): ProjectConfig | null {
    return this.currentProject;
  }

  /**
   * 创建新项目
   */
  async createProject(
    name: string,
    templateId?: string,
    description?: string
  ): Promise<ProjectConfig> {
    const project: ProjectConfig = {
      id: this.generateProjectId(),
      name,
      version: '1.0.0',
      description,
      author: 'Unknown',
      created: Date.now(),
      lastModified: Date.now(),
      scenes: {},
      sceneGraph: {
        layers: [
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
        ],
        transitions: [],
        initialScene: '',
      },
      buildSettings: {
        h5: {
          outputPath: './game/{projectName}/h5',
          minify: true,
          sourceMap: false,
          optimization: true,
          bundleAnalyzer: false,
        },
        wechat: {
          outputPath: './game/{projectName}/wechat',
          minify: true,
          subpackages: false,
          optimization: true,
        },
      },
      assets: {
        textures: [],
        audio: [],
        fonts: [],
        scripts: [],
      },
    };

    // 应用模板
    if (templateId) {
      await this.applyTemplate(project, templateId);
    }

    // 创建默认场景
    if (Object.keys(project.scenes).length === 0) {
      const defaultScene = this.createDefaultScene(project.id);
      project.scenes[defaultScene.id] = defaultScene;
      project.sceneGraph.initialScene = defaultScene.id;
    }

    this.projects.set(project.id, project);
    await this.saveProject(project);

    return project;
  }

  /**
   * 加载项目
   */
  async loadProject(projectId: string): Promise<ProjectConfig | null> {
    const project = this.projects.get(projectId);
    if (!project) {
      return null;
    }

    // 更新最后访问时间
    project.lastModified = Date.now();
    await this.saveProject(project);

    this.currentProject = project;
    return project;
  }

  /**
   * 保存项目
   */
  async saveProject(project: ProjectConfig): Promise<void> {
    project.lastModified = Date.now();
    this.projects.set(project.id, project);

    // 这里应该保存到本地存储或文件系统
    // 为了演示，我们使用 localStorage
    try {
      const projectsData = Array.from(this.projects.values());
      localStorage.setItem('cocos_projects', JSON.stringify(projectsData));
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<boolean> {
    if (this.currentProject?.id === projectId) {
      this.currentProject = null;
    }

    const deleted = this.projects.delete(projectId);
    if (deleted) {
      await this.saveAllProjects();
    }

    return deleted;
  }

  /**
   * 切换当前项目
   */
  async switchProject(projectId: string): Promise<boolean> {
    const project = await this.loadProject(projectId);
    return project !== null;
  }

  /**
   * 添加场景到项目
   */
  addSceneToProject(projectId: string, scene: SceneConfig): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    project.scenes[scene.id] = scene;
    project.lastModified = Date.now();
    this.saveProject(project);
    return true;
  }

  /**
   * 从项目中移除场景
   */
  removeSceneFromProject(projectId: string, sceneId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    delete project.scenes[sceneId];

    // 如果删除的是初始场景，重新设置
    if (project.sceneGraph.initialScene === sceneId) {
      const remainingScenes = Object.keys(project.scenes);
      project.sceneGraph.initialScene = remainingScenes.length > 0 ? remainingScenes[0] : '';
    }

    project.lastModified = Date.now();
    this.saveProject(project);
    return true;
  }

  /**
   * 获取项目模板
   */
  getProjectTemplates(): ProjectTemplate[] {
    return this.projectTemplates;
  }

  /**
   * 导入项目
   */
  async importProject(projectData: string): Promise<ProjectConfig | null> {
    try {
      const project: ProjectConfig = JSON.parse(projectData);

      // 验证项目数据
      if (!this.validateProject(project)) {
        throw new Error('项目数据格式无效');
      }

      // 生成新的项目ID以避免冲突
      project.id = this.generateProjectId();
      project.lastModified = Date.now();

      this.projects.set(project.id, project);
      await this.saveProject(project);

      return project;
    } catch (error) {
      console.error('导入项目失败:', error);
      return null;
    }
  }

  /**
   * 导出项目
   */
  exportProject(projectId: string): string | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    try {
      return JSON.stringify(project, null, 2);
    } catch (error) {
      console.error('导出项目失败:', error);
      return null;
    }
  }

  // 私有方法

  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSceneId(): string {
    return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createDefaultScene(projectId: string): SceneConfig {
    return {
      id: this.generateSceneId(),
      name: '默认场景',
      type: 'main',
      layer: {
        id: 'main',
        name: '主场景层',
        zIndex: 1,
        persistent: false,
        visible: true,
        opacity: 1,
      },
      dependencies: [],
      loadPriority: 1,
      renderMode: 'switch',
      state: 'unloaded',
      lastModified: Date.now(),
      data: {
        id: this.generateSceneId(),
        name: '默认场景',
        entities: {},
        animations: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          entityCount: 0,
          description: '项目的默认场景',
        },
      },
    };
  }

  private async loadProjects(): Promise<void> {
    try {
      const projectsData = localStorage.getItem('cocos_projects');
      if (projectsData) {
        const projects: ProjectConfig[] = JSON.parse(projectsData);
        projects.forEach(project => {
          this.projects.set(project.id, project);
        });
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  }

  private async saveAllProjects(): Promise<void> {
    try {
      const projectsData = Array.from(this.projects.values());
      localStorage.setItem('cocos_projects', JSON.stringify(projectsData));
    } catch (error) {
      console.error('保存项目列表失败:', error);
    }
  }

  private initializeTemplates(): void {
    this.projectTemplates = [
      {
        id: 'empty',
        name: '空项目',
        description: '创建一个空的项目，包含基本的场景结构',
        preview: '/templates/empty.png',
        scenes: [],
        defaultSettings: {},
      },
      {
        id: 'platformer',
        name: '平台跳跃游戏',
        description: '包含平台跳跃游戏的基础场景和组件',
        preview: '/templates/platformer.png',
        scenes: [
          {
            name: '主菜单',
            type: 'ui',
          },
          {
            name: '游戏场景',
            type: 'main',
          },
        ],
        defaultSettings: {},
      },
      {
        id: 'puzzle',
        name: '解谜游戏',
        description: '适合制作解谜类游戏的项目模板',
        preview: '/templates/puzzle.png',
        scenes: [
          {
            name: '关卡选择',
            type: 'ui',
          },
          {
            name: '游戏关卡',
            type: 'main',
          },
        ],
        defaultSettings: {},
      },
    ];
  }

  private async applyTemplate(project: ProjectConfig, templateId: string): Promise<void> {
    const template = this.projectTemplates.find(t => t.id === templateId);
    if (!template) return;

    // 应用模板设置
    if (template.defaultSettings) {
      Object.assign(project, template.defaultSettings);
    }

    // 创建模板场景
    template.scenes.forEach((sceneTemplate, index) => {
      const scene = this.createDefaultScene(project.id);
      scene.name = sceneTemplate.name || `场景${index + 1}`;
      scene.type = sceneTemplate.type || 'main';

      project.scenes[scene.id] = scene;

      if (index === 0) {
        project.sceneGraph.initialScene = scene.id;
      }
    });
  }

  private validateProject(project: any): boolean {
    return (
      project &&
      typeof project.id === 'string' &&
      typeof project.name === 'string' &&
      typeof project.version === 'string' &&
      project.scenes &&
      project.sceneGraph &&
      project.buildSettings
    );
  }
}

// 单例实例
export const projectManager = new ProjectManager();
