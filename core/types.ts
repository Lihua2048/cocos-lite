export interface EditorState {
  entities: Record<string, Entity>;
  selectedEntityId: string | null;
  textures: TextureResource[];
  animations: Record<string, Animation>;
  physicsRunning: boolean; // 是否运行物理模拟
  // 场景管理字段
  scenes: Record<string, SceneData>;
  currentSceneId: string | null;
  sceneHistory: string[]; // 场景切换历史
}



export interface RootState {
  editor: EditorState;
  projects: ProjectManagerState;
}

export type SceneActionType =
  | "CREATE_SCENE"
  | "DELETE_SCENE"
  | "SWITCH_SCENE"
  | "SAVE_CURRENT_SCENE"
  | "LOAD_SCENE"
  | "RENAME_SCENE"
  | "IMPORT_SCENES"
  | "EXPORT_SCENES";

export interface SceneData {
  id: string;
  name: string;
  entities: Record<string, Entity>;
  animations: Record<string, Animation>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    entityCount: number;
    description?: string;
  };
}

// 通用组件类型
export interface Component {
  type: string;
}

// 物理组件类型
export interface PhysicsComponent extends Component {
  type: 'physics';
  bodyType: 'dynamic' | 'static' | 'kinematic';
  density: number;
  friction: number;
  restitution: number;
  fixedRotation?: boolean;
  // 可扩展更多物理属性
}


export type SpriteProperties = {
  width: number;
  height: number;
  color: [number, number, number, number];
  texture?: string;
  angle?: number;
};

export type UIProperties = {
  width: number;
  height: number;
  backgroundType: 'color' | 'image';
  color: [number, number, number, number]; // 背景色
  texture?: string; // 背景图片
  text: string; // 按钮/文本内容/输入框placeholder
  textColor: [number, number, number, number];
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom'; // 新增，支持垂直方向排版
};

export type Entity =
  | {
      id: string;
      type: 'sprite';
      position: { x: number; y: number };
      properties: SpriteProperties;
      components: (Component | PhysicsComponent)[];
      animation?: EntityAnimation;
    }
  | {
      id: string;
      type: 'ui-button' | 'ui-input' | 'ui-text';
      position: { x: number; y: number };
      properties: UIProperties;
      components: (Component | PhysicsComponent)[];
      animation?: EntityAnimation;
    };

export type EntityProperty =
  | 'width' | 'height' | 'color' | 'texture' | 'text' | 'fontSize'
  | 'x' | 'y';

  // 新增资源类型
export type TextureResource = string | {
  id: string;
  name: string;
  url: string;
};

// 添加动画相关action类型

export type EditorActionType =
  | "ADD_ENTITY"
  | "SELECT_ENTITY"
  | "UPDATE_ENTITY"
  | "REMOVE_ENTITY"
  | "ADD_TEXTURE"
  | "UPDATE_ENTITY_TEXTURE"
  | "PLAY_ANIMATION"
  | "PAUSE_ANIMATION"
  | "STOP_ANIMATION"
  | "SAVE_ANIMATION";

// 支持多属性关键帧动画
export interface AnimationKeyframe {
  time: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  color: [number, number, number, number];
  texture: string;
}
export interface Animation {
  propertyName: string; // 兼容旧逻辑，可忽略
  keyframes: AnimationKeyframe[];
}

export interface EntityAnimation {
  playing: boolean;
  currentAnimation?: string;
  currentTime: number;
  loop?: boolean;
}

// 添加默认动画状态
export function createDefaultEntity(id: string, type: 'sprite' | 'ui-button' | 'ui-input' | 'ui-text'): Entity {
  if (type === 'sprite') {
    return {
      id,
      type,
      position: { x: 0, y: 0 },
      properties: {
        width: 100,
        height: 100,
        color: [1, 0, 0, 1],
        texture: undefined,
        angle: 0,
      },
      components: [],
      animation: {
        playing: false,
        currentAnimation: '',
        currentTime: 0
      }
    };
  } else {
    // UI组件，默认英文
    let defaultText = 'Button';
    if (type === 'ui-input') defaultText = 'Input';
    if (type === 'ui-text') defaultText = 'Text';
    return {
      id,
      type,
      position: { x: 0, y: 0 },
      properties: {
        width: 120,
        height: 40,
        backgroundType: 'color',
        color: [0.9, 0.9, 0.9, 1],
        texture: undefined,
        text: defaultText,
        textColor: [0, 0, 0, 1],
        fontSize: 16,
        textAlign: 'center',
      },
      components: [],
      animation: {
        playing: false,
        currentAnimation: '',
        currentTime: 0
      }
    };
  }
}

// 场景渲染模式
export type SceneRenderMode = 'overlay' | 'switch' | 'hybrid';

// 场景状态
export type SceneState = 'unloaded' | 'preloading' | 'loaded' | 'activating' | 'active' | 'pausing' | 'paused' | 'destroying' | 'destroyed';

// 场景层级配置
export interface SceneLayer {
  id: string;
  name: string;
  zIndex: number;
  persistent: boolean; // 是否在场景切换时保持
  visible: boolean;
  opacity: number;
}

// 场景转换配置
export interface SceneTransition {
  from: string;
  to: string;
  type: 'fade' | 'slide' | 'zoom' | 'instant';
  duration: number;
  easing?: string;
}

// 场景配置
export interface SceneConfig {
  id: string;
  name: string;
  type: 'main' | 'ui' | 'background' | 'sub';
  layer: SceneLayer;
  dependencies: string[];
  loadPriority: number;
  renderMode: SceneRenderMode;
  state: SceneState;
  filePath?: string;
  thumbnail?: string;
  lastModified: number;
  data: SceneData;
}

// 项目配置
export interface ProjectConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  created: number;
  lastModified: number;
  scenes: { [sceneId: string]: SceneConfig };
  sceneGraph: {
    layers: SceneLayer[];
    transitions: SceneTransition[];
    initialScene: string;
    currentScene?: string;
  };
  buildSettings: {
    h5: H5BuildConfig;
    wechat: WechatBuildConfig;
  };
  assets: {
    textures: string[];
    audio: string[];
    fonts: string[];
    scripts: string[];
  };
}

// H5构建配置
export interface H5BuildConfig {
  outputPath: string;
  minify: boolean;
  sourceMap: boolean;
  optimization: boolean;
  bundleAnalyzer: boolean;
}

// 微信小游戏构建配置
export interface WechatBuildConfig {
  outputPath: string;
  appId?: string;
  minify: boolean;
  subpackages: boolean;
  optimization: boolean;
}

// 项目管理状态
export interface ProjectManagerState {
  projects: { [projectId: string]: ProjectConfig };
  currentProjectId: string | null;
  recentProjects: string[];
  projectTemplates: ProjectTemplate[];
}

// 项目模板
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  scenes: Partial<SceneConfig>[];
  defaultSettings: Partial<ProjectConfig>;
}




