export class SceneStorage {
    /**
     * 保存场景到本地存储
     */
    static saveToLocalStorage(scenes) {
        try {
            const serialized = JSON.stringify(scenes);
            localStorage.setItem(this.STORAGE_KEY, serialized);
        }
        catch (error) {
            console.error('Failed to save scenes to localStorage:', error);
        }
    }
    /**
     * 从本地存储加载场景
     */
    static loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        }
        catch (error) {
            console.error('Failed to load scenes from localStorage:', error);
            return null;
        }
    }
    /**
     * 导出场景为JSON文件
     */
    static exportScenesAsFile(scenes, filename = 'scenes.json') {
        try {
            const dataStr = JSON.stringify(scenes, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
        }
        catch (error) {
            console.error('Failed to export scenes:', error);
        }
    }
    /**
     * 从文件导入场景
     */
    static importScenesFromFile() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result;
                        const scenes = JSON.parse(content);
                        resolve(scenes);
                    }
                    catch (error) {
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
SceneStorage.STORAGE_KEY = 'cocos_editor_scenes';
//# sourceMappingURL=sceneStorage.js.map