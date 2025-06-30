import { Scene } from "../scene";
import { Entity } from "../types";

export  class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private activeScene: Scene | null = null;
  private entities: Map<string, Entity> = new Map();

  getEntityById(id: string): Entity | null {
    return this.entities.get(id) || null;
  }

  addScene(name: string, scene: Scene) {
    this.scenes.set(name, scene);
  }

  getScene(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  switchScene(name: string) {
    const scene = this.scenes.get(name);
    if (scene && this.activeScene !== scene) {
      this.activeScene = scene;
      // 触发场景切换逻辑
    }
  }

  getActiveScene(): Scene | null {
    return this.activeScene;
  }
}
