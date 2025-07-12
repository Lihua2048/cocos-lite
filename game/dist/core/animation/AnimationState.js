export class AnimationState {
    constructor(animation) {
        this.currentTime = 0;
        this.isPlaying = false;
        this.animation = animation;
    }
    update(deltaTime) {
        if (!this.isPlaying)
            return;
        this.currentTime += deltaTime;
        if (this.currentTime > this.animation.duration) {
            this.currentTime = this.animation.duration;
            this.isPlaying = false;
        }
    }
    getCurrentValue() {
        return this.animation.evaluate(this.currentTime);
    }
    isComplete() {
        return this.currentTime >= this.animation.duration;
    }
    // 添加 pause 方法
    pause() {
        this.isPlaying = false;
    }
    // 添加 reset 方法
    reset() {
        this.currentTime = 0;
        this.isPlaying = false;
    }
}
//# sourceMappingURL=AnimationState.js.map