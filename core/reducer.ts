// core/reducer.ts

import { EditorState } from "./types";
import { EditorAction } from "./actions";

// 修复：明确定义 reducer 类型
export function editorReducer(
  state: EditorState | undefined = initialState,
  action: EditorAction
): EditorState {
  // 处理状态初始化
  if (state === undefined) {
    return initialState;
  }

  switch (action.type) {
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

      // 合并更新，特别处理位置更新
      return {
        ...state,
        entities: {
          ...state.entities,
          [id]: {
            ...existingEntity,
            ...updates,
            // 确保位置对象被正确合并
            position: {
              ...existingEntity.position,
              ...(updates.position || {}),
            },
            properties: {
              ...existingEntity.properties,
              ...(updates.properties || {}),
            },
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

    default:
      return state;
  }
}

// 初始化状态
const initialState: EditorState = {
  entities: {},
  selectedEntityId: null,
};
