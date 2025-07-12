interface Keyframe {
    value: number;
    easing: string;
}
export declare class Interpolator {
    static lerp(a: number, b: number, t: number): number;
    static bezier(p0: number, p1: number, p2: number, p3: number, t: number): number;
    static piecewiseBezier(keyframes: Keyframe[], t: number): number;
}
export {};
