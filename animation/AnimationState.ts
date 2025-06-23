import { Animation } from './Animation';

export class AnimationState {
  private animation: Animation;
  private currentTime: number = 0;

  constructor(animation: Animation) {
    this.animation = animation;
  }

  update(deltaTime: number) {
    this.currentTime = Math.min(
      this.currentTime + deltaTime,
      this.animation.duration
    );

    // 评估所有动画曲线
    this.animation.curves.forEach(curve => {
      curve.evaluate(this.currentTime);
    });
  }

  isComplete(): boolean {
    return this.currentTime >= this.animation.duration;
  }
}
