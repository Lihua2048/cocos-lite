
import { AnimationCurve } from './AnimationCurve';
export class Animation {
  public duration: number = 0;
  public curves: AnimationCurve[] = [];

  evaluate(time: number): number {
    let value = 0;
    this.curves.forEach(curve => {
      if (time >= curve.startTime && time <= curve.endTime) {
        value = curve.evaluate(time - curve.startTime);
      }
    });
    return value;
  }
}
