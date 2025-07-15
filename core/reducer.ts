// core/reducer.ts
// core/reducer.ts

import { EditorState, SceneData, SceneCompositionMode } from "./types";
import { EditorAction } from "./actions";
import { AutoSave } from "./utils/autoSave";

// 修复：明确定义 reducer 类型
const initialState: EditorState = {
  entities: {},
  selectedEntityId: null,
  textures: [],
  animations: {},
  physicsRunning: true,
  scenes: {
    'default': {
      id: 'default',
      name: '默认场景',
      entities: {},
      animations: {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityCount: 0
      }
    }
  },
  currentSceneId: 'default',
  sceneHistory: ['default'],
  sceneComposition: {
    mode: SceneCompositionMode.DEFAULT,
    selectedScenes: [],
    lockedScenes: {}
  }
};

export function editorReducer(
  state: EditorState = initialState,
  action: EditorAction
): EditorState {
  // 处理状态初始化
  if (state === undefined) {
    return initialState;
  }

  switch (action.type) {
    case 'SET_PHYSICS_RUNNING': {
      return {
        ...state,
        physicsRunning: action.payload,
      };
    }
    case 'SAVE_ANIMATION': {
      const { name, propertyName, keyframes, duration } = action.payload as any;
      return {
        ...state,
        animations: {
          ...state.animations,
          [name]: { propertyName, keyframes, duration: duration || 10 }
        }
      };
    }
    case "ADD_ENTITY": {
      // 类型安全兜底，防止 color/backgroundType 被污染
      const entity = action.payload;
      if (entity.type === 'ui-button' || entity.type === 'ui-input' || entity.type === 'ui-text') {
        let props = entity.properties as any;
        // color 兜底
        let safeColor: [number, number, number, number] = [0.9,0.9,0.9,1];
        if (Array.isArray(props.color) && props.color.length === 4 && props.color.every((v: any) => typeof v === 'number' && !isNaN(v))) {
          safeColor = [props.color[0], props.color[1], props.color[2], props.color[3]];
        }
        // backgroundType 只允许 'color' | 'image'
        let safeBackgroundType: 'color' | 'image' = 'color';
        if (props.backgroundType === 'image') safeBackgroundType = 'image';
        // textColor 兜底
        let safeTextColor: [number, number, number, number] = [0,0,0,1];
        if (Array.isArray(props.textColor) && props.textColor.length === 4 && props.textColor.every((v: any) => typeof v === 'number' && !isNaN(v))) {
          safeTextColor = [props.textColor[0], props.textColor[1], props.textColor[2], props.textColor[3]];
        }
        // fontSize 兜底
        let safeFontSize = 16;
        if (typeof props.fontSize === 'number' && !isNaN(props.fontSize)) safeFontSize = props.fontSize;
        // textAlign 只允许 'left' | 'center' | 'right'
        let safeTextAlign: 'left' | 'center' | 'right' = 'left';
        if (props.textAlign === 'center' || props.textAlign === 'right') safeTextAlign = props.textAlign;
        entity.properties = {
          width: props.width,
          height: props.height,
          color: safeColor,
          backgroundType: safeBackgroundType,
          texture: props.texture !== undefined ? props.texture : undefined,
          text: typeof props.text === 'string' ? props.text : '',
          textColor: safeTextColor,
          fontSize: safeFontSize,
          textAlign: safeTextAlign,
        };
      } else if (entity.type === 'sprite') {
        let props = entity.properties as any;
        let safeColor: [number, number, number, number] = [1,1,1,1];
        if (Array.isArray(props.color) && props.color.length === 4 && props.color.every((v: any) => typeof v === 'number' && !isNaN(v))) {
          safeColor = [props.color[0], props.color[1], props.color[2], props.color[3]];
        }
        entity.properties = {
          width: props.width,
          height: props.height,
          color: safeColor,
          ...(props.texture !== undefined ? { texture: props.texture } : {}),
          ...(props.angle !== undefined ? { angle: props.angle } : {})
        };
      }
      // 同时保存到当前场景的entities中
      const currentSceneId = state.currentSceneId;
      const updatedScenes = currentSceneId && state.scenes[currentSceneId] ? {
        ...state.scenes,
        [currentSceneId]: {
          ...state.scenes[currentSceneId],
          entities: {
            ...(state.scenes[currentSceneId].entities || {}),
            [entity.id]: entity,
          },
          metadata: {
            ...(state.scenes[currentSceneId].metadata || {}),
            updatedAt: new Date().toISOString(),
            entityCount: Object.keys(state.scenes[currentSceneId].entities || {}).length + 1
          }
        }
      } : state.scenes;

      console.log('ADD_ENTITY: Added entity', entity.id, 'to scene', currentSceneId);
      console.log('ADD_ENTITY: Scene entities now:', updatedScenes[currentSceneId!]?.entities ? Object.keys(updatedScenes[currentSceneId!].entities) : 'none');

      return {
        ...state,
        entities: {
          ...state.entities,
          [entity.id]: entity,
        },
        scenes: updatedScenes,
      };
    }

    case "SELECT_ENTITY": {
      return {
        ...state,
        selectedEntityId: action.payload,
      };
    }

    case "UPDATE_ENTITY": {
      const { id, updates } = action.payload;
      const existingEntity = state.entities[id];
      if (!existingEntity) return state;
      // 类型安全地合并 properties，严格区分类型，且过滤 undefined，防止属性丢失
      function filterUndefined<T extends object>(obj: Partial<T>): Partial<T> {
        const result: any = {};
        for (const key in obj) {
          const v = obj[key];
          // 过滤 undefined/null/空数组/空对象
          if (
            v !== undefined &&
            v !== null &&
            !(Array.isArray(v) && v.length === 0) &&
            !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
          ) {
            result[key] = v;
          }
        }
        return result as Partial<T>;
      }
      if (existingEntity.type === 'sprite') {
        // 只保留 sprite 合法字段
        const merged = {
          ...existingEntity.properties,
          ...filterUndefined<import("./types").SpriteProperties>(updates.properties as Partial<import("./types").SpriteProperties> || {}),
        };
        let safeColor: [number, number, number, number] = [1,1,1,1];
        if (Array.isArray((updates.properties as any)?.color) && (updates.properties as any).color.length === 4 && (updates.properties as any).color.every((v: any) => typeof v === 'number')) {
          safeColor = [
            (updates.properties as any).color[0],
            (updates.properties as any).color[1],
            (updates.properties as any).color[2],
            (updates.properties as any).color[3],
          ];
        } else if (Array.isArray(merged.color) && merged.color.length === 4 && merged.color.every((v: any) => typeof v === 'number')) {
          safeColor = [merged.color[0], merged.color[1], merged.color[2], merged.color[3]];
        }
        const spriteProps: import("./types").SpriteProperties = {
          width: merged.width,
          height: merged.height,
          color: safeColor,
          ...(merged.texture !== undefined ? { texture: merged.texture } : {}),
          ...(merged.angle !== undefined ? { angle: merged.angle } : {})
        };
        return {
          ...state,
          entities: {
            ...state.entities,
            [id]: {
              ...existingEntity,
              ...updates,
              type: 'sprite',
              position: {
                ...existingEntity.position,
                ...(updates.position || {}),
              },
              properties: spriteProps,
              components: updates.components
                ? updates.components
                : existingEntity.components,
            },
          },
        };
      } else {
        // 只保留 UI 合法字段
        const merged = {
          ...existingEntity.properties,
          ...filterUndefined<import("./types").UIProperties>(updates.properties as Partial<import("./types").UIProperties> || {}),
        };
        // color 字段强类型兜底
        let safeColorUI: [number, number, number, number] = [0.9,0.9,0.9,1];
        if (Array.isArray((updates.properties as any)?.color) && (updates.properties as any).color.length === 4 && (updates.properties as any).color.every((v: any) => typeof v === 'number')) {
          safeColorUI = [
            (updates.properties as any).color[0],
            (updates.properties as any).color[1],
            (updates.properties as any).color[2],
            (updates.properties as any).color[3],
          ];
        } else if (Array.isArray(merged.color) && merged.color.length === 4 && merged.color.every((v: any) => typeof v === 'number')) {
          safeColorUI = [merged.color[0], merged.color[1], merged.color[2], merged.color[3]];
        }
        // 再次兜底，防止 merged.color 被污染
        if (!Array.isArray(safeColorUI) || safeColorUI.length !== 4 || safeColorUI.some(v => typeof v !== 'number')) {
          safeColorUI = [0.9,0.9,0.9,1];
        }
        // backgroundType 兜底
        // backgroundType 只允许 'color' | 'image'
        let safeBackgroundType: 'color' | 'image' = 'color';
        if (merged.backgroundType === 'image') safeBackgroundType = 'image';

        // textColor 兜底，且防止 NaN
        let safeTextColor: [number, number, number, number] = [0,0,0,1];
        if (
          Array.isArray(merged.textColor) &&
          merged.textColor.length === 4 &&
          merged.textColor.every((v: any) => typeof v === 'number' && !isNaN(v))
        ) {
          safeTextColor = [merged.textColor[0], merged.textColor[1], merged.textColor[2], merged.textColor[3]];
        }

        // fontSize 兜底，且防止 NaN
        let safeFontSize = 16;
        if (typeof merged.fontSize === 'number' && !isNaN(merged.fontSize)) safeFontSize = merged.fontSize;

        // textAlign 只允许 'left' | 'center' | 'right'
        let safeTextAlign: 'left' | 'center' | 'right' = 'left';
        if (merged.textAlign === 'center' || merged.textAlign === 'right') safeTextAlign = merged.textAlign;

        const uiProps: import("./types").UIProperties = {
          width: merged.width,
          height: merged.height,
          color: safeColorUI,
          backgroundType: safeBackgroundType,
          texture: merged.texture !== undefined ? merged.texture : undefined,
          text: typeof merged.text === 'string' ? merged.text : '',
          textColor: safeTextColor,
          fontSize: safeFontSize,
          textAlign: safeTextAlign,
        };
        return {
          ...state,
          entities: {
            ...state.entities,
            [id]: {
              ...existingEntity,
              ...updates,
              type: existingEntity.type, // 'ui-button' | 'ui-input' | 'ui-text'
              position: {
                ...existingEntity.position,
                ...(updates.position || {}),
              },
              properties: uiProps,
              components: updates.components
                ? updates.components
                : existingEntity.components,
            },
          },
        };
      }
    }

    // 物理组件相关
    case "ADD_PHYSICS_COMPONENT": {
      const { entityId, component } = action.payload;
      const entity = state.entities[entityId];
      if (!entity) return state;
      // 若已存在物理组件则替换，否则添加
      const newComponents = [
        ...entity.components.filter(c => c.type !== 'physics'),
        component,
      ];
      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            components: newComponents,
          },
        },
      };
    }
    case "REMOVE_PHYSICS_COMPONENT": {
      const { entityId } = action.payload;
      const entity = state.entities[entityId];
      if (!entity) return state;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            components: entity.components.filter(c => c.type !== 'physics'),
          },
        },
      };
    }
    case "UPDATE_PHYSICS_COMPONENT": {
      const { entityId, updates } = action.payload;
      const entity = state.entities[entityId];
      if (!entity) return state;
      const newComponents = entity.components.map(c =>
        c.type === 'physics' ? { ...c, ...updates } : c
      );
      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            components: newComponents,
          },
        },
      };
    }

    case "REMOVE_ENTITY": {
      const { id } = action.payload;
      const { [id]: _, ...remainingEntities } = state.entities;

      return {
        ...state,
        entities: remainingEntities,
        selectedEntityId:
          state.selectedEntityId === id ? null : state.selectedEntityId,
      };
    }

    case "ADD_TEXTURE":
      return {
        ...state,
        textures: [...state.textures, action.payload],
      };

    case "UPDATE_ENTITY_TEXTURE": {
      const { entityId, textureId } = action.payload;
      const entity = state.entities[entityId];
      if (!entity) return state;
      if (entity.type === 'sprite') {
        return {
          ...state,
          entities: {
            ...state.entities,
            [entityId]: {
              ...entity,
              type: 'sprite',
              properties: {
                ...entity.properties,
                texture: textureId,
              },
            },
          },
        };
      } else {
        // UIEntity
        return {
          ...state,
          entities: {
            ...state.entities,
            [entityId]: {
              ...entity,
              type: entity.type,
              properties: {
                ...entity.properties,
                texture: textureId,
              },
            },
          },
        };
      }
    }

    case "PLAY_ANIMATION": {
      const { entityId, name } = action.payload;
      // 兼容 AnimationControls 传 loop，未传时默认 false
      const loop = typeof action.payload.loop === 'boolean' ? action.payload.loop : false;
      const entity = state.entities[entityId];

      if (!entity) {
        console.error(`Entity ${entityId} not found`);
        return state;
      }

      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            animation: {
              ...(entity.animation || {}),
              playing: true,
              currentAnimation: name,
              currentTime: entity.animation?.currentTime || 0,
              loop: loop === true,
            },
          },
        },
      };
    }

    // 修改PAUSE_ANIMATION case
    case "PAUSE_ANIMATION": {
      const { entityId } = action.payload;
      const entity = state.entities[entityId];

      if (!entity || !entity.animation) return state;

      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            animation: {
              ...entity.animation,
              playing: false,
            },
          },
        },
      };
    }

    // 修改STOP_ANIMATION case
    case "STOP_ANIMATION": {
      const { entityId } = action.payload;
      const entity = state.entities[entityId];

      if (!entity) return state;

      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            animation: {
              ...entity.animation,
              playing: false,
              currentTime: 0,
            },
          },
        },
      };
    }

    case "UPDATE_ENTITY_ANIMATION": {
      const { entityId, animation } = action.payload;
      const entity = state.entities[entityId];

      if (!entity) return state;

      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...entity,
            animation: {
              ...entity.animation,
              ...animation,
            },
          },
        },
      };
    }

    case 'CREATE_SCENE': {
      const { id, name } = action.payload;
      const newScene: SceneData = {
        id,
        name,
        entities: {},
        animations: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          entityCount: 0
        }
      };
      return {
        ...state,
        scenes: {
          ...state.scenes,
          [id]: newScene
        }
      };
    }

    case 'DELETE_SCENE': {
      const sceneId = action.payload;
      if (sceneId === state.currentSceneId) {
        // 不能删除当前场景，需要先切换到其他场景
        return state;
      }
      const { [sceneId]: deletedScene, ...remainingScenes } = state.scenes;
      return {
        ...state,
        scenes: remainingScenes,
        sceneHistory: state.sceneHistory.filter(id => id !== sceneId)
      };
    }

    case 'SWITCH_SCENE': {
      const sceneId = action.payload;
      if (!state.scenes[sceneId] || sceneId === state.currentSceneId) {
        console.log('SWITCH_SCENE: Invalid scene or same scene', sceneId);
        return state;
      }

      console.log('SWITCH_SCENE: Switching from', state.currentSceneId, 'to', sceneId);
      console.log('SWITCH_SCENE: Current entities before save:', Object.keys(state.entities));

      // 保存当前场景状态
      const currentScene = state.scenes[state.currentSceneId!];
      const updatedCurrentScene = {
        ...currentScene,
        entities: state.entities,
        animations: state.animations,
        metadata: {
          ...currentScene.metadata,
          updatedAt: new Date().toISOString(),
          entityCount: Object.keys(state.entities).length
        }
      };

      // 加载目标场景
      const targetScene = state.scenes[sceneId];
      console.log('SWITCH_SCENE: Loading target scene entities:', Object.keys(targetScene?.entities || {}));

      return {
        ...state,
        currentSceneId: sceneId,
        entities: targetScene?.entities || {},
        animations: targetScene?.animations || {},
        selectedEntityId: null, // 切换场景时清除选中
        scenes: {
          ...state.scenes,
          [state.currentSceneId!]: updatedCurrentScene
        },
        sceneHistory: [sceneId, ...state.sceneHistory.filter(id => id !== sceneId)].slice(0, 10) // 保留最近10个
      };
    }

    case 'SAVE_CURRENT_SCENE': {
      if (!state.currentSceneId) return state;

      console.log('SAVE_CURRENT_SCENE: Saving scene', state.currentSceneId);
      console.log('SAVE_CURRENT_SCENE: Current entities:', Object.keys(state.entities));

      const currentScene = state.scenes[state.currentSceneId];
      const updatedScene = {
        ...currentScene,
        entities: state.entities,
        animations: state.animations,
        metadata: {
          ...currentScene.metadata,
          updatedAt: new Date().toISOString(),
          entityCount: Object.keys(state.entities).length
        }
      };

      console.log('SAVE_CURRENT_SCENE: Saved entities:', Object.keys(updatedScene?.entities || {}));

      return {
        ...state,
        scenes: {
          ...state.scenes,
          [state.currentSceneId]: updatedScene
        }
      };
    }

    case 'RENAME_SCENE': {
      const { id, newName } = action.payload;
      if (!state.scenes[id]) return state;

      return {
        ...state,
        scenes: {
          ...state.scenes,
          [id]: {
            ...state.scenes[id],
            name: newName,
            metadata: {
              ...state.scenes[id].metadata,
              updatedAt: new Date().toISOString()
            }
          }
        }
      };
    }

    // 场景组合相关
    case 'SET_SCENE_COMPOSITION_MODE': {
      const newMode = action.payload;
      let newSelectedScenes: string[] = [];

      if (newMode === SceneCompositionMode.OVERLAY) {
        // 叠加模式：选中所有场景
        newSelectedScenes = Object.keys(state.scenes);
      } else if (newMode === SceneCompositionMode.DEFAULT || newMode === SceneCompositionMode.MIXED) {
        // 默认模式和混合模式：不预选场景
        newSelectedScenes = [];
      }

      console.log('SET_SCENE_COMPOSITION_MODE: Setting mode to', newMode);
      console.log('SET_SCENE_COMPOSITION_MODE: Available scenes:', Object.keys(state.scenes));
      console.log('SET_SCENE_COMPOSITION_MODE: New selected scenes:', newSelectedScenes);

      return {
        ...state,
        sceneComposition: {
          ...state.sceneComposition,
          mode: newMode,
          selectedScenes: newSelectedScenes,
          // 重置锁定状态
          lockedScenes: {}
        }
      };
    }

    case 'SET_SELECTED_SCENES': {
      console.log('SET_SELECTED_SCENES: Setting selected scenes to', action.payload);
      return {
        ...state,
        sceneComposition: {
          ...state.sceneComposition,
          selectedScenes: action.payload
        }
      };
    }

    case 'TOGGLE_SCENE_LOCK': {
      const sceneId = action.payload;
      return {
        ...state,
        sceneComposition: {
          ...state.sceneComposition,
          lockedScenes: {
            ...state.sceneComposition.lockedScenes,
            [sceneId]: !state.sceneComposition.lockedScenes[sceneId]
          }
        }
      };
    }

    case 'RESET_SCENE_COMPOSITION': {
      return {
        ...state,
        sceneComposition: {
          mode: SceneCompositionMode.DEFAULT,
          selectedScenes: [],
          lockedScenes: {}
        }
      };
    }

    case 'SWITCH_PROJECT': {
      // 当切换项目时，清空当前场景数据，重置为空状态
      return {
        ...initialState,
        sceneComposition: {
          mode: SceneCompositionMode.DEFAULT,
          selectedScenes: [],
          lockedScenes: {}
        }
      };
    }

    case 'LOAD_PROJECT_SCENES': {
      // 当加载项目场景时，从存储中加载对应的场景数据
      // 这里主要用于触发中间件加载数据，reducer本身不直接处理加载逻辑
      return state;
    }

    case 'LOAD_PROJECT_DATA': {
      // 加载项目数据，包括场景和当前场景ID
      const { scenes, currentSceneId } = action.payload;

      console.log('🔍 LOAD_PROJECT_DATA: 开始加载项目数据', {
        scenes: Object.keys(scenes || {}),
        currentSceneId,
        scenesCount: Object.keys(scenes || {}).length
      });

      // 如果没有场景数据，保持空状态
      if (!scenes || Object.keys(scenes).length === 0) {
        console.log('🔍 LOAD_PROJECT_DATA: 空项目，重置为初始状态');
        return {
          ...state,
          scenes: {
            'default': {
              id: 'default',
              name: '场景 1',
              entities: {},
              animations: {},
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                entityCount: 0
              }
            }
          },
          currentSceneId: 'default',
          sceneHistory: ['default'],
          entities: {},
          animations: {},
          selectedEntityId: null
        };
      }

      // 加载场景数据
      const sceneKeys = Object.keys(scenes || {});
      const targetSceneId = currentSceneId && scenes[currentSceneId] ? currentSceneId : sceneKeys[0];
      const targetScene = scenes[targetSceneId];

      console.log('🔍 LOAD_PROJECT_DATA: 加载完成', {
        targetSceneId,
        entitiesCount: Object.keys(targetScene?.entities || {}).length,
        totalScenes: sceneKeys.length,
        sceneName: targetScene?.name
      });

      return {
        ...state,
        scenes: scenes,
        currentSceneId: targetSceneId,
        sceneHistory: targetSceneId ? [targetSceneId] : [],
        entities: targetScene?.entities || {},
        animations: targetScene?.animations || {},
        selectedEntityId: null // 重置选中的实体
      };
    }

    case "LOAD_SAVED_STATE": {
      const savedState = action.payload;
      return {
        ...state,
        ...savedState,
        // 重置一些运行时状态
        selectedEntityId: null,
        physicsRunning: false
      };
    }

    default:
      return state;
  }
}

// 包装reducer以添加自动保存功能
export const editorReducerWithAutoSave = (state: EditorState = initialState, action: EditorAction): EditorState => {
  const newState = editorReducer(state, action);

  // 只在状态真正改变时才保存，且排除一些不需要保存的action
  const shouldSave = newState !== state && ![
    'SELECT_ENTITY',
    'SET_PHYSICS_RUNNING'
  ].includes(action.type);

  if (shouldSave) {
    // 异步保存，不阻塞UI
    AutoSave.saveEditorState(newState).catch(console.error);
  }

  return newState;
};

// 默认导出包装后的reducer
export default editorReducerWithAutoSave;

// （已上移并合并 initialState，避免重复声明）
