import { Component } from "./component";

export class Entity {
  public id: string;
  public position: { x: number, y: number };  // 添加position属性
  private components: Map<string, Component> = new Map();
  private animationValue: number = 0;

  constructor(id?: string) {
    this.id =
      id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.position = { x: 0, y: 0 };  // 初始化position
  }
  addComponent(component: Component): void {
    this.components.set(component.constructor.name, component);
  }

  getComponent<T extends Component>(
    type: new (...args: any[]) => T
  ): T | undefined {
    return this.components.get(type.name) as T | undefined;
  }

  update(deltaTime: number): void {
    this.components.forEach((component) => component.update(deltaTime));
  }

  setAnimationValue(value: number) {
    this.animationValue = value;
    this.position.x = value*10;  // 现在position属性已正确定义
  }

  getAnimationValue(): number {
    return this.animationValue;
  }
}


export function createDefaultEntity(id: string, type: string): Entity {
    const entity = new Entity(id);
    return entity;
}
