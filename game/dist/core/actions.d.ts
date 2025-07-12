export declare const saveAnimation: (name: string, propertyName: string, keyframes: any[]) => {
    type: string;
    payload: {
        name: string;
        propertyName: string;
        keyframes: any[];
    };
};
import { Entity, EntityProperty, SceneData, TextureResource } from "./types";
export declare const ADD_ENTITY = "ADD_ENTITY";
export declare const REMOVE_ENTITY = "REMOVE_ENTITY";
export declare const SELECT_ENTITY = "SELECT_ENTITY";
export declare const UPDATE_ENTITY = "UPDATE_ENTITY";
export declare const ADD_TEXTURE = "ADD_TEXTURE";
export declare const UPDATE_ENTITY_TEXTURE = "UPDATE_ENTITY_TEXTURE";
export declare const PLAY_ANIMATION = "PLAY_ANIMATION";
export declare const PAUSE_ANIMATION = "PAUSE_ANIMATION";
export declare const STOP_ANIMATION = "STOP_ANIMATION";
import { Animation } from './types';
export type EditorAction = {
    type: "ADD_ENTITY";
    payload: Entity;
} | {
    type: "SELECT_ENTITY";
    payload: string | null;
} | {
    type: "UPDATE_ENTITY";
    payload: {
        id: string;
        updates: Partial<Entity>;
    };
} | {
    type: "REMOVE_ENTITY";
    payload: {
        id: string;
    };
} | {
    type: "ADD_TEXTURE";
    payload: string;
} | {
    type: "UPDATE_ENTITY_TEXTURE";
    payload: {
        entityId: string;
        textureId: string;
    };
} | {
    type: "PLAY_ANIMATION";
    payload: {
        entityId: string;
        name: string;
        loop?: boolean;
    };
} | {
    type: "PAUSE_ANIMATION";
    payload: {
        entityId: string;
    };
} | {
    type: "STOP_ANIMATION";
    payload: {
        entityId: string;
    };
} | {
    type: "SAVE_ANIMATION";
    payload: {
        name: string;
        propertyName: string;
        keyframes: Animation['keyframes'];
    };
} | {
    type: "ADD_PHYSICS_COMPONENT";
    payload: {
        entityId: string;
        component: import("./types").PhysicsComponent;
    };
} | {
    type: "REMOVE_PHYSICS_COMPONENT";
    payload: {
        entityId: string;
    };
} | {
    type: "UPDATE_PHYSICS_COMPONENT";
    payload: {
        entityId: string;
        updates: Partial<import("./types").PhysicsComponent>;
    };
} | {
    type: "SET_PHYSICS_RUNNING";
    payload: boolean;
} | {
    type: 'CREATE_SCENE';
    payload: {
        id: string;
        name: string;
    };
} | {
    type: 'DELETE_SCENE';
    payload: string;
} | {
    type: 'SWITCH_SCENE';
    payload: string;
} | {
    type: 'SAVE_CURRENT_SCENE';
    payload?: void;
} | {
    type: 'LOAD_SCENE';
    payload: SceneData;
} | {
    type: 'RENAME_SCENE';
    payload: {
        id: string;
        newName: string;
    };
} | {
    type: 'IMPORT_SCENES';
    payload: SceneData[];
} | {
    type: 'EXPORT_SCENES';
    payload?: void;
};
export declare const createScene: (id: string, name: string) => {
    type: "CREATE_SCENE";
    payload: {
        id: string;
        name: string;
    };
};
export declare const deleteScene: (sceneId: string) => {
    type: "DELETE_SCENE";
    payload: string;
};
export declare const switchScene: (sceneId: string) => {
    type: "SWITCH_SCENE";
    payload: string;
};
export declare const saveCurrentScene: () => {
    type: "SAVE_CURRENT_SCENE";
};
export declare const renameScene: (id: string, newName: string) => {
    type: "RENAME_SCENE";
    payload: {
        id: string;
        newName: string;
    };
};
export declare const setPhysicsRunning: (running: boolean) => EditorAction;
export declare const addPhysicsComponent: (entityId: string, component: import("./types").PhysicsComponent) => EditorAction;
export declare const removePhysicsComponent: (entityId: string) => EditorAction;
export declare const updatePhysicsComponent: (entityId: string, updates: Partial<import("./types").PhysicsComponent>) => EditorAction;
export declare const addEntity: (entity: Entity) => EditorAction;
export declare const removeEntity: (id: string) => EditorAction;
export declare const selectEntity: (id: string | null) => EditorAction;
export declare const updateEntity: (id: string, updates: Partial<Entity>) => EditorAction;
export declare const updateEntityProperty: (id: string, property: EntityProperty | string, value: number | [number, number, number, number] | string) => any;
export declare const addTexture: (texture: TextureResource) => {
    type: string;
    payload: TextureResource;
};
export declare const updateEntityTexture: (entityId: string, textureId: string) => {
    type: string;
    payload: {
        entityId: string;
        textureId: string;
    };
};
export declare const playAnimation: (entityId: string, name: string, loop?: boolean) => EditorAction;
export declare const pauseAnimation: (entityId: string) => EditorAction;
export declare const stopAnimation: (entityId: string) => EditorAction;
