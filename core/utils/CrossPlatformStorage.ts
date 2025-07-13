import { SceneData } from '../types';

/**
 * React Native 兼容的场景存储工具
 * 提供统一的存储接口，自动适配不同环境
 */
export class CrossPlatformStorage {
  private static STORAGE_KEY = 'cocos_editor_scenes';

  /**
   * 检查是否在 React Native 环境中
   */
  private static isReactNative(): boolean {
    return typeof window === 'undefined' ||
           (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');
  }

  /**
   * 获取 AsyncStorage（React Native）或 localStorage（Web）
   */
  private static async getStorageInstance(): Promise<any> {
    if (this.isReactNative()) {
      try {
        // 动态导入 AsyncStorage
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        return AsyncStorage.default;
      } catch (error) {
        console.warn('AsyncStorage not available, using fallback storage');
        return null;
      }
    } else {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    }
  }

  /**
   * 保存场景数据
   */
  static async saveScenes(scenes: Record<string, SceneData>): Promise<boolean> {
    try {
      const storage = await this.getStorageInstance();
      if (!storage) {
        console.warn('No storage available');
        return false;
      }

      const serialized = JSON.stringify(scenes);

      if (this.isReactNative()) {
        // React Native AsyncStorage
        await storage.setItem(this.STORAGE_KEY, serialized);
      } else {
        // Web localStorage
        storage.setItem(this.STORAGE_KEY, serialized);
      }

      return true;
    } catch (error) {
      console.error('Failed to save scenes:', error);
      return false;
    }
  }

  /**
   * 加载场景数据
   */
  static async loadScenes(): Promise<Record<string, SceneData> | null> {
    try {
      const storage = await this.getStorageInstance();
      if (!storage) {
        console.warn('No storage available');
        return null;
      }

      let stored: string | null;

      if (this.isReactNative()) {
        // React Native AsyncStorage
        stored = await storage.getItem(this.STORAGE_KEY);
      } else {
        // Web localStorage
        stored = storage.getItem(this.STORAGE_KEY);
      }

      if (stored === null || stored === undefined) {
        return null;
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load scenes:', error);
      return null;
    }
  }

  /**
   * 删除场景数据
   */
  static async removeScenes(): Promise<boolean> {
    try {
      const storage = await this.getStorageInstance();
      if (!storage) {
        console.warn('No storage available');
        return false;
      }

      if (this.isReactNative()) {
        // React Native AsyncStorage
        await storage.removeItem(this.STORAGE_KEY);
      } else {
        // Web localStorage
        storage.removeItem(this.STORAGE_KEY);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove scenes:', error);
      return false;
    }
  }

  /**
   * 检查是否有存储的数据
   */
  static async hasStoredData(): Promise<boolean> {
    try {
      const storage = await this.getStorageInstance();
      if (!storage) {
        return false;
      }

      let stored: string | null;

      if (this.isReactNative()) {
        stored = await storage.getItem(this.STORAGE_KEY);
      } else {
        stored = storage.getItem(this.STORAGE_KEY);
      }

      return stored !== null && stored !== undefined;
    } catch (error) {
      console.error('Failed to check stored data:', error);
      return false;
    }
  }

  /**
   * 获取存储数据的大小（字节）
   */
  static async getStorageSize(): Promise<number> {
    try {
      const scenes = await this.loadScenes();
      if (!scenes) {
        return 0;
      }

      const serialized = JSON.stringify(scenes);
      return new Blob([serialized]).size;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  /**
   * 导出场景数据为 JSON 字符串
   */
  static async exportScenesAsJSON(): Promise<string | null> {
    try {
      const scenes = await this.loadScenes();
      if (!scenes) {
        return null;
      }

      return JSON.stringify(scenes, null, 2);
    } catch (error) {
      console.error('Failed to export scenes as JSON:', error);
      return null;
    }
  }

  /**
   * 从 JSON 字符串导入场景数据
   */
  static async importScenesFromJSON(jsonString: string): Promise<boolean> {
    try {
      const scenes = JSON.parse(jsonString);
      return await this.saveScenes(scenes);
    } catch (error) {
      console.error('Failed to import scenes from JSON:', error);
      return false;
    }
  }

  /**
   * 创建场景数据的备份
   */
  static async createBackup(): Promise<string | null> {
    try {
      const scenes = await this.loadScenes();
      if (!scenes) {
        return null;
      }

      const timestamp = new Date().toISOString();
      const backup = {
        timestamp,
        version: '1.0.0',
        scenes
      };

      return JSON.stringify(backup, null, 2);
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
      const backup = JSON.parse(backupString);

      if (!backup.scenes) {
        throw new Error('Invalid backup format');
      }

      return await this.saveScenes(backup.scenes);
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * 通用存储方法 - 设置项目
   */
  static async setItem(key: string, value: string): Promise<void> {
    const storage = await this.getStorageInstance();
    if (!storage) {
      throw new Error('No storage available');
    }

    if (this.isReactNative()) {
      await storage.setItem(key, value);
    } else {
      storage.setItem(key, value);
    }
  }

  /**
   * 通用存储方法 - 获取项目
   */
  static async getItem(key: string): Promise<string | null> {
    const storage = await this.getStorageInstance();
    if (!storage) {
      return null;
    }

    if (this.isReactNative()) {
      return await storage.getItem(key);
    } else {
      return storage.getItem(key);
    }
  }

  /**
   * 通用存储方法 - 删除项目
   */
  static async removeItem(key: string): Promise<void> {
    const storage = await this.getStorageInstance();
    if (!storage) {
      throw new Error('No storage available');
    }

    if (this.isReactNative()) {
      await storage.removeItem(key);
    } else {
      storage.removeItem(key);
    }
  }
}

// 为了保持向后兼容性，导出原有的 SceneStorage 类
export class SceneStorage {
  /**
   * @deprecated 使用 CrossPlatformStorage.saveScenes 替代
   */
  static saveToLocalStorage(scenes: Record<string, SceneData>): void {
    CrossPlatformStorage.saveScenes(scenes).catch(error => {
      console.error('Failed to save scenes:', error);
    });
  }

  /**
   * @deprecated 使用 CrossPlatformStorage.loadScenes 替代
   */
  static loadFromLocalStorage(): Record<string, SceneData> | null {
    // 注意：这是一个同步方法，但我们需要异步操作
    // 在实际使用中应该改为异步调用
    console.warn('SceneStorage.loadFromLocalStorage is deprecated and may not work properly in React Native');
    return null;
  }

  /**
   * 异步加载场景数据（推荐使用）
   */
  static async loadFromLocalStorageAsync(): Promise<Record<string, SceneData> | null> {
    return await CrossPlatformStorage.loadScenes();
  }

  /**
   * 导出场景为文件（仅在 Web 环境中可用）
   */
  static exportScenesAsFile(scenes: Record<string, SceneData>, filename = 'scenes.json'): void {
    try {
      if (typeof document === 'undefined' || typeof Blob === 'undefined') {
        console.warn('File export is not available in this environment');
        console.log('Scene data:', JSON.stringify(scenes, null, 2));
        return;
      }

      const dataStr = JSON.stringify(scenes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export scenes:', error);
    }
  }

  /**
   * 从文件导入场景（仅在 Web 环境中可用）
   */
  static importScenesFromFile(): Promise<Record<string, SceneData> | null> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined' || typeof FileReader === 'undefined') {
        console.warn('File import is not available in this environment');
        resolve(null);
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const scenes = JSON.parse(content);
            resolve(scenes);
          } catch (error) {
            console.error('Failed to parse imported file:', error);
            resolve(null);
          }
        };

        reader.onerror = () => {
          console.error('Failed to read file');
          resolve(null);
        };

        reader.readAsText(file);
      };

      input.click();
    });
  }
}
