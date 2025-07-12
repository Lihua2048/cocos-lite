export default class ResourceManager {
    private resources;
    private textures;
    addTexture(id: string, image: HTMLImageElement): void;
    getTexture(id: string): HTMLImageElement | undefined;
    getAllTextures(): [string, HTMLImageElement][];
    addResource(entityId: string, resource: any): void;
    removeResourcesForEntity(entityId: string): void;
    getResource(entityId: string): any;
}
