export default class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.textures = new Map();
    }
    // 添加图片资源
    addTexture(id, image) {
        this.textures.set(id, image);
    }
    // 获取图片资源
    getTexture(id) {
        return this.textures.get(id);
    }
    // 获取所有图片资源
    getAllTextures() {
        return Array.from(this.textures.entries());
    }
    addResource(entityId, resource) {
        this.resources.set(entityId, resource);
    }
    removeResourcesForEntity(entityId) {
        const resource = this.resources.get(entityId);
        if (resource) {
            // 释放资源逻辑
            if (resource.dispose) {
                resource.dispose();
            }
            this.resources.delete(entityId);
        }
    }
    getResource(entityId) {
        return this.resources.get(entityId);
    }
}
//# sourceMappingURL=ResourceManager.js.map