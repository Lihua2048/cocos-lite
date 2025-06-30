import { Entity } from "./entity";
import { AnimationSystem } from "./animation/AnimationSystem";
import { Animation } from "./animation/Animation";
import { AnimationCurve } from "./animation/AnimationCurve";
import { SceneManager } from "./scene/SceneManager";

export const sceneManager = new SceneManager();

export class Scene {
  private entities: Entity[] = [];

  constructor(public animationSystem?: AnimationSystem) {
    if (!animationSystem) {
      // 使用默认的动画系统
      this.animationSystem = new AnimationSystem();
    } else {
      this.animationSystem = animationSystem;
    }

    this.registerDefaultAnimations();
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
      this.animationSystem.registerAnimation('walk', animation);
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
  getEntityById(id: string): Entity | undefined {
    return this.entities.find(entity => entity.id === id);
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  removeEntity(id: string) {
    this.entities = this.entities.filter((e) => e.id !== id);
  }

  getEntities(): Entity[] {
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
