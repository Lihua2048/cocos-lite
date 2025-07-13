import { SceneData } from '../types';

export class SceneStorage {
  private static STORAGE_KEY = 'cocos_editor_scenes';

  /**
   * 保存场景到本地存储
   */
  static saveToLocalStorage(scenes: Record<string, SceneData>): void {
    try {
      // 检查是否在支持 localStorage 的环境中
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available, skipping save');
        return;
      }

      const serialized = JSON.stringify(scenes);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save scenes to localStorage:', error);
    }
  }

  /**
   * 从本地存储加载场景
   */
  static loadFromLocalStorage(): Record<string, SceneData> | null {
    try {
      // 检查是否在支持 localStorage 的环境中
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available, returning null');
        return null;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === null || stored === undefined) {
        return null;
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load scenes from localStorage:', error);
      return null;
    }
  }

  /**
   * 导出场景为JSON文件
   */
  static exportScenesAsFile(scenes: Record<string, SceneData>, filename = 'scenes.json'): void {
    try {
      // 检查是否在浏览器环境中
      if (typeof document === 'undefined' || typeof Blob === 'undefined') {
        console.warn('File export is not available in this environment');
        // 在 React Native 中，我们可以将数据复制到剪贴板或通过其他方式处理
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
   * 从文件导入场景
   */
  static importScenesFromFile(): Promise<Record<string, SceneData> | null> {
    return new Promise((resolve) => {
      // 检查是否在浏览器环境中
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
        reader.readAsText(file);
      };

      input.click();
    });
  }
}
