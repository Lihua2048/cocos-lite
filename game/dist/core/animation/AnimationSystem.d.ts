import { Animation } from "./Animation";
import { SceneManager } from "../scene/SceneManager";
export declare const sceneManager: SceneManager;
export declare class AnimationSystem {
    private animations;
    private activeStates;
    private entityAnimations;
    private lastTime;
    registerAnimation(name: string, animation: Animation): void;
    getAllAnimations(): Record<string, Animation>;
    playAnimation(entityId: string, name: string): void;
    pauseAnimation(entityId: string): void;
    private animate;
    private cleanupAnimation;
}
