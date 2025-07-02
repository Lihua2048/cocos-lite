// SDF 字体渲染工具（简化版，支持单行文本、单色、textAlign/fontSize/textColor）

export interface SDFChar {
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  xa: number;
  // 兼容 BMFont
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

// BMFont 兼容类型
type BMFontMeta = {
  pages: string[];
  chars: Array<any>;
  common: { scaleW: number; scaleH: number; lineHeight: number };
  info?: { size?: number };
};

export class SDFTextRenderer {
  private gl: WebGLRenderingContext;
  private fontMeta: SDFMeta;
  public fontTexture: WebGLTexture | null = null;
  constructor(gl: WebGLRenderingContext, fontMeta: any) {
    this.gl = gl;
    // 自动适配 BMFont 标准格式
    if (Array.isArray(fontMeta.chars)) {
      // BMFont 格式
      const bm: BMFontMeta = fontMeta;
      const charsObj: Record<string, SDFChar> = {};
      for (const ch of bm.chars) {
        charsObj[ch.char] = {
          x: ch.x,
          y: ch.y,
          w: ch.width,
          h: ch.height,
          ox: ch.xoffset,
          oy: ch.yoffset,
          xa: ch.xadvance,
          id: ch.id,
          char: ch.char,
          width: ch.width,
          height: ch.height,
          xoffset: ch.xoffset,
          yoffset: ch.yoffset,
          xadvance: ch.xadvance,
          page: ch.page
        };
      }
      this.fontMeta = {
        atlas: bm.pages[0],
        atlasWidth: bm.common.scaleW,
        atlasHeight: bm.common.scaleH,
        size: bm.info?.size || 32,
        lineHeight: bm.common.lineHeight,
        chars: charsObj
      };
    } else {
      // 兼容原有格式
      this.fontMeta = fontMeta;
    }
  }
  async loadTexture(imageUrl: string) {
    return new Promise<WebGLTexture>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const tex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          image
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR
        );
        this.fontTexture = tex;
        resolve(tex!);
      };
      image.onerror = reject;
      image.src = imageUrl;
    });
  }
  // 渲染单行文本（WebGL，支持颜色、字号、对齐、maxWidth）
  /**
   * 渲染单行文本，支持垂直居中（verticalAlign: 'top'|'middle'|'bottom'|'baseline'）
   * @param text 文本
   * @param x x 坐标（容器左上角）
   * @param y y 坐标（容器顶部）
   * @param options 渲染选项
   * @param program 可选，WebGLProgram
   */
  drawText(
    text: string,
    x: number,
    y: number,
    options: {
      fontSize: number;
      color: [number, number, number, number];
      textAlign: "left" | "center" | "right";
      maxWidth?: number;
      verticalAlign?: "top" | "middle" | "bottom" | "baseline";
      containerHeight?: number; // 可选，容器高度（如按钮高度）
    },
    program?: WebGLProgram
  ) {
    if (!this.fontTexture) return;
    const gl = this.gl;

    // 获取 SDF shader program
    const useProgram = program || gl.getParameter(gl.CURRENT_PROGRAM);
    // 获取属性位置（必须用 SDF shader 的 program）
    const aPos = gl.getAttribLocation(useProgram, "a_position");
    const aTex = gl.getAttribLocation(useProgram, "a_texCoord");
    // 1. 计算缩放
    const scale = options.fontSize / (this.fontMeta.size || 32);
    // 2. 计算文本宽度和最大 ascent/descent（未缩放，最后统一乘 scale）
    let textWidth = 0;
    let maxAscent = 0, maxDescent = 0;
    const baseline = (this.fontMeta as any).base || this.fontMeta.lineHeight || (this.fontMeta.size || 32);
    for (let i = 0; i < text.length; i++) {
      const ch = this.fontMeta.chars[text[i]];
      if (ch) {
        textWidth += ch.xa;
        // oy 归一化，部分 BMFont oy 可能为负，导致小写字母上浮
        const oy = ch.oy < 0 ? 0 : ch.oy;
        // ascent: baseline - oy
        // descent: oy + h - baseline
        const ascent = baseline - oy;
        const descent = oy + ch.h - baseline;
        if (ascent > maxAscent) maxAscent = ascent;
        if (descent > maxDescent) maxDescent = descent;
      }
    }
    textWidth *= scale;
    maxAscent *= scale;
    maxDescent *= scale;
    // 3. 对齐
    let drawX = x;
    if (options.textAlign === "center")
      drawX = x + ((options.maxWidth || textWidth) - textWidth) / 2;
    else if (options.textAlign === "right")
      drawX = x + ((options.maxWidth || textWidth) - textWidth);

    // 4. 垂直对齐
    let drawY = y;
    const verticalAlign = options.verticalAlign || "baseline";
    if (verticalAlign === "middle") {
      // 容器高度优先，否则用 maxAscent+maxDescent
      const containerH = options.containerHeight || (maxAscent + maxDescent);
      drawY = y + (containerH - (maxAscent + maxDescent)) / 2;
    } else if (verticalAlign === "top") {
      drawY = y;
    } else if (verticalAlign === "bottom") {
      const containerH = options.containerHeight || (maxAscent + maxDescent);
      drawY = y + (containerH - (maxAscent + maxDescent));
    } // baseline 默认 y

    // 5. 激活 SDF shader（假设外部已绑定）
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
    // 6. 设置颜色
    // 需由外部设置 u_textColor
    // 7. 逐字渲染
    let penX = drawX;
    for (let i = 0; i < text.length; i++) {
      const ch = this.fontMeta.chars[text[i]];
      if (!ch) {
        if (text[i] === ' ') {
          penX += (this.fontMeta.chars['h']?.xa || 16) * scale * 0.6;
        }
        continue;
      }
      // oy 归一化，防止小写字母上浮
      const oy = ch.oy < 0 ? 0 : ch.oy;
      // baseline 对齐：y0 = drawY + (baseline - oy) * scale
      const x0 = penX + ch.ox * scale;
      const y0 = drawY + (baseline - oy) * scale;
      const x1 = x0 + ch.w * scale;
      const y1 = y0 + ch.h * scale;
      const u0 = ch.x / (this.fontMeta.atlasWidth || 1024);
      const v0 = ch.y / (this.fontMeta.atlasHeight || 1024);
      const u1 = (ch.x + ch.w) / (this.fontMeta.atlasWidth || 1024);
      const v1 = (ch.y + ch.h) / (this.fontMeta.atlasHeight || 1024);
      const vertices = new Float32Array([
        x0, y0, 0, 1, u0, v0,
        x1, y0, 0, 1, u1, v0,
        x0, y1, 0, 1, u0, v1,
        x1, y1, 0, 1, u1, v1,
      ]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 4, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(aTex);
      gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 24, 16);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(aPos);
      gl.disableVertexAttribArray(aTex);
      if (buffer) gl.deleteBuffer(buffer);
      penX += ch.xa * scale;
    }
  }
}
