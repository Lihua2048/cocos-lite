import planck from 'planck-js';
type UserData = {
    id: string;
};
export declare class PhysicsWorld {
    isInitialized(): boolean;
    private world;
    private bodies;
    step(dt: number): void;
    syncEntityFromBody(entity: any, body: planck.Body): void;
    initialize(gravity: {
        x: number;
        y: number;
    }): Promise<void>;
    createBody(def: any, userData: UserData): planck.Body;
    getUserData(body: planck.Body): UserData | undefined;
    destroyBody(id: string): void;
}
export {};
