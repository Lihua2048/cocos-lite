import { Animation } from "./Animation";
import { AnimationState } from "./AnimationState";

export declare class AnimationSystem {
  private animations: Map<string, Animation>;
  private activeStates: Map<string, AnimationState>;
  private entityAnimations: Map<string, string>;

  constructor();
  registerAnimation(name: string, animation: Animation): void;
  playAnimation(entityId: string, name: string): void;
  pauseAnimation(entityId: string): void;

  // 添加缺失的方法声明
  private animate(state: AnimationState, entityId: string): void;
}

// 修复 Animation 类声明
export declare class Animation {
  duration: number;
  addAnimationCurve(curve: AnimationCurve): void;
  evaluate(time: number): number;
}

// 修复 AnimationState 接口声明
export interface AnimationState {
  isComplete(): boolean;
  update(deltaTime: number): void;
  getCurrentValue(): any;
  pause(): void;
}
