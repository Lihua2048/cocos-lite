import { Component } from './component';

export class Entity {
    private components: Map<string, Component> = new Map();

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
