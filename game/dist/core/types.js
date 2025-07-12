// 添加默认动画状态
export function createDefaultEntity(id, type) {
    if (type === 'sprite') {
        return {
            id,
            type,
            position: { x: 0, y: 0 },
            properties: {
                width: 100,
                height: 100,
                color: [1, 0, 0, 1],
                texture: undefined,
                angle: 0,
            },
            components: [],
            animation: {
                playing: false,
                currentAnimation: '',
                currentTime: 0
            }
        };
    }
    else {
        // UI组件，默认英文
        let defaultText = 'Button';
        if (type === 'ui-input')
            defaultText = 'Input';
        if (type === 'ui-text')
            defaultText = 'Text';
        return {
            id,
            type,
            position: { x: 0, y: 0 },
            properties: {
                width: 120,
                height: 40,
                backgroundType: 'color',
                color: [0.9, 0.9, 0.9, 1],
                texture: undefined,
                text: defaultText,
                textColor: [0, 0, 0, 1],
                fontSize: 16,
                textAlign: 'center',
            },
            components: [],
            animation: {
                playing: false,
                currentAnimation: '',
                currentTime: 0
            }
        };
    }
}
//# sourceMappingURL=types.js.map