export class AnimationCurve {
  public startTime: number = 0;
  public endTime: number = 1;
  public easing: (t: number) => number = t => t;

  evaluate(deltaTime: number): number {
    const t = deltaTime / (this.endTime - this.startTime);
    return this.easing(t);
  }
}
