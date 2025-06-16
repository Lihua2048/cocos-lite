import { Scene } from '../core/scene';
import { Entity } from '../core/entity';

describe('Scene Management', () => {
    let scene: Scene;
    let entity: Entity;

    beforeEach(() => {
        scene = new Scene();
        entity = new Entity();
    });

    test('should create empty scene', () => {
        expect(scene.getEntities()).toHaveLength(0);
    });

    test('should add entity to scene', () => {
        scene.addEntity(entity);
        expect(scene.getEntities()).toHaveLength(1);
        expect(scene.getEntities()[0]).toBe(entity);
    });

    test('should update all entities', () => {
        const mockUpdate = jest.fn();
        const mockComponent = { update: mockUpdate };

        (entity as any).components = new Map([['MockComponent', mockComponent]]);

        scene.addEntity(entity);
        scene.update(0.016); // 60fps间隔

        expect(mockUpdate).toHaveBeenCalled();
    });
});
