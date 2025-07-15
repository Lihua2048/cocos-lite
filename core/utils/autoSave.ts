import { EditorState } from '../types';

/**
 * 简单的自动保存工具类
 */
export class AutoSave {
  private static readonly EDITOR_STATE_KEY = 'ademo_editor_state';
  private static saveTimeout: NodeJS.Timeout | null = null;

  /**
   * 检查是否在浏览器环境
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * 异步保存编辑器状态
   */
  static async saveEditorState(state: EditorState): Promise<void> {
    try {
      if (!this.isBrowser()) {
        console.warn('LocalStorage不可用，跳过保存');
        return;
      }

      // 清除之前的保存定时器
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      // 延迟保存，避免频繁操作
      this.saveTimeout = setTimeout(() => {
        try {
          const serializedState = JSON.stringify({
            entities: state.entities,
            textures: state.textures,
            animations: state.animations,
            scenes: state.scenes,
            currentSceneId: state.currentSceneId,
            sceneComposition: state.sceneComposition,
            // 不保存选中状态和物理运行状态
          });

          localStorage.setItem(this.EDITOR_STATE_KEY, serializedState);
          console.log('编辑器状态已自动保存');
        } catch (error) {
          console.error('保存编辑器状态失败:', error);
        }
      }, 1000); // 1秒延迟保存
    } catch (error) {
      console.error('保存编辑器状态失败:', error);
    }
  }

  /**
   * 异步加载编辑器状态
   */
  static async loadEditorState(): Promise<Partial<EditorState> | null> {
    try {
      if (!this.isBrowser()) {
        console.warn('LocalStorage不可用，返回null');
        return null;
      }

      const storedData = localStorage.getItem(this.EDITOR_STATE_KEY);
      if (storedData) {
        const parsedState = JSON.parse(storedData);
        console.log('编辑器状态已从存储中恢复');
        return parsedState;
      }
      return null;
    } catch (error) {
      console.error('加载编辑器状态失败:', error);
      return null;
    }
  }

  /**
   * 清除保存的状态
   */
  static async clearSavedState(): Promise<void> {
    try {
      if (!this.isBrowser()) {
        console.warn('LocalStorage不可用，跳过清除');
        return;
      }

      localStorage.removeItem(this.EDITOR_STATE_KEY);
      console.log('已清除保存的编辑器状态');
    } catch (error) {
      console.error('清除保存状态失败:', error);
    }
  }
}
