import { Scene } from "../scene";
export declare class SceneManager {
    private static instance;
    static getInstance(): SceneManager;
    createScene(name: string): string;
    switchToScene(sceneId: string): boolean;
    removeScene(sceneId: string): boolean;
    getCurrentSceneData(): import("../types").SceneData | null;
    getCurrentScene(): Scene | null;
    getAllScenes(): Record<string, import("../types").SceneData>;
}
export declare const sceneManager: SceneManager;
