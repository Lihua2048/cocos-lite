import { Animation } from './Animation';
import { AnimationState } from './AnimationState';

export class AnimationSystem {
  private animations: Map<string, Animation> = new Map();
  private activeStates: Map<string, AnimationState> = new Map();

  registerAnimation(name: string, animation: Animation) {
    this.animations.set(name, animation);
  }

  play(name: string) {
    const animation = this.animations.get(name);
    if (animation) {
      const state = new AnimationState(animation);
      this.activeStates.set(name, state);
      this.animate(state);
    }
  }

  private animate(state: AnimationState) {
    if (!state.isComplete()) {
      state.update(0.016); // 模拟16ms间隔
      requestAnimationFrame(() => this.animate(state));
    }
  }

  getAnimationState(name: string): AnimationState | undefined {
    return this.activeStates.get(name);
  }
}
