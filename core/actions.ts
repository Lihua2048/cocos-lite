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

export type EditorAction =
  | { type: "ADD_ENTITY"; payload: Entity }
  | { type: "SELECT_ENTITY"; payload: string | null }
  | { type: "UPDATE_ENTITY"; payload: { id: string; updates: Partial<Entity> } }
  | { type: "REMOVE_ENTITY"; payload: { id: string } }
  | { type: "ADD_TEXTURE"; payload: string }
  | { type: "UPDATE_ENTITY_TEXTURE"; payload: { entityId: string; textureId: string } }
  | { type: "PLAY_ANIMATION"; payload: { entityId: string; name: string } }
  | { type: "PAUSE_ANIMATION"; payload: { entityId: string } }
  | { type: "STOP_ANIMATION"; payload: { entityId: string } };


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
  property: EntityProperty,
  value: number | [number, number, number, number] | string // 添加string类型
) => {
  if (property === "x" || property === "y") {
    return updateEntity(id, {
      position: {
        [property]: value as number,
      },
    } as Partial<Entity>);
  } else if (property === "texture") {
    // 处理纹理ID（字符串）
    return updateEntity(id, {
      properties: {
        [property]: value as string,
      },
    } as Partial<Entity>);
  } else {
    // 其他属性（width, height, color）
    const propertiesUpdate: Partial<Entity> = {
      [property]: value,
    };

    return updateEntity(id, {
      properties: propertiesUpdate,
    } as Partial<Entity>);
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
