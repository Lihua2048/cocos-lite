export class ResourceManager {
  private resources: Map<string, any> = new Map();
  private textures: Map<string, HTMLImageElement> = new Map()

  // 添加图片资源
  addTexture(id: string, image: HTMLImageElement) {
    this.textures.set(id, image);
  }

  // 获取图片资源
  getTexture(id: string): HTMLImageElement | undefined {
    return this.textures.get(id);
  }

  // 获取所有图片资源
  getAllTextures() {
    return Array.from(this.textures.entries());
  }

  addResource(entityId: string, resource: any) {
    this.resources.set(entityId, resource);
  }

  removeResourcesForEntity(entityId: string) {
    const resource = this.resources.get(entityId);
    if (resource) {
      // 释放资源逻辑
      if (resource.dispose) {
        resource.dispose();
      }
      this.resources.delete(entityId);
    }
  }

  getResource(entityId: string) {
    return this.resources.get(entityId);
  }
}
