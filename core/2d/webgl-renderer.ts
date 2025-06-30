import { mat4 } from "gl-matrix";
import { Entity } from "../types";
import ResourceManager from "../resources/ResourceManager";
import { SceneManager } from "../scene/SceneManager";

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private shaderProgram: WebGLProgram | null = null;
  // 在类中添加缓存变量
  private uProjectionMatrixLocation: WebGLUniformLocation | null = null;
  private uColorLocation: WebGLUniformLocation | null = null;
  private aPositionLocation: number | null = null;
  private entityVertexBuffer: WebGLBuffer | null = null;
  private projectionMatrix: mat4 = mat4.create();
  private lastCanvasSize = { width: 0, height: 0 };
  // 资源管理器实例
  private textureCache: Map<string, WebGLTexture> = new Map();
  private resourceManager = new ResourceManager();
  private uTextureLocation: WebGLUniformLocation | null = null;
  private uUseTextureLocation: WebGLUniformLocation | null = null;

  // 修改构造函数以接受 resourceManager 参数
  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;
  }

  initialize(canvas: HTMLCanvasElement) {
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
  render(entities: Entity[]) {
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
      // 安全检查
      if (!entity || !entity.position || !entity.properties) {
        console.warn("Invalid entity:", entity);
        return;
      }
      const useTexture = !!entity.properties.texture;

      // 设置是否使用纹理
      if (this.uUseTextureLocation) {
        gl.uniform1i(this.uUseTextureLocation, useTexture ? 1 : 0);
      }

      // 设置颜色
      if (this.uColorLocation) {
        gl.uniform4fv(
          this.uColorLocation,
          entity.properties.color || [1, 0, 0, 1]
        );
      }

      // 如果使用纹理，绑定纹理
      if (useTexture && entity.properties.texture) {
        const textureId = entity.properties.texture;
        const textureImage = this.resourceManager.getTexture(textureId);
        if (textureImage) {
          let texture = this.textureCache.get(textureId);

          // 如果缓存中没有，创建新纹理
          if (!texture) {
            texture = this.createTexture(textureImage);
            this.textureCache.set(textureId, texture);
          }

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }
      }

      // 根据实体位置和尺寸生成顶点数据
      const x = entity.position.x || 0;
      const y = entity.position.y || 0;
      const width = entity.properties.width || 50;
      const height = entity.properties.height || 50;

      // 创建实体特定的顶点数据（包含纹理坐标）
      const entityVertices = new Float32Array([
        // 位置坐标    纹理坐标
        x,
        y,
        0.0,
        0.0,
        x + width,
        y,
        1.0,
        0.0,
        x,
        y + height,
        0.0,
        1.0,
        x + width,
        y + height,
        1.0,
        1.0,
      ]);

      // 更新缓冲区数据（不创建新缓冲区）
      gl.bufferData(gl.ARRAY_BUFFER, entityVertices, gl.STATIC_DRAW);

      // 设置位置属性
      const positionAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "a_position"
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2, // 每个顶点有2个分量 (x, y)
        gl.FLOAT,
        false,
        4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点4个浮点数 (x, y, u, v)
        0 // 从数组开头开始
      );

      // 设置纹理坐标属性
      const texCoordAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "a_texCoord"
      );
      if (texCoordAttributeLocation !== -1) {
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.vertexAttribPointer(
          texCoordAttributeLocation,
          2, // 每个纹理坐标有2个分量 (u, v)
          gl.FLOAT,
          false,
          4 * Float32Array.BYTES_PER_ELEMENT, // 每个顶点4个浮点数 (x, y, u, v)
          2 * Float32Array.BYTES_PER_ELEMENT // 从第3个元素开始
        );
      }

      // 执行绘制调用
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }
}
