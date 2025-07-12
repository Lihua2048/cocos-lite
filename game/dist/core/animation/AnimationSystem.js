import { AnimationState } from "./AnimationState";
import { SceneManager } from "../scene/SceneManager";
export const sceneManager = new SceneManager();
export class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.activeStates = new Map();
        this.entityAnimations = new Map();
        this.lastTime = 0;
    }
    registerAnimation(name, animation) {
        this.animations.set(name, animation);
    }
    getAllAnimations() {
        const result = {};
        this.animations.forEach((animation, name) => {
            result[name] = animation;
        });
        return result;
    }
    // 确保方法签名与声明文件一致
    playAnimation(entityId, name) {
        const animation = this.animations.get(name);
        if (animation) {
            const state = new AnimationState(animation);
            this.activeStates.set(`${entityId}_${name}`, state);
            this.entityAnimations.set(entityId, name);
            this.animate(state, entityId);
        }
        else {
            console.error(`Animation ${name} not found`);
        }
    }
    pauseAnimation(entityId) {
        const animationName = this.entityAnimations.get(entityId);
        if (animationName) {
            const state = this.activeStates.get(`${entityId}_${animationName}`);
            if (state) {
                state.pause();
            }
        }
    }
    animate(state, entityId) {
        const now = performance.now();
        const deltaTime = this.lastTime === 0 ? 0.016 : (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (!state.isComplete()) {
            state.update(deltaTime);
            const value = state.getCurrentValue();
            const scene = sceneManager.getCurrentScene();
            const entity = scene?.getEntityById(entityId);
            if (entity) {
                entity.setAnimationValue(value);
                requestAnimationFrame(() => this.animate(state, entityId));
            }
            else {
                console.error(`Entity ${entityId} not found in scene`);
                this.cleanupAnimation(entityId, state);
            }
        }
        else {
            this.cleanupAnimation(entityId, state);
        }
    }
    cleanupAnimation(entityId, state) {
        const animationName = this.entityAnimations.get(entityId);
        if (animationName) {
            this.activeStates.delete(`${entityId}_${animationName}`);
            this.entityAnimations.delete(entityId);
            state.reset();
        }
    }
}
//# sourceMappingURL=AnimationSystem.js.map