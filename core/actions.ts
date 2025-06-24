import {
  ADD_ENTITY,
  REMOVE_ENTITY,
  SELECT_ENTITY,
  UPDATE_ENTITY
} from './types';

import { Entity } from './types';

// 定义action类型
export type EditorAction =
  | { type: typeof ADD_ENTITY; payload: Entity }
  | { type: typeof REMOVE_ENTITY; payload: { id: string } }
  | { type: typeof SELECT_ENTITY; payload: string | null }
  | { type: typeof UPDATE_ENTITY; payload: { id: string; updates: Partial<Entity> } };

export const addEntity = (entity: Entity) => ({
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

export const updateEntity = (id: string, updates: Partial<Entity>) => ({
  type: UPDATE_ENTITY,
  payload: { id, updates },
});
