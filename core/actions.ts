import {
  ADD_ENTITY,
  REMOVE_ENTITY,
  SELECT_ENTITY,
  UPDATE_ENTITY
} from './types';

import { EntityState } from './types';

// 定义action类型
export type EditorAction =
  | { type: typeof ADD_ENTITY; payload: EntityState }
  | { type: typeof REMOVE_ENTITY; payload: { id: string } }
  | { type: typeof SELECT_ENTITY; payload: string | null }
  | { type: typeof UPDATE_ENTITY; payload: { id: string; changes: Partial<EntityState> } };

// 创建action创建函数
export const addEntity = (entity: EntityState) => ({
  type: ADD_ENTITY,
  payload: entity,
});

export const removeEntity = (id: string) => ({
  type: REMOVE_ENTITY,
  payload: { id },
});

export const selectEntity = (id: string | null) => ({
  type: SELECT_ENTITY,
  payload: id,
});

export const updateEntity = (id: string, changes: Partial<EntityState>) => ({
  type: UPDATE_ENTITY,
  payload: { id, changes },
});
