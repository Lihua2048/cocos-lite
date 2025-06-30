import { AnimationCurve } from './AnimationCurve';

// 使用单次导出语句统一处理
export class Animation {
  duration: number = 0;
  private curves: AnimationCurve[] = [];

  // 添加曲线方法
  public addAnimationCurve(curve: AnimationCurve) {
    this.curves.push(curve);
  }

  evaluate(time: number): number {
    let value = 0;
    this.curves.forEach(curve => {
      value += curve.evaluate(time);
    });
    return value;
  }
}


