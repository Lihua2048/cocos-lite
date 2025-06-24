import {
  ADD_ENTITY,
  REMOVE_ENTITY,
  SELECT_ENTITY,
  UPDATE_ENTITY
} from './types';

import { Entity, EntityProperty } from './types';

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

export const updateEntityProperty = (
  id: string,
  property: EntityProperty,
  value: number | [number, number, number, number]
) => {
  // 修复位置更新
  if (property === "x" || property === "y") {
    return updateEntity(id, {
      position: {
        [property]: value as number
      }
    } as Partial<Entity>); // 添加类型断言
  }
  // 修复属性更新
  else {
    return updateEntity(id, {
      properties: {
        [property]: value
      }
    } as Partial<Entity>); // 添加类型断言
  }
};
