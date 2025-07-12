import { AnimationSystem } from "./animation/AnimationSystem";
import { Animation } from "./animation/Animation";
import { AnimationCurve } from "./animation/AnimationCurve";
import { SceneManager } from "./scene/SceneManager";
export const sceneManager = new SceneManager();
export class Scene {
    constructor(animationSystem) {
        this.animationSystem = animationSystem;
        this.entities = [];
        if (!animationSystem) {
            // 使用默认的动画系统
            this.animationSystem = new AnimationSystem();
        }
        else {
            this.animationSystem = animationSystem;
        }
        this.registerDefaultAnimations();
    }
    /**
     * 序列化场景数据
     */
    serialize() {
        return {
            id: this.id || "untitled",
            name: this.name || "Untitled Scene",
            entities: this.entities.reduce((acc, entity) => {
                // 将 Entity 类实例转换为 Entity 接口格式
                acc[entity.id] = {
                    id: entity.id,
                    type: entity.type, // 类型断言
                    position: entity.position,
                    properties: entity.properties, // 类型断言
                    components: entity.getComponents?.() || [], // 安全访问
                };
                return acc;
            }, {}),
            animations: this.animationSystem ? this.convertAnimationsToInterface(this.animationSystem.getAllAnimations()) : {},
            metadata: {
                createdAt: this.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                entityCount: this.entities.length,
            },
        };
    }
    convertAnimationsToInterface(animations) {
        const result = {};
        Object.entries(animations).forEach(([name, animation]) => {
            result[name] = {
                propertyName: 'position', // 或其他默认属性
                keyframes: [] // 从animation.curves转换而来
            };
        });
        return result;
    }
    /**
     * 从序列化数据恢复场景
     */
    static deserialize(data) {
        const scene = new Scene();
        scene.id = data.id;
        scene.name = data.name;
        scene.createdAt = data.metadata.createdAt;
        // 恢复实体
        Object.values(data.entities).forEach((entityData) => {
            // 创建 Entity 类实例而不是直接添加接口数据
            const entityClass = new (require("./entity").Entity)(entityData.id, entityData.type, entityData.position, entityData.properties);
            scene.addEntity(entityClass);
        });
        // 恢复动画
        if (scene.animationSystem && data.animations) {
            Object.entries(data.animations).forEach(([name, animationData]) => {
                // 创建 Animation 类实例
                const animation = new (require("./animation/Animation").Animation)();
                animation.duration = animationData.duration || 1;
                // 添加其他动画属性...
                scene.animationSystem.registerAnimation(name, animation);
            });
        }
        return scene;
    }
    registerDefaultAnimations() {
        const animation = new Animation();
        const curve = new AnimationCurve();
        // 添加关键帧动画
        curve.addKeyframe(0, 0);
        curve.addKeyframe(1, 1);
        curve.addKeyframe(2, 0);
        animation.duration = 2;
        animation.addAnimationCurve(curve);
        if (this.animationSystem) {
            this.animationSystem.registerAnimation("walk", animation);
        }
    }
    playAnimation(entityId, name) {
        if (this.animationSystem) {
            this.animationSystem.playAnimation(entityId, name);
        }
    }
    pauseAnimation(entityId) {
        if (this.animationSystem) {
            this.animationSystem.pauseAnimation(entityId);
        }
    }
    getEntityById(id) {
        return this.entities.find((entity) => entity.id === id);
    }
    addEntity(entity) {
        this.entities.push(entity);
    }
    removeEntity(id) {
        this.entities = this.entities.filter((e) => e.id !== id);
    }
    getEntities() {
        return [...this.entities];
    }
    update(deltaTime) {
        this.entities.forEach((entity) => entity.update(deltaTime));
    }
    render() {
        this.logRender(`Rendering ${this.entities.length} entities`);
    }
    logRender(message) {
        if (process.env.NODE_ENV !== "production") {
            console.log(message);
        }
    }
}
//# sourceMappingURL=scene.js.map