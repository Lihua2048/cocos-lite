export interface EditorState {
    entities: Record<string, Entity>;
    selectedEntityId: string | null;
    textures: TextureResource[];
    animations: Record<string, Animation>;
    physicsRunning: boolean;
    scenes: Record<string, SceneData>;
    currentSceneId: string | null;
    sceneHistory: string[];
}
export type RootState = EditorState;
export type SceneActionType = "CREATE_SCENE" | "DELETE_SCENE" | "SWITCH_SCENE" | "SAVE_CURRENT_SCENE" | "LOAD_SCENE" | "RENAME_SCENE" | "IMPORT_SCENES" | "EXPORT_SCENES";
export interface SceneData {
    id: string;
    name: string;
    entities: Record<string, Entity>;
    animations: Record<string, Animation>;
    metadata: {
        createdAt: string;
        updatedAt: string;
        entityCount: number;
        description?: string;
    };
}
export interface Component {
    type: string;
}
export interface PhysicsComponent extends Component {
    type: 'physics';
    bodyType: 'dynamic' | 'static' | 'kinematic';
    density: number;
    friction: number;
    restitution: number;
    fixedRotation?: boolean;
}
export type SpriteProperties = {
    width: number;
    height: number;
    color: [number, number, number, number];
    texture?: string;
    angle?: number;
};
export type UIProperties = {
    width: number;
    height: number;
    backgroundType: 'color' | 'image';
    color: [number, number, number, number];
    texture?: string;
    text: string;
    textColor: [number, number, number, number];
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
};
export type Entity = {
    id: string;
    type: 'sprite';
    position: {
        x: number;
        y: number;
    };
    properties: SpriteProperties;
    components: (Component | PhysicsComponent)[];
    animation?: EntityAnimation;
} | {
    id: string;
    type: 'ui-button' | 'ui-input' | 'ui-text';
    position: {
        x: number;
        y: number;
    };
    properties: UIProperties;
    components: (Component | PhysicsComponent)[];
    animation?: EntityAnimation;
};
export type EntityProperty = 'width' | 'height' | 'color' | 'texture' | 'text' | 'fontSize' | 'x' | 'y';
export type TextureResource = string | {
    id: string;
    name: string;
    url: string;
};
export type EditorActionType = "ADD_ENTITY" | "SELECT_ENTITY" | "UPDATE_ENTITY" | "REMOVE_ENTITY" | "ADD_TEXTURE" | "UPDATE_ENTITY_TEXTURE" | "PLAY_ANIMATION" | "PAUSE_ANIMATION" | "STOP_ANIMATION" | "SAVE_ANIMATION";
export interface AnimationKeyframe {
    time: number;
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    color: [number, number, number, number];
    texture: string;
}
export interface Animation {
    propertyName: string;
    keyframes: AnimationKeyframe[];
}
export interface EntityAnimation {
    playing: boolean;
    currentAnimation?: string;
    currentTime: number;
    loop?: boolean;
}
export declare function createDefaultEntity(id: string, type: 'sprite' | 'ui-button' | 'ui-input' | 'ui-text'): Entity;
