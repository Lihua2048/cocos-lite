// 动画关键帧相关
export const saveAnimation = (name: string, propertyName: string, keyframes: any[]) => ({
  type: 'SAVE_ANIMATION',
  payload: { name, propertyName, keyframes }
});

// 导出项目管理相关actions
export * from './actions/projectActions';

import { Entity, EntityProperty, SceneData, TextureResource, SceneCompositionMode, SceneCompositionState } from "./types";


export const ADD_ENTITY = "ADD_ENTITY";
export const REMOVE_ENTITY = "REMOVE_ENTITY";
export const SELECT_ENTITY = "SELECT_ENTITY";
export const UPDATE_ENTITY = "UPDATE_ENTITY";
export const ADD_TEXTURE = "ADD_TEXTURE";
// 动画相关action类型
export const UPDATE_ENTITY_TEXTURE = "UPDATE_ENTITY_TEXTURE";
export const PLAY_ANIMATION = 'PLAY_ANIMATION';
export const PAUSE_ANIMATION = 'PAUSE_ANIMATION';
export const STOP_ANIMATION = 'STOP_ANIMATION';


import { Animation } from './types';
export type EditorAction =
  | { type: "ADD_ENTITY"; payload: Entity }
  | { type: "SELECT_ENTITY"; payload: string | null }
  | { type: "UPDATE_ENTITY"; payload: { id: string; updates: Partial<Entity> } }
  | { type: "REMOVE_ENTITY"; payload: { id: string } }
  | { type: "ADD_TEXTURE"; payload: string }
  | { type: "UPDATE_ENTITY_TEXTURE"; payload: { entityId: string; textureId: string } }
  | { type: "PLAY_ANIMATION"; payload: { entityId: string; name: string; loop?: boolean } }
  | { type: "PAUSE_ANIMATION"; payload: { entityId: string } }
  | { type: "STOP_ANIMATION"; payload: { entityId: string } }
  | { type: "SAVE_ANIMATION"; payload: { name: string; propertyName: string; keyframes: Animation['keyframes'] } }
  // 物理组件相关
  | { type: "ADD_PHYSICS_COMPONENT"; payload: { entityId: string; component: import("./types").PhysicsComponent } }
  | { type: "REMOVE_PHYSICS_COMPONENT"; payload: { entityId: string } }
  | { type: "UPDATE_PHYSICS_COMPONENT"; payload: { entityId: string; updates: Partial<import("./types").PhysicsComponent> } }
  | { type: "SET_PHYSICS_RUNNING"; payload: boolean }
  | { type: 'CREATE_SCENE'; payload: { id: string; name: string } }
  | { type: 'DELETE_SCENE'; payload: string } // sceneId
  | { type: 'SWITCH_SCENE'; payload: string } // sceneId
  | { type: 'SAVE_CURRENT_SCENE'; payload?: void }
  | { type: 'LOAD_SCENE'; payload: SceneData }
  | { type: 'RENAME_SCENE'; payload: { id: string; newName: string } }
  | { type: 'IMPORT_SCENES'; payload: SceneData[] }
  | { type: 'EXPORT_SCENES'; payload?: void }
  // 场景组合相关
  | { type: "SET_SCENE_COMPOSITION_MODE"; payload: SceneCompositionMode }
  | { type: "SET_SELECTED_SCENES"; payload: string[] }
  | { type: "TOGGLE_SCENE_LOCK"; payload: string }
  | { type: "RESET_SCENE_COMPOSITION"; payload?: void }
  // 项目管理相关
  | { type: "SWITCH_PROJECT"; payload: { projectId: string } }
  | { type: "LOAD_PROJECT_SCENES"; payload: { projectId: string } }
  | { type: "CREATE_PROJECT"; payload: { project: any } }
  | { type: "LOAD_PROJECT_DATA"; payload: { scenes: any; currentSceneId: string } };

// 场景相关
export const createScene = (id: string, name: string) => ({
  type: 'CREATE_SCENE' as const,
  payload: { id, name }
});

export const deleteScene = (sceneId: string) => ({
  type: 'DELETE_SCENE' as const,
  payload: sceneId
});

export const switchScene = (sceneId: string) => ({
  type: 'SWITCH_SCENE' as const,
  payload: sceneId
});

export const saveCurrentScene = () => ({
  type: 'SAVE_CURRENT_SCENE' as const
});

export const renameScene = (id: string, newName: string) => ({
  type: 'RENAME_SCENE' as const,
  payload: { id, newName }
});

// 物理运行/暂停
export const setPhysicsRunning = (running: boolean): EditorAction => ({
  type: "SET_PHYSICS_RUNNING",
  payload: running,
});

// 添加物理组件
export const addPhysicsComponent = (entityId: string, component: import("./types").PhysicsComponent): EditorAction => ({
  type: "ADD_PHYSICS_COMPONENT",
  payload: { entityId, component },
});

// 移除物理组件
export const removePhysicsComponent = (entityId: string): EditorAction => ({
  type: "REMOVE_PHYSICS_COMPONENT",
  payload: { entityId },
});

// 更新物理组件
export const updatePhysicsComponent = (entityId: string, updates: Partial<import("./types").PhysicsComponent>): EditorAction => ({
  type: "UPDATE_PHYSICS_COMPONENT",
  payload: { entityId, updates },
});


export const addEntity = (entity: Entity): EditorAction => ({
  type: "ADD_ENTITY" as const,
  payload: entity,
});

export const removeEntity = (id: string): EditorAction => ({
  type: "REMOVE_ENTITY" as const,
  payload: { id },
});

export const selectEntity = (id: string | null): EditorAction => ({
  type: "SELECT_ENTITY" as const,
  payload: id,
});

export const updateEntity = (id: string, updates: Partial<Entity>): EditorAction => ({
  type: "UPDATE_ENTITY" as const,
  payload: { id, updates },
});


export const updateEntityProperty = (
  id: string,
  property: EntityProperty | string,
  value: number | [number, number, number, number] | string
) => {
  // 只允许受支持的属性
  const allowedPosition = ["position.x", "position.y", "x", "y"];
  // 扩展支持 UI 组件所有属性
  const allowedProperties = [
    "width", "height", "color", "texture",
    "text", "textColor", "fontSize", "backgroundType", "textAlign"
  ];
  if (typeof property === 'string' && allowedPosition.includes(property)) {
    // 支持 position.x/y
    const axis = property.endsWith('.x') ? 'x' : property.endsWith('.y') ? 'y' : property;
    return updateEntity(id, {
      position: {
        [axis]: value as number,
      },
    } as Partial<Entity>);
  } else if (typeof property === 'string' && allowedProperties.includes(property)) {
    // 支持 width/height/color/texture
    return updateEntity(id, {
      properties: {
        [property]: value,
      },
    } as Partial<Entity>);
  } else {
    // 不支持的属性直接忽略
    return { type: "IGNORE_UPDATE_ENTITY_PROPERTY" } as any;
  }
};

export const addTexture = (texture: TextureResource) => ({
  type: ADD_TEXTURE,
  payload: texture,
});

export const updateEntityTexture = (entityId: string, textureId: string) => ({
  type: "UPDATE_ENTITY_TEXTURE",
  payload: { entityId, textureId },
});


export const playAnimation = (entityId: string, name: string, loop?: boolean): EditorAction => ({
  type: "PLAY_ANIMATION" as const,
  payload: { entityId, name, ...(typeof loop === 'boolean' ? { loop } : {}) }
});

export const pauseAnimation = (entityId: string): EditorAction => ({
  type: "PAUSE_ANIMATION" as const,
  payload: { entityId }
});

export const stopAnimation = (entityId: string): EditorAction => ({
  type: "STOP_ANIMATION" as const,
  payload: { entityId }
});

// 场景组合相关actions
export const setSceneCompositionMode = (mode: SceneCompositionMode): EditorAction => ({
  type: "SET_SCENE_COMPOSITION_MODE" as const,
  payload: mode
});

export const setSelectedScenes = (sceneIds: string[]): EditorAction => ({
  type: "SET_SELECTED_SCENES" as const,
  payload: sceneIds
});

export const toggleSceneLock = (sceneId: string): EditorAction => ({
  type: "TOGGLE_SCENE_LOCK" as const,
  payload: sceneId
});

export const resetSceneComposition = (): EditorAction => ({
  type: "RESET_SCENE_COMPOSITION" as const,
  payload: undefined
});
