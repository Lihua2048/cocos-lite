import { Entity as EntityClass } from "./entity";
import { Entity as EntityInterface } from "./types";
import { AnimationSystem } from "./animation/AnimationSystem";
import { Animation } from "./animation/Animation";
import { AnimationCurve } from "./animation/AnimationCurve";
import { SceneManager } from "./scene/SceneManager";
import { SceneData } from "./types";

export const sceneManager = new SceneManager();

export class Scene {
  private entities: EntityClass[] = [];
  public id?: string;
  public name?: string;
  public createdAt?: string;

  constructor(public animationSystem?: AnimationSystem) {
    if (!animationSystem) {
      // 使用默认的动画系统
      this.animationSystem = new AnimationSystem();
    } else {
      this.animationSystem = animationSystem;
    }

    this.registerDefaultAnimations();
  }

  /**
   * 序列化场景数据
   */
  serialize(): SceneData {
    return {
      id: this.id || "untitled",
      name: this.name || "Untitled Scene",
      entities: this.entities.reduce((acc, entity) => {
        // 将 Entity 类实例转换为 Entity 接口格式
        acc[entity.id] = {
          id: entity.id,
          type: (entity as any).type, // 类型断言
          position: entity.position,
          properties: (entity as any).properties, // 类型断言
          components: (entity as any).getComponents?.() || [], // 安全访问
        };
        return acc;
      }, {} as Record<string, import("./types").Entity>),
      animations: this.animationSystem ? this.convertAnimationsToInterface(this.animationSystem.getAllAnimations()) : {},
      metadata: {
        createdAt: this.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityCount: this.entities.length,
      },
    };
  }

  private convertAnimationsToInterface(animations: Record<string, Animation>): Record<string, import('./types').Animation> {
  const result: Record<string, import('./types').Animation> = {};
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
  static deserialize(data: SceneData): Scene {
    const scene = new Scene();
    scene.id = data.id;
    scene.name = data.name;
    scene.createdAt = data.metadata.createdAt;

    // 恢复实体
    Object.values(data.entities).forEach((entityData) => {
      // 创建 Entity 类实例而不是直接添加接口数据
      const entityClass = new (require("./entity").Entity)(
        entityData.id,
        entityData.type,
        entityData.position,
        entityData.properties
      );
      scene.addEntity(entityClass);
    });

    // 恢复动画
    if (scene.animationSystem && data.animations) {
      Object.entries(data.animations).forEach(([name, animationData]) => {
        // 创建 Animation 类实例
        const animation = new (require("./animation/Animation").Animation)();
        animation.duration = (animationData as any).duration || 1;
        // 添加其他动画属性...
        scene.animationSystem!.registerAnimation(name, animation);
      });
    }

    return scene;
  }
  private registerDefaultAnimations() {
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

  playAnimation(entityId: string, name: string) {
    if (this.animationSystem) {
      this.animationSystem.playAnimation(entityId, name);
    }
  }

  pauseAnimation(entityId: string) {
    if (this.animationSystem) {
      this.animationSystem.pauseAnimation(entityId);
    }
  }
  getEntityById(id: string): EntityClass | undefined {
  return this.entities.find((entity) => entity.id === id);
}

  addEntity(entity: EntityClass): void {
  this.entities.push(entity);
}

  removeEntity(id: string) {
    this.entities = this.entities.filter((e) => e.id !== id);
  }

  getEntities(): EntityClass[] {
  return [...this.entities];
}

  update(deltaTime: number): void {
    this.entities.forEach((entity) => entity.update(deltaTime));
  }

  render(): void {
    this.logRender(`Rendering ${this.entities.length} entities`);
  }

  private logRender(message: string): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(message);
    }
  }
}
