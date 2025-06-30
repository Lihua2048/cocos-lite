// 动画关键帧相关
export const saveAnimation = (name: string, propertyName: string, keyframes: any[]) => ({
  type: 'SAVE_ANIMATION',
  payload: { name, propertyName, keyframes }
});
import { Entity, EntityProperty, TextureResource } from "./types";


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
  | { type: "PLAY_ANIMATION"; payload: { entityId: string; name: string } }
  | { type: "PAUSE_ANIMATION"; payload: { entityId: string } }
  | { type: "STOP_ANIMATION"; payload: { entityId: string } }
  | { type: "SAVE_ANIMATION"; payload: { name: string; propertyName: string; keyframes: Animation['keyframes'] } };


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
  const allowedProperties = ["width", "height", "color", "texture"];
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


export const playAnimation = (entityId: string, name: string): EditorAction => ({
  type: "PLAY_ANIMATION" as const,
  payload: { entityId, name }
});

export const pauseAnimation = (entityId: string): EditorAction => ({
  type: "PAUSE_ANIMATION" as const,
  payload: { entityId }
});

export const stopAnimation = (entityId: string): EditorAction => ({
  type: "STOP_ANIMATION" as const,
  payload: { entityId }
});
