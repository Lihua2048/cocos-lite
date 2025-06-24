import {
  Entity,
  EntityProperty,
  TextureResource
} from './types';

export const ADD_ENTITY = 'ADD_ENTITY';
export const REMOVE_ENTITY = 'REMOVE_ENTITY';
export const SELECT_ENTITY = 'SELECT_ENTITY';
export const UPDATE_ENTITY = 'UPDATE_ENTITY';
export const ADD_TEXTURE = 'ADD_TEXTURE';

export type EditorAction =
  | { type: 'ADD_ENTITY'; payload: Entity }
  | { type: 'SELECT_ENTITY'; payload: string | null }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; updates: Partial<Entity> } }
  | { type: 'REMOVE_ENTITY'; payload: { id: string } }
  | { type: 'ADD_TEXTURE'; payload: TextureResource }
  | { type: 'UPDATE_ENTITY_TEXTURE'; payload: { entityId: string; textureId: string } };

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
  if (property === "x" || property === "y") {
    return updateEntity(id, {
      position: {
        [property]: value as number
      }
    } as Partial<Entity>);
  } else {
    const propertiesUpdate: Partial<Entity> = {
      [property]: value
    };

    return updateEntity(id, {
      properties: propertiesUpdate
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
