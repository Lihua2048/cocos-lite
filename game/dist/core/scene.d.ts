import { Entity as EntityClass } from "./entity";
import { AnimationSystem } from "./animation/AnimationSystem";
import { SceneManager } from "./scene/SceneManager";
import { SceneData } from "./types";
export declare const sceneManager: SceneManager;
export declare class Scene {
    animationSystem?: AnimationSystem | undefined;
    private entities;
    id?: string;
    name?: string;
    createdAt?: string;
    constructor(animationSystem?: AnimationSystem | undefined);
    /**
     * 序列化场景数据
     */
    serialize(): SceneData;
    private convertAnimationsToInterface;
    /**
     * 从序列化数据恢复场景
     */
    static deserialize(data: SceneData): Scene;
    private registerDefaultAnimations;
    playAnimation(entityId: string, name: string): void;
    pauseAnimation(entityId: string): void;
    getEntityById(id: string): EntityClass | undefined;
    addEntity(entity: EntityClass): void;
    removeEntity(id: string): void;
    getEntities(): EntityClass[];
    update(deltaTime: number): void;
    render(): void;
    private logRender;
}
