import { SceneData } from '../types';
export declare class SceneStorage {
    private static STORAGE_KEY;
    /**
     * 保存场景到本地存储
     */
    static saveToLocalStorage(scenes: Record<string, SceneData>): void;
    /**
     * 从本地存储加载场景
     */
    static loadFromLocalStorage(): Record<string, SceneData> | null;
    /**
     * 导出场景为JSON文件
     */
    static exportScenesAsFile(scenes: Record<string, SceneData>, filename?: string): void;
    /**
     * 从文件导入场景
     */
    static importScenesFromFile(): Promise<Record<string, SceneData> | null>;
}
