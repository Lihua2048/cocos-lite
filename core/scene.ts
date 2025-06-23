import { Entity } from './entity';


export class Scene {
    private entities: Entity[] = [];

    addEntity (entity: Entity): void {
        this.entities.push(entity);
    }
    
    removeEntity(id: string) {
    this.entities = this.entities.filter(e => e.id !== id);
  }

    getEntities (): Entity[] {
        return [...this.entities];
    }

    update (deltaTime: number): void {
        this.entities.forEach((entity) => entity.update(deltaTime));
    }

    render (): void {
        // 模拟WebGL渲染 - 使用日志函数替代 console.log
        this.logRender(`Rendering ${this.entities.length} entities`);
    }

    private logRender (message: string): void {
        // 可以在这里实现自定义的日志逻辑
        // 在生产环境中可以禁用或重定向到其他地方
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log(message);
        }
    }
}
