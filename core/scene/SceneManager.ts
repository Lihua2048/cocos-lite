// 替换现有的SceneManager类
import { Scene } from "../scene";
import { Entity } from "../types";
import { store } from "../../editor/store";
import { createScene, switchScene, deleteScene } from "../actions";

export class SceneManager {
  private static instance: SceneManager;

  static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  // 创建新场景
  createScene(name: string): string {
    const id = `scene_${Date.now()}`;
    store.dispatch(createScene(id, name));
    return id;
  }

  // 切换场景
  switchToScene(sceneId: string): boolean {
    try {
      store.dispatch(switchScene(sceneId));
      return true;
    } catch (error) {
      console.error('Failed to switch scene:', error);
      return false;
    }
  }

  // 删除场景
  removeScene(sceneId: string): boolean {
    try {
      store.dispatch(deleteScene(sceneId));
      return true;
    } catch (error) {
      console.error('Failed to delete scene:', error);
      return false;
    }
  }

  // 获取当前场景数据
  getCurrentSceneData() {
    const state = store.getState();
    return state.editor.currentSceneId ? state.editor.scenes[state.editor.currentSceneId] : null;
  }

  getCurrentScene(): Scene | null {
  const state = store.getState();
  if (state.editor.currentSceneId && state.editor.scenes[state.editor.currentSceneId]) {
    // 从场景数据重构Scene实例
    return Scene.deserialize(state.editor.scenes[state.editor.currentSceneId]);
  }
  return null;
}

  // 获取所有场景
  getAllScenes() {
    return store.getState().editor.scenes;
  }
}

export const sceneManager = SceneManager.getInstance();
