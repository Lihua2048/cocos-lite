export declare class AnimationCurve {
    private keyframes;
    get duration(): number;
    addKeyframe(time: number, value: number): void;
    evaluate(time: number): number;
}
