import planck from 'planck-js';
export class PhysicsWorld {
    constructor() {
        this.world = null;
        this.bodies = new Map();
    }
    isInitialized() {
        return !!this.world;
    }
    step(dt) {
        if (!this.world) {
            console.warn('[PhysicsWorld] step: world not initialized');
            return;
        }
        this.world.step(dt);
    }
    // 以上为 PhysicsWorld 正确实现，以下为重复内容，需删除
    syncEntityFromBody(entity, body) {
        const pos = body.getPosition();
        entity.position.x = pos.x;
        entity.position.y = pos.y;
        if (entity.properties) {
            entity.properties.angle = body.getAngle();
        }
    }
    async initialize(gravity) {
        this.world = new planck.World(planck.Vec2(gravity.x, gravity.y));
        console.log('[PhysicsWorld] initialized with gravity', gravity);
    }
    createBody(def, userData) {
        if (!this.world) {
            console.error('[PhysicsWorld] createBody: world not initialized');
            throw new Error('PhysicsWorld not initialized');
        }
        const body = this.world.createBody({
            type: def.type || 'dynamic',
            position: planck.Vec2(def.position.x, def.position.y),
            angle: def.angle || 0,
            fixedRotation: !!def.fixedRotation
        });
        // 可扩展 fixture 创建等
        this.bodies.set(userData.id, body);
        body.userData = userData;
        console.log(`[PhysicsWorld] createBody: id=${userData.id}, type=${def.type}, pos=(${def.position?.x},${def.position?.y}), angle=${def.angle}`);
        return body;
    }
    getUserData(body) {
        return body.userData;
    }
    destroyBody(id) {
        const body = this.bodies.get(id);
        if (body && this.world) {
            this.world.destroyBody(body);
            this.bodies.delete(id);
            console.log(`[PhysicsWorld] destroyBody: id=${id}`);
        }
    }
}
//# sourceMappingURL=PhysicsWorld.js.map