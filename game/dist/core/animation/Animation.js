// 使用单次导出语句统一处理
export class Animation {
    constructor() {
        this.duration = 0;
        this.curves = [];
    }
    // 添加曲线方法
    addAnimationCurve(curve) {
        this.curves.push(curve);
    }
    evaluate(time) {
        let value = 0;
        this.curves.forEach(curve => {
            value += curve.evaluate(time);
        });
        return value;
    }
}
//# sourceMappingURL=Animation.js.map