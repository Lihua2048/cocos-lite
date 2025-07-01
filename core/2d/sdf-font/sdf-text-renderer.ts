// SDF 字体渲染工具（简化版，支持单行文本、单色、textAlign/fontSize/textColor）


export interface SDFChar {
  x: number; y: number; w: number; h: number; ox: number; oy: number; xa: number;
}
export interface SDFMeta {
  atlas: string;
  size: number;
  lineHeight: number;
  chars: Record<string, SDFChar>;
}

export class SDFTextRenderer {
  private gl: WebGLRenderingContext;
  private fontMeta: SDFMeta;
  private fontTexture: WebGLTexture | null = null;
  constructor(gl: WebGLRenderingContext, fontMeta: SDFMeta) {
    this.gl = gl;
    this.fontMeta = fontMeta;
  }
  async loadTexture(imageUrl: string) {
    return new Promise<WebGLTexture>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const tex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.fontTexture = tex;
        resolve(tex!);
      };
      image.onerror = reject;
      image.src = imageUrl;
    });
  }
  // 渲染单行文本（WebGL，支持颜色、字号、对齐、maxWidth）
  drawText(text: string, x: number, y: number, options: {
    fontSize: number;
    color: [number, number, number, number];
    textAlign: 'left' | 'center' | 'right';
    maxWidth?: number;
  }) {
    if (!this.fontTexture) return;
    const gl = this.gl;
    // 1. 计算缩放
    const scale = options.fontSize / this.fontMeta.size;
    // 2. 计算文本宽度
    let textWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = this.fontMeta.chars[text[i]];
      if (ch) textWidth += ch.xa * scale;
    }
    // 3. 对齐
    let drawX = x;
    if (options.textAlign === 'center') drawX = x + ((options.maxWidth || textWidth) - textWidth) / 2;
    else if (options.textAlign === 'right') drawX = x + ((options.maxWidth || textWidth) - textWidth);

    // 4. 激活 SDF shader（假设外部已绑定）
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
    // 5. 设置颜色
    // 需由外部设置 u_textColor
    // 6. 逐字渲染
    let penX = drawX;
    for (let i = 0; i < text.length; i++) {
      const ch = this.fontMeta.chars[text[i]];
      if (!ch) continue;
      // 顶点坐标
      const x0 = penX + ch.ox * scale;
      const y0 = y - ch.oy * scale;
      const x1 = x0 + ch.w * scale;
      const y1 = y0 + ch.h * scale;
      // 纹理坐标
      const u0 = ch.x / this.fontMeta.atlas.length;
      const v0 = ch.y / this.fontMeta.atlas.length;
      const u1 = (ch.x + ch.w) / this.fontMeta.atlas.length;
      const v1 = (ch.y + ch.h) / this.fontMeta.atlas.length;
      // 顶点数据（两个三角形）
      const vertices = new Float32Array([
        x0, y0, u0, v0,
        x1, y0, u1, v0,
        x0, y1, u0, v1,
        x1, y1, u1, v1,
      ]);
      // 创建缓冲区
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
      // 绑定属性
      const aPos = gl.getAttribLocation((gl as any).program, 'a_position');
      const aTex = gl.getAttribLocation((gl as any).program, 'a_texCoord');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aTex);
      gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);
      // 绘制
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.deleteBuffer(buffer);
      penX += ch.xa * scale;
    }
  }
}
