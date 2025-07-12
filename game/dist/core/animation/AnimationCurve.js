export class AnimationCurve {
    constructor() {
        this.keyframes = [];
    }
    get duration() {
        return this.keyframes.length > 0
            ? this.keyframes[this.keyframes.length - 1].time
            : 0;
    }
    addKeyframe(time, value) {
        this.keyframes.push({ time, value });
        this.keyframes.sort((a, b) => a.time - b.time);
    }
    // 线性插值实现
    evaluate(time) {
        if (this.keyframes.length === 0)
            return 0;
        if (time <= this.keyframes[0].time) {
            return this.keyframes[0].value;
        }
        for (let i = 1; i < this.keyframes.length; i++) {
            const prev = this.keyframes[i - 1];
            const curr = this.keyframes[i];
            if (time <= curr.time) {
                const t = (time - prev.time) / (curr.time - prev.time);
                return prev.value + (curr.value - prev.value) * t;
            }
        }
        return this.keyframes[this.keyframes.length - 1].value;
    }
}
//# sourceMappingURL=AnimationCurve.js.map