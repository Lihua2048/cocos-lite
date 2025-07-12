export interface SDFChar {
    x: number;
    y: number;
    w: number;
    h: number;
    ox: number;
    oy: number;
    xa: number;
    id?: number;
    char?: string;
    width?: number;
    height?: number;
    xoffset?: number;
    yoffset?: number;
    xadvance?: number;
    page?: number;
}
export interface SDFMeta {
    atlas?: string;
    atlasWidth?: number;
    atlasHeight?: number;
    size?: number;
    lineHeight?: number;
    chars: Record<string, SDFChar>;
}
export declare class SDFTextRenderer {
    private gl;
    private fontMeta;
    fontTexture: WebGLTexture | null;
    constructor(gl: WebGLRenderingContext, fontMeta: any);
    loadTexture(imageUrl: string): Promise<WebGLTexture>;
    /**
     * 渲染单行文本，支持垂直居中（verticalAlign: 'top'|'middle'|'bottom'|'baseline'）
     * @param text 文本
     * @param x x 坐标（容器左上角）
     * @param y y 坐标（容器顶部）
     * @param options 渲染选项
     * @param program 可选，WebGLProgram
     */
    drawText(text: string, x: number, y: number, options: {
        fontSize: number;
        color: [number, number, number, number];
        textAlign: "left" | "center" | "right";
        maxWidth?: number;
        verticalAlign?: "top" | "middle" | "bottom" | "baseline";
        containerHeight?: number;
    }, program?: WebGLProgram): void;
}
