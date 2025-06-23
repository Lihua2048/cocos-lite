// core/reducer.ts

import { EditorState, EditorAction, EntityState } from './types';

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
    case 'ADD_ENTITY': {
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.id]: action.payload
        }
      };
    }

    case 'SELECT_ENTITY': {
      return {
        ...state,
        selectedEntityId: action.payload
      };
    }

    case 'UPDATE_ENTITY': {
      const { id, updates } = action.payload;
      const existingEntity = state.entities[id];

      if (!existingEntity) return state;

      return {
        ...state,
        entities: {
          ...state.entities,
          [id]: {
            ...existingEntity,
            ...updates
          }
        }
      };
    }

    case 'REMOVE_ENTITY': {
      const { id } = action.payload;
      const { [id]: _, ...remainingEntities } = state.entities;

      return {
        ...state,
        entities: remainingEntities,
        selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId
      };
    }

    default:
      return state;
  }
}

// 初始化状态
const initialState: EditorState = {
  entities: {},
  selectedEntityId: null
};
