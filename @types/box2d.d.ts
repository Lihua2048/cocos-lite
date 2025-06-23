declare namespace Box2D {
  class b2Vec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  class b2World {
    constructor(gravity: b2Vec2);
    CreateBody(def: b2BodyDef): b2Body;
    Step(timeStep: number, velocityIterations: number, positionIterations: number): void;
  }

  class b2BodyDef {
    type: number;
    position: b2Vec2;
  }

  class b2Body {
    GetUserData(): any;
    SetUserData(data: any): void;
  }
}

declare module 'box2d-wasm' {
  function Box2DFactory(): Promise<typeof Box2D>;
  export = Box2DFactory;
}
