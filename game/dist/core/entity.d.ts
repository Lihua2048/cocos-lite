import { Component } from "./component";
export declare class Entity {
    type: string;
    properties: any;
    id: string;
    position: {
        x: number;
        y: number;
    };
    private components;
    private animationValue;
    constructor(id?: string, type?: string, position?: {
        x: number;
        y: number;
    }, properties?: any);
    getType(): string;
    getProperties(): any;
    addComponent(component: Component): void;
    getComponent<T extends Component>(type: new (...args: any[]) => T): T | undefined;
    update(deltaTime: number): void;
    setAnimationValue(value: number): void;
    getAnimationValue(): number;
}
export declare function createDefaultEntity(id: string, type: string): Entity;
