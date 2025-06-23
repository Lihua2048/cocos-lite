import { Scene } from '../scene';

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private activeScene: Scene | null = null;

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
