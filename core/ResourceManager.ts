export class ResourceManager {
  private resources: Map<string, any> = new Map();

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
