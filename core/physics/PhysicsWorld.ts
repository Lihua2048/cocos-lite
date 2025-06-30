import Box2DFactory from 'box2d-wasm';

type UserData = {
  id: string;
  // 其他需要存储的数据
};

export class PhysicsWorld {
  private world: Box2D.b2World | null = null;
  private bodies: Map<string, Box2D.b2Body> = new Map();
  private userDataMap: Map<number, UserData> = new Map(); // 按指针存储用户数据
  private Box2D: typeof Box2D | null = null;

  async initialize(gravity: { x: number; y: number }): Promise<void> {
    this.Box2D = await Box2DFactory();
    this.world = new this.Box2D.b2World(
      new this.Box2D.b2Vec2(gravity.x, gravity.y)
    );
  }

  createBody(def: Box2D.b2BodyDef, userData: UserData): Box2D.b2Body {
    if (!this.world || !this.Box2D) throw new Error('PhysicsWorld not initialized');

    // 创建真正的 Box2D 定义对象
    const finalDef = new this.Box2D.b2BodyDef();

    // 复制属性
    if (def.type !== undefined) finalDef.type = def.type;
    if (def.position) finalDef.position = new this.Box2D.b2Vec2(def.position.x, def.position.y);
    if (def.angle !== undefined) finalDef.angle = def.angle;
    // 其他属性...

    const body = this.world.CreateBody(finalDef);
    this.bodies.set(userData.id, body);

    // 使用body指针存储用户数据
    const pointer = this.getBodyPointer(body);
    this.userDataMap.set(pointer, userData);

    return body;
  }

  // 获取body指针的方法
  private getBodyPointer(body: Box2D.b2Body): number {
    // 使用类型断言访问私有属性
    return (body as any).ptr;
  }

  // 获取用户数据的方法
  getUserData(body: Box2D.b2Body): UserData | undefined {
    const pointer = this.getBodyPointer(body);
    return this.userDataMap.get(pointer);
  }

  // 当body被销毁时记得清理userDataMap
  destroyBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      const pointer = this.getBodyPointer(body);
      this.userDataMap.delete(pointer);
      this.bodies.delete(id);
    }
  }
}
