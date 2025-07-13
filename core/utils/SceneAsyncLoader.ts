import { store } from '../../editor/store';
import { CrossPlatformStorage } from './CrossPlatformStorage';

/**
 * 场景异步加载器
 * 负责在应用启动时异步加载场景数据
 */
export class SceneAsyncLoader {
  private static isLoading = false;
  private static isLoaded = false;

  /**
   * 异步加载场景数据到 store
   */
  static async loadScenesAsync(): Promise<boolean> {
    if (this.isLoading || this.isLoaded) {
      return this.isLoaded;
    }

    this.isLoading = true;

    try {
      console.log('🔄 Loading scenes from storage...');

      const loadedScenes = await CrossPlatformStorage.loadScenes();

      if (loadedScenes && Object.keys(loadedScenes).length > 0) {
        console.log('✅ Scenes loaded successfully:', Object.keys(loadedScenes));

        // 分发 action 来更新 store
        store.dispatch({
          type: 'LOAD_SCENES_SUCCESS',
          payload: {
            scenes: loadedScenes,
            currentSceneId: Object.keys(loadedScenes)[0],
            sceneHistory: [Object.keys(loadedScenes)[0]]
          }
        });

        this.isLoaded = true;
        return true;
      } else {
        console.log('ℹ️ No stored scenes found, using default scenes');
        this.isLoaded = true;
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to load scenes:', error);

      // 分发错误 action
      store.dispatch({
        type: 'LOAD_SCENES_ERROR',
        payload: {
          error: error instanceof Error ? error.message : String(error)
        }
      });

      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 检查是否有存储的场景数据
   */
  static async hasStoredScenes(): Promise<boolean> {
    try {
      return await CrossPlatformStorage.hasStoredData();
    } catch (error) {
      console.error('Failed to check stored scenes:', error);
      return false;
    }
  }

  /**
   * 获取存储大小
   */
  static async getStorageSize(): Promise<number> {
    try {
      return await CrossPlatformStorage.getStorageSize();
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  /**
   * 清除存储的场景数据
   */
  static async clearStoredScenes(): Promise<boolean> {
    try {
      const success = await CrossPlatformStorage.removeScenes();
      if (success) {
        console.log('✅ Stored scenes cleared');

        // 重置标志
        this.isLoaded = false;

        // 分发 action 来重置 store 到默认状态
        store.dispatch({
          type: 'CLEAR_SCENES_SUCCESS'
        });
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to clear stored scenes:', error);
      return false;
    }
  }

  /**
   * 手动保存当前场景到存储
   */
  static async saveCurrentScenes(): Promise<boolean> {
    try {
      const state = store.getState();
      const scenes = state.editor?.scenes;

      if (!scenes) {
        console.warn('No scenes to save');
        return false;
      }

      const success = await CrossPlatformStorage.saveScenes(scenes);
      if (success) {
        console.log('✅ Scenes saved successfully');
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to save scenes:', error);
      return false;
    }
  }

  /**
   * 异步保存场景数据
   */
  static async saveScenesAsync(scenes: Record<string, any>): Promise<boolean> {
    try {
      console.log('🔄 Saving scenes to storage...');
      const success = await CrossPlatformStorage.saveScenes(scenes);
      if (success) {
        console.log('✅ Scenes saved successfully');
      } else {
        console.log('❌ Failed to save scenes');
      }
      return success;
    } catch (error) {
      console.error('❌ Error saving scenes:', error);
      return false;
    }
  }

  /**
   * 创建场景数据备份
   */
  static async createBackup(): Promise<string | null> {
    try {
      return await CrossPlatformStorage.createBackup();
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * 从备份恢复场景数据
   */
  static async restoreFromBackup(backupString: string): Promise<boolean> {
    try {
      const success = await CrossPlatformStorage.restoreFromBackup(backupString);
      if (success) {
        console.log('✅ Scenes restored from backup');

        // 重新加载场景数据
        this.isLoaded = false;
        await this.loadScenesAsync();
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * 导出场景数据为 JSON
   */
  static async exportScenes(): Promise<string | null> {
    try {
      return await CrossPlatformStorage.exportScenesAsJSON();
    } catch (error) {
      console.error('Failed to export scenes:', error);
      return null;
    }
  }

  /**
   * 从 JSON 导入场景数据
   */
  static async importScenes(jsonString: string): Promise<boolean> {
    try {
      const success = await CrossPlatformStorage.importScenesFromJSON(jsonString);
      if (success) {
        console.log('✅ Scenes imported successfully');

        // 重新加载场景数据
        this.isLoaded = false;
        await this.loadScenesAsync();
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to import scenes:', error);
      return false;
    }
  }

  /**
   * 获取加载状态
   */
  static getLoadingStatus(): {
    isLoading: boolean;
    isLoaded: boolean;
  } {
    return {
      isLoading: this.isLoading,
      isLoaded: this.isLoaded
    };
  }
}

export default SceneAsyncLoader;
