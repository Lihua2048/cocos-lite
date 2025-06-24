import { mat4 } from "gl-matrix";
import { Entity } from "../core/types";

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
    uniform mat4 u_projectionMatrix;
    void main() {
      gl_Position = u_projectionMatrix * a_position;
    }
  `;

    const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
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
    console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vs));
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
    console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fs));
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
    console.error('Program linking error:', gl.getProgramInfoLog(program));
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

    // 使用着色器程序
    gl.useProgram(shaderProgram);

    // 绑定顶点缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    // 获取画布尺寸
    const canvas = this.canvas!;
    const pixelRatio = window.devicePixelRatio || 1;
    // 检查画布尺寸是否变化
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

    // 应用投影矩阵
    if (this.uProjectionMatrixLocation) {
      gl.uniformMatrix4fv(
        this.uProjectionMatrixLocation,
        false,
        this.projectionMatrix
      );
    }

    // 提前设置顶点属性指针
  if (this.aPositionLocation !== null) {
    gl.enableVertexAttribArray(this.aPositionLocation);
    gl.vertexAttribPointer(this.aPositionLocation, 2, gl.FLOAT, false, 0, 0);
  }

    entities.forEach((entity) => {
      // 安全检查
      if (!entity || !entity.position || !entity.properties) {
        console.warn("Invalid entity:", entity);
        return;
      }

      // 直接设置颜色（使用缓存的位置）
    if (this.uColorLocation) {
      gl.uniform4fv(this.uColorLocation, entity.properties.color || [1, 0, 0, 1]);
    }

      // 根据实体位置和尺寸生成顶点数据
      const x = entity.position.x || 0;
      const y = entity.position.y || 0;
      const width = entity.properties.width || 50;
      const height = entity.properties.height || 50;

      // 创建实体特定的顶点数据
      const entityVertices = new Float32Array([
        x,
        y,
        x + width,
        y,
        x,
        y + height,
        x + width,
        y + height,
      ]);

      // 更新缓冲区数据（不创建新缓冲区）
      gl.bufferData(gl.ARRAY_BUFFER, entityVertices, gl.STATIC_DRAW);

      // 启用顶点属性指针
      const positionAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "a_position"
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );

      // 执行绘制调用
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }
}
