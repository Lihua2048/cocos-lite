// 首先解决类型定义问题
interface Keyframe {
  value: number; // 确保value是number类型
  easing: string; // 添加easing属性
}

// 实现缺失的缓动函数
function easeIn(a: number, b: number, t: number): number {
  return a + (b - a) * (t * t);
}

function easeOut(a: number, b: number, t: number): number {
  return a + (b - a) * (1 - (1 - t) * (1 - t));
}

function easeInOut(a: number, b: number, t: number): number {
  return a + (b - a) * (t * t * (3 - 2 * t));
}

export class Interpolator {
  // 线性插值
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // 贝塞尔曲线插值
  static bezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const u = 1 - t;
    return Math.pow(u, 3) * p0 +
           3 * Math.pow(u, 2) * t * p1 +
           3 * u * Math.pow(t, 2) * p2 +
           Math.pow(t, 3) * p3;
  }

  // 分段贝塞尔插值
  static piecewiseBezier(keyframes: Keyframe[], t: number): number {
    // 边界检查
    if (keyframes.length === 0) return 0;

    // 确保t在[0,1]区间
    t = Math.max(0, Math.min(1, t));

    const segmentCount = keyframes.length - 1;
    if (segmentCount <= 0) return keyframes[0].value;

    const index = Math.floor(t * segmentCount);
    const nextIndex = Math.min(index + 1, keyframes.length - 1);

    const frame = keyframes[index];
    const nextFrame = keyframes[nextIndex];

    const localT = (t * segmentCount) - index;

    // 确保value是number类型
    const currentValue = frame.value;
    const nextValue = nextFrame.value;

    // 根据缓动类型选择插值方式
    switch(frame.easing) {
      case 'linear':
        return Interpolator.lerp(currentValue, nextValue, localT);
      case 'easeIn':
        return easeIn(currentValue, nextValue, localT);
      case 'easeOut':
        return easeOut(currentValue, nextValue, localT);
      case 'easeInOut':
        return easeInOut(currentValue, nextValue, localT);
      default:
        return Interpolator.lerp(currentValue, nextValue, localT);
    }
  }
}
