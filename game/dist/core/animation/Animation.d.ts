import { AnimationCurve } from './AnimationCurve';
export declare class Animation {
    duration: number;
    private curves;
    addAnimationCurve(curve: AnimationCurve): void;
    evaluate(time: number): number;
}
