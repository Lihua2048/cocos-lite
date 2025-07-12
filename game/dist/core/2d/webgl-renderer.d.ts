import { Entity } from "../types";
import { Animation } from "../types";
import ResourceManager from "../resources/ResourceManager";
export declare class WebGLRenderer {
    private gl;
    private canvas;
    private vertexBuffer;
    private shaderProgram;
    private uProjectionMatrixLocation;
    private uColorLocation;
    private aPositionLocation;
    private entityVertexBuffer;
    private projectionMatrix;
    private lastCanvasSize;
    private textureCache;
    private resourceManager;
    private uTextureLocation;
    private uUseTextureLocation;
    private sdfTextRenderer;
    private sdfFontLoaded;
    private sdfShaderProgram;
    private sdfUniforms;
    private initSDFShader;
    constructor(resourceManager: ResourceManager);
    initialize(canvas: HTMLCanvasElement): Promise<void>;
    private initVertexBuffer;
    private initShaders;
    cleanup(): void;
    private isInitialized;
    private loadTexture;
    addTextureResource(id: string, url: string): void;
    private createTexture;
    render(entities: Entity[], animations?: Record<string, Animation>, entityAnimationState?: Record<string, {
        currentAnimation?: string;
        currentTime: number;
    }>): void;
}
