export class Entity {
    constructor(id, type, position, properties) {
        this.components = new Map();
        this.animationValue = 0;
        this.id = id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.type = type || 'sprite'; // 初始化type属性
        this.position = position || { x: 0, y: 0 };
        this.properties = properties || {}; // 同时初始化properties
    }
    getType() {
        return this.type;
    }
    getProperties() {
        return this.properties;
    }
    addComponent(component) {
        this.components.set(component.constructor.name, component);
    }
    getComponent(type) {
        return this.components.get(type.name);
    }
    update(deltaTime) {
        this.components.forEach((component) => component.update(deltaTime));
    }
    setAnimationValue(value) {
        this.animationValue = value;
        this.position.x = value * 10; // 现在position属性已正确定义
    }
    getAnimationValue() {
        return this.animationValue;
    }
}
export function createDefaultEntity(id, type) {
    const entity = new Entity(id, type); // 传递type参数
    return entity;
}
//# sourceMappingURL=entity.js.map