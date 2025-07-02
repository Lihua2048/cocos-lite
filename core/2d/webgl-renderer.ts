
import { mat4 } from "gl-matrix";
import { Entity } from "../types";
import { EditorState, Animation } from "../types";
import ResourceManager from "../resources/ResourceManager";
import { SceneManager } from "../scene/SceneManager";
import { SDFTextRenderer, SDFMeta } from "./sdf-font/sdf-text-renderer";
import { sdfVertexShader, sdfFragmentShader } from "./sdf-font/sdf-shader";

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null;
  private canvas: HTMLCanvasElement | null;
  private vertexBuffer: WebGLBuffer | null;
  private shaderProgram: WebGLProgram | null;
  private uProjectionMatrixLocation: WebGLUniformLocation | null;
  private uColorLocation: WebGLUniformLocation | null;
  private aPositionLocation: number | null;
  private entityVertexBuffer: WebGLBuffer | null;
  private projectionMatrix: mat4;
  private lastCanvasSize: { width: number; height: number };
  private textureCache: Map<string, WebGLTexture>;
  private resourceManager: ResourceManager;
  private uTextureLocation: WebGLUniformLocation | null;
  private uUseTextureLocation: WebGLUniformLocation | null;
  // SDF字体渲染相关
  private sdfTextRenderer: SDFTextRenderer | null;
  private sdfFontLoaded: boolean;
  private sdfShaderProgram: WebGLProgram | null = null;
  private sdfUniforms: {
    u_projectionMatrix: WebGLUniformLocation | null;
    u_fontTexture: WebGLUniformLocation | null;
    u_textColor: WebGLUniformLocation | null;
  } = {
    u_projectionMatrix: null,
    u_fontTexture: null,
    u_textColor: null,
  };
  // 编译并缓存 SDF 字体专用 shader
  private initSDFShader() {
    if (!this.gl) return null;
    const gl = this.gl;
    // 编译顶点着色器
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, sdfVertexShader);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error("SDF Vertex shader error:", gl.getShaderInfoLog(vs));
      gl.deleteShader(vs);
      return null;
    }
    // 编译片段着色器
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, sdfFragmentShader);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("SDF Fragment shader error:", gl.getShaderInfoLog(fs));
      gl.deleteShader(fs);
      return null;
    }
    // 创建 program
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("SDF Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    // 缓存 uniform 位置
    this.sdfUniforms = {
      u_projectionMatrix: gl.getUniformLocation(program, "u_projectionMatrix"),
      u_fontTexture: gl.getUniformLocation(program, "u_fontTexture"),
      u_textColor: gl.getUniformLocation(program, "u_textColor"),
    };
    return program;
  }



  constructor(resourceManager: ResourceManager) {
    this.gl = null;
    this.canvas = null;
    this.vertexBuffer = null;
    this.shaderProgram = null;
    this.uProjectionMatrixLocation = null;
    this.uColorLocation = null;
    this.aPositionLocation = null;
    this.entityVertexBuffer = null;
    this.projectionMatrix = mat4.create();
    this.lastCanvasSize = { width: 0, height: 0 };
    this.textureCache = new Map();
    this.resourceManager = resourceManager;
    this.uTextureLocation = null;
    this.uUseTextureLocation = null;
    this.sdfTextRenderer = null;
    this.sdfFontLoaded = false;
  }

  async initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("webgl");

    if (!context) {
      throw new Error("WebGL not supported");
    }

    this.gl = context;
    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.gl.clearColor(0, 0, 0, 1);

    // 创建着色器程序
    this.shaderProgram = this.initShaders();

    this.vertexBuffer = this.initVertexBuffer();

    // 缓存 uniform 位置
    if (this.shaderProgram) {
      this.uProjectionMatrixLocation = this.gl.getUniformLocation(
        this.shaderProgram,
        "u_projectionMatrix"
      );
      this.uColorLocation = this.gl.getUniformLocation(
        this.shaderProgram,
        "u_color"
      );
      this.uTextureLocation = this.gl.getUniformLocation(
        this.shaderProgram,
        "u_texture"
      );
      this.uUseTextureLocation = this.gl.getUniformLocation(
        this.shaderProgram,
        "u_useTexture"
      );
      this.aPositionLocation = this.gl.getAttribLocation(
        this.shaderProgram,
        "a_position"
      );

      // 创建实体顶点缓冲区
      this.entityVertexBuffer = this.gl.createBuffer();
    }

    // 加载 SDF 字体元数据和贴图（自动适配 msdf-bmfont-xml 生成的新资源）
    try {
      const metaResp = await fetch("./core/2d/sdf-font/HarmonyOS_Sans_Regular-msdf.json");
      const meta = await metaResp.json();
      this.sdfTextRenderer = new SDFTextRenderer(this.gl, meta);
      // 贴图文件名自动取 pages[0]
      const atlas = meta.pages && meta.pages[0] ? meta.pages[0] : "HarmonyOS_Sans_Regular-msdf.png";
      await this.sdfTextRenderer.loadTexture(`./core/2d/sdf-font/${atlas}`);
      this.sdfFontLoaded = true;
      // 初始化 SDF shader
      this.sdfShaderProgram = this.initSDFShader();
    } catch (e) {
      console.warn("SDF字体加载失败", e);
    }
  }

  private initVertexBuffer() {
    const gl = this.gl!;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // 定义一个正方形顶点数据
    const vertices = new Float32Array([
      -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return buffer;
  }

  private initShaders() {
    const gl = this.gl!;

    // 确保着色器精度声明
    const vsSource = `
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    uniform mat4 u_projectionMatrix;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = u_projectionMatrix * a_position;
      v_texCoord = a_texCoord;
    }
  `;

    const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    uniform sampler2D u_texture;
    uniform bool u_useTexture;
    varying vec2 v_texCoord;
    void main() {
      if (u_useTexture) {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      } else {
        gl_FragColor = u_color;
      }
    }
  `;

    // 创建顶点着色器
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) {
      throw new Error("Failed to create vertex shader");
    }
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    // 添加着色器编译错误检查
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(
        "Vertex shader compilation error:",
        gl.getShaderInfoLog(vs)
      );
      gl.deleteShader(vs);
      return null;
    }

    // 创建片段着色器
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) {
      throw new Error("Failed to create fragment shader");
    }
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(
        "Fragment shader compilation error:",
        gl.getShaderInfoLog(fs)
      );
      gl.deleteShader(fs);
      return null;
    }

    // 创建着色器程序
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Failed to create WebGL program");
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // 添加程序链接错误检查
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  cleanup() {
    if (this.gl && this.entityVertexBuffer) {
      this.gl.deleteBuffer(this.entityVertexBuffer);
    }

    if (this.gl && this.shaderProgram) {
      this.gl.deleteProgram(this.shaderProgram);
    }

    this.gl = null;
    this.canvas = null;
    this.vertexBuffer = null;
    this.shaderProgram = null;
    this.uColorLocation = null;
    this.aPositionLocation = null;
  }

  private isInitialized(): boolean {
    return (
      !!this.gl &&
      !!this.shaderProgram &&
      !!this.vertexBuffer &&
      !!this.entityVertexBuffer
    );
  }

  // 加载纹理
  private loadTexture(url: string): Promise<WebGLTexture> {
    return new Promise((resolve, reject) => {
      if (!this.gl) {
        reject(new Error("WebGL context not available"));
        return;
      }

      const gl = this.gl;
      const texture = gl.createTexture();
      if (!texture) {
        reject(new Error("Failed to create texture"));
        return;
      }

      const image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.textureCache.set(url, texture);
        resolve(texture);
      };
      image.onerror = (e) => {
        reject(e);
      };
      image.src = url;
    });
  }

  // 添加纹理资源
  public addTextureResource(id: string, url: string) {
    const image = new Image();
    image.src = url;
    this.resourceManager.addTexture(id, image);
    this.loadTexture(url).catch(console.error);
  }

  // 添加创建纹理的方法
  private createTexture(image: HTMLImageElement): WebGLTexture {
    const gl = this.gl!;
    const texture = gl.createTexture()!;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return texture;
  }
  // 新增参数 animations, currentTimes
  render(entities: Entity[], animations?: Record<string, Animation>, entityAnimationState?: Record<string, { currentAnimation?: string; currentTime: number }>) {
    if (!this.isInitialized()) {
      console.warn("WebGL resources not initialized");
      return;
    }
    if (!this.gl || !this.shaderProgram || !this.vertexBuffer) {
      console.warn("WebGL resources not initialized");
      return;
    }

    const gl = this.gl;
    const shaderProgram = this.shaderProgram; // 提取到局部变量

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 检查WebGL状态
    if (!gl.isEnabled(gl.BLEND)) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    // 绑定顶点缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    // 获取画布尺寸，检查画布尺寸是否变化
    const canvas = this.canvas!;
    const pixelRatio = window.devicePixelRatio || 1;
    const currentWidth = canvas.clientWidth * pixelRatio;
    const currentHeight = canvas.clientHeight * pixelRatio;

    if (
      currentWidth !== this.lastCanvasSize.width ||
      currentHeight !== this.lastCanvasSize.height
    ) {
      // 更新投影矩阵
      mat4.ortho(
        this.projectionMatrix,
        0,
        currentWidth,
        currentHeight,
        0,
        -1,
        1
      );
      this.lastCanvasSize = { width: currentWidth, height: currentHeight };
    }

    // 激活着色器程序，将投影矩阵传递给gpu
    gl.useProgram(shaderProgram);
    if (this.uProjectionMatrixLocation) {
      gl.uniformMatrix4fv(
        this.uProjectionMatrixLocation,
        false,
        this.projectionMatrix //相当于transform
      );
    }

    // 提前设置顶点属性指针
    if (this.aPositionLocation !== null) {
      gl.enableVertexAttribArray(this.aPositionLocation);
      gl.vertexAttribPointer(this.aPositionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // 设置纹理采样器
    if (this.uTextureLocation) {
      gl.uniform1i(this.uTextureLocation, 0); // 使用纹理单元0
    }

    entities.forEach((entity) => {
      if (!entity || !entity.position || !entity.properties) {
        console.warn("Invalid entity:", entity);
        return;
      }
      // 动画插值部分
      let x = entity.position.x || 0;
      let y = entity.position.y || 0;
      let width = entity.properties.width || 50;
      let height = entity.properties.height || 50;
      // 健壮兜底 color 逻辑
      let color: [number, number, number, number] = [1, 1, 1, 1];
      if (entity.type === 'sprite') {
        if (Array.isArray(entity.properties.color) && entity.properties.color.length === 4 && entity.properties.color.every(v => typeof v === 'number')) {
          color = entity.properties.color;
        }
      } else if (entity.type === 'ui-button' || entity.type === 'ui-input' || entity.type === 'ui-text') {
        if (Array.isArray(entity.properties.color) && entity.properties.color.length === 4 && entity.properties.color.every(v => typeof v === 'number')) {
          color = entity.properties.color;
        } else {
          color = [0.9, 0.9, 0.9, 1];
        }
      }

      // 如果有动画状态和动画数据，做插值
      if (entityAnimationState && animations && entity.id in entityAnimationState) {
        const animState = entityAnimationState[entity.id];
        const animName = animState.currentAnimation;
        const t = animState.currentTime;
        if (animName && animations[animName]) {
          const anim = animations[animName];
          // 针对 propertyName 匹配插值
          if (anim.propertyName === 'position') {
            const px = interpolateKeyframes(anim.keyframes, t, 'x');
            const py = interpolateKeyframes(anim.keyframes, t, 'y');
            if (px !== undefined) x = px;
            if (py !== undefined) y = py;
          } else if (anim.propertyName === 'color') {
            const c0 = interpolateKeyframes(anim.keyframes, t, 0);
            const c1 = interpolateKeyframes(anim.keyframes, t, 1);
            const c2 = interpolateKeyframes(anim.keyframes, t, 2);
            const c3 = interpolateKeyframes(anim.keyframes, t, 3);
            color = [c0 ?? color[0], c1 ?? color[1], c2 ?? color[2], c3 ?? color[3]];
          } else if (anim.propertyName === 'width') {
            const w = interpolateKeyframes(anim.keyframes, t);
            if (w !== undefined) width = w;
          } else if (anim.propertyName === 'height') {
            const h = interpolateKeyframes(anim.keyframes, t);
            if (h !== undefined) height = h;
          }
        }
      }

      const useTexture = !!entity.properties.texture;
      if (this.uUseTextureLocation) {
        gl.uniform1i(this.uUseTextureLocation, useTexture ? 1 : 0);
      }
      if (this.uColorLocation) {
        gl.uniform4fv(this.uColorLocation, color);
      }
      if (useTexture && entity.properties.texture) {
        const textureId = entity.properties.texture;
        const textureImage = this.resourceManager.getTexture(textureId);
        if (textureImage) {
          let texture = this.textureCache.get(textureId);
          if (!texture) {
            texture = this.createTexture(textureImage);
            this.textureCache.set(textureId, texture);
          }
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }
      }
      // 创建实体特定的顶点数据（包含纹理坐标）
      // 修复：每次绘制前都绑定entityVertexBuffer，防止no buffer错误
      gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
      const entityVertices = new Float32Array([
        x, y, 0.0, 0.0,
        x + width, y, 1.0, 0.0,
        x, y + height, 0.0, 1.0,
        x + width, y + height, 1.0, 1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, entityVertices, gl.STATIC_DRAW);
      const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position");
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
      const texCoordAttributeLocation = gl.getAttribLocation(shaderProgram, "a_texCoord");
      if (texCoordAttributeLocation !== -1) {
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // -------- SDF字体渲染：UI组件文字 --------
      if ((entity.type === 'ui-button' || entity.type === 'ui-input' || entity.type === 'ui-text') && this.sdfTextRenderer && this.sdfFontLoaded && this.sdfShaderProgram) {
        const text = entity.properties.text || '';
        if (text) {
          const fontSize = entity.properties.fontSize || 16;
          const textColor = entity.properties.textColor || [0,0,0,1];
          const textAlign = entity.properties.textAlign || 'left';
          // 新增：支持垂直方向排版，默认居中，可选 top/middle/bottom
          // 通过 entity.properties.verticalAlign 控制，默认 middle
          const verticalAlign = entity.properties.verticalAlign || 'middle';
          let textY = y;
          // 向上移动50%：在顶对齐的基础上再向上偏移一半高度
          // 即 y + fontSize - height * 0.5
          textY = y;
          // 切换到 SDF shader
          gl.useProgram(this.sdfShaderProgram);
          // 设置投影矩阵
          if (this.sdfUniforms.u_projectionMatrix) {
            gl.uniformMatrix4fv(this.sdfUniforms.u_projectionMatrix, false, this.projectionMatrix);
          }
          // 绑定字体贴图
          gl.activeTexture(gl.TEXTURE0);
          if (this.sdfTextRenderer.fontTexture && this.sdfUniforms.u_fontTexture) {
            gl.bindTexture(gl.TEXTURE_2D, this.sdfTextRenderer.fontTexture);
            gl.uniform1i(this.sdfUniforms.u_fontTexture, 0);
          }
          // 设置字体颜色
          if (this.sdfUniforms.u_textColor) {
            gl.uniform4fv(this.sdfUniforms.u_textColor, textColor);
          }
          // 绘制文字
          this.sdfTextRenderer.drawText(
            text,
            x,
            textY,
            {
              fontSize,
              color: textColor,
              textAlign,
              maxWidth: width
            },
            this.sdfShaderProgram // 强制传入 SDF shader program
          );
          // 恢复主 shader
          gl.useProgram(shaderProgram);
        }
      }
    });

    // 关键帧插值函数
    function interpolateKeyframes(keyframes: any[], t: number, key?: string | number): any {
      if (!keyframes || keyframes.length === 0) return undefined;
      // 支持多维属性（如 position.x/y 或 color[0-3]）
      // key 为 string 时，keyframes 结构应为 {time, value: {x, y}}，为 number 时为数组
      let prev = keyframes[0];
      let next = keyframes[keyframes.length - 1];
      for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
          prev = keyframes[i];
          next = keyframes[i + 1];
          break;
        }
      }
      if (prev === next) {
        if (key !== undefined && prev.value && typeof prev.value === 'object') {
          return prev.value[key];
        }
        return prev.value;
      }
      const ratio = (t - prev.time) / (next.time - prev.time);
      if (key !== undefined && prev.value && next.value && typeof prev.value === 'object') {
        return prev.value[key] * (1 - ratio) + next.value[key] * ratio;
      }
      return prev.value * (1 - ratio) + next.value * ratio;
    }
  }
}
