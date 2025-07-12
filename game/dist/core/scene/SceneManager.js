// 替换现有的SceneManager类
import { Scene } from "../scene";
import { store } from "../../editor/store";
import { createScene, switchScene, deleteScene } from "../actions";
export class SceneManager {
    static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }
    // 创建新场景
    createScene(name) {
        const id = `scene_${Date.now()}`;
        store.dispatch(createScene(id, name));
        return id;
    }
    // 切换场景
    switchToScene(sceneId) {
        try {
            store.dispatch(switchScene(sceneId));
            return true;
        }
        catch (error) {
            console.error('Failed to switch scene:', error);
            return false;
        }
    }
    // 删除场景
    removeScene(sceneId) {
        try {
            store.dispatch(deleteScene(sceneId));
            return true;
        }
        catch (error) {
            console.error('Failed to delete scene:', error);
            return false;
        }
    }
    // 获取当前场景数据
    getCurrentSceneData() {
        const state = store.getState();
        return state.currentSceneId ? state.scenes[state.currentSceneId] : null;
    }
    getCurrentScene() {
        const state = store.getState();
        if (state.currentSceneId && state.scenes[state.currentSceneId]) {
            // 从场景数据重构Scene实例
            return Scene.deserialize(state.scenes[state.currentSceneId]);
        }
        return null;
    }
    // 获取所有场景
    getAllScenes() {
        return store.getState().scenes;
    }
}
export const sceneManager = SceneManager.getInstance();
//# sourceMappingURL=SceneManager.js.map