import { Animation } from './Animation';

export class AnimationState {
  private animation: Animation;
  private currentTime: number = 0;
  private isPlaying: boolean = false;

  constructor(animation: Animation) {
    this.animation = animation;
  }

  update(deltaTime: number) {
    if (!this.isPlaying) return;

    this.currentTime += deltaTime;
    if (this.currentTime > this.animation.duration) {
      this.currentTime = this.animation.duration;
      this.isPlaying = false;
    }
  }

  getCurrentValue(): number {
    return this.animation.evaluate(this.currentTime);
  }

  isComplete(): boolean {
    return this.currentTime >= this.animation.duration;
  }

  // 添加 pause 方法
  pause() {
    this.isPlaying = false;
  }

  // 添加 reset 方法
  reset() {
    this.currentTime = 0;
    this.isPlaying = false;
  }

}
