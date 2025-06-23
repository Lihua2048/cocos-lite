import { Component } from './component';

export class Entity {
    public id: string;
    private components: Map<string, Component> = new Map();

    constructor(id?: string) {
        this.id = id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    addComponent (component: Component): void {
        this.components.set(component.constructor.name, component);
    }

    getComponent<T extends Component> (type: new (...args: any[]) => T): T | undefined {
        return this.components.get(type.name) as T | undefined;
    }

    update (deltaTime: number): void {
        this.components.forEach((component) => component.update(deltaTime));
    }
}
