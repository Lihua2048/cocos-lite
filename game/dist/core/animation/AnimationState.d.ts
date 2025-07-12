import { Animation } from './Animation';
export declare class AnimationState {
    private animation;
    private currentTime;
    private isPlaying;
    constructor(animation: Animation);
    update(deltaTime: number): void;
    getCurrentValue(): number;
    isComplete(): boolean;
    pause(): void;
    reset(): void;
}
