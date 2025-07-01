// core/reducer.ts
// core/reducer.ts

import { EditorState } from "./types";
import { EditorAction } from "./actions";

// 修复：明确定义 reducer 类型
const initialState: EditorState = {
  entities: {},
  selectedEntityId: null,
  textures: [],
  animations: {},
  physicsRunning: true,
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
      const { name, propertyName, keyframes } = action.payload;
      return {
        ...state,
        animations: {
          ...state.animations,
          [name]: { propertyName, keyframes }
        }
      };
    }
    case "ADD_ENTITY": {
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.id]: action.payload,
        },
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
      // 合并更新，特别处理 position/properties/components
      return {
        ...state,
        entities: {
          ...state.entities,
          [id]: {
            ...existingEntity,
            ...updates,
            position: {
              ...existingEntity.position,
              ...(updates.position || {}),
            },
            properties: {
              ...existingEntity.properties,
              ...(updates.properties || {}),
            },
            components: updates.components
              ? updates.components
              : existingEntity.components,
          },
        },
      };
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
      return {
        ...state,
        entities: {
          ...state.entities,
          [entityId]: {
            ...state.entities[entityId],
            properties: {
              ...state.entities[entityId].properties,
              texture: textureId,
            },
          },
        },
      };
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

    default:
      return state;
  }
}

// （已上移并合并 initialState，避免重复声明）
