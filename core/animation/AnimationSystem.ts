import { Animation } from './Animation';
import { AnimationState } from './AnimationState';
import { Entity } from '../entity';
import { SceneManager } from '../scene/SceneManager';

export const sceneManager = new SceneManager();

export class AnimationSystem {
  private animations: Map<string, Animation> = new Map();
  private activeStates: Map<string, AnimationState> = new Map();
  private entityAnimations: Map<string, string> = new Map();
  private lastTime: number = 0;

  registerAnimation(name: string, animation: Animation) {
    this.animations.set(name, animation);
  }

  // 确保方法签名与声明文件一致
  public playAnimation(entityId: string, name: string) {
    const animation = this.animations.get(name);
    if (animation) {
      const state = new AnimationState(animation);
      this.activeStates.set(`${entityId}_${name}`, state);
      this.entityAnimations.set(entityId, name);
      this.animate(state, entityId);
    } else {
      console.error(`Animation ${name} not found`);
    }
  }


  public pauseAnimation(entityId: string) {
    const animationName = this.entityAnimations.get(entityId);
    if (animationName) {
      const state = this.activeStates.get(`${entityId}_${animationName}`);
      if (state) {
        state.pause();
      }
    }
  }

  private animate(state: AnimationState, entityId: string) {
    const now = performance.now();
    const deltaTime = this.lastTime === 0 ? 0.016 : (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (!state.isComplete()) {
      state.update(deltaTime);
      const value = state.getCurrentValue();

      const scene = sceneManager.getActiveScene();
      const entity = scene?.getEntityById(entityId);

      if (entity) {
        entity.setAnimationValue(value);
        requestAnimationFrame(() => this.animate(state, entityId));
      } else {
        console.error(`Entity ${entityId} not found in scene`);
        this.cleanupAnimation(entityId, state);
      }
    } else {
      this.cleanupAnimation(entityId, state);
    }
  }

  private cleanupAnimation(entityId: string, state: AnimationState) {
    const animationName = this.entityAnimations.get(entityId);
    if (animationName) {
      this.activeStates.delete(`${entityId}_${animationName}`);
      this.entityAnimations.delete(entityId);
      state.reset();
    }
  }
}
