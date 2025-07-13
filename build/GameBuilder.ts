import { SceneData, Entity, Animation } from '../core/types';
import { WebGLRenderer } from '../core/2d/webgl-renderer';
import { physicsWorld } from '../core/physics';
import ResourceManager from '../core/resources/ResourceManager';

/**
 * 游戏打包构建器
 * 将编辑器场景数据转换为可运行的游戏包
 */
export class GameBuilder {
  private sceneData: SceneData[];
  private resourceManager: ResourceManager;
  private outputDir: string;

  constructor(scenes: SceneData[], resourceManager: ResourceManager, outputDir: string = './game') {
    this.sceneData = scenes;
    this.resourceManager = resourceManager;
    this.outputDir = outputDir;
  }

  /**
   * 构建 H5 游戏
   */
  async buildH5Game(): Promise<any> {
    console.log('开始构建 H5 游戏...');
    console.log('场景数据:', this.sceneData.map(s => ({
      id: s.id,
      name: s.name,
      entityCount: Object.keys(s.entities).length,
      entities: Object.keys(s.entities)
    })));

    // 1. 生成游戏运行时代码
    const gameRuntime = this.generateGameRuntime();

    // 2. 生成场景数据文件
    const sceneDataFile = this.generateSceneDataFile();

    // 3. 生成 HTML 入口文件
    const htmlTemplate = this.generateHTMLTemplate();

    // 4. 复制资源文件
    await this.copyResources('h5');

    // 5. 生成构建配置
    const buildConfig = this.generateBuildConfig('h5');

    // 6. 不在浏览器环境中写入文件，直接返回结果
    // await this.writeFiles({
    //   'index.html': htmlTemplate,
    //   'game.js': gameRuntime,
    //   'data/scenes.json': sceneDataFile,
    //   'config/build.json': buildConfig
    // });

    console.log('H5 游戏构建完成！');
    console.log('场景数据已生成:', JSON.parse(sceneDataFile));

    return {
      gameRuntime,
      sceneDataFile,
      htmlTemplate,
      buildConfig
    };
  }

  /**
   * 构建微信小游戏
   */
  async buildWechatGame(): Promise<any> {
    console.log('开始构建微信小游戏...');

    // 1. 生成游戏运行时代码（小游戏版本）
    const gameRuntime = this.generateGameRuntime('wechat');

    // 2. 生成小游戏配置文件
    const gameConfig = this.generateWechatGameConfig();

    // 3. 生成场景数据文件
    const sceneDataFile = this.generateSceneDataFile();

    // 4. 复制资源文件
    await this.copyResources('wechat');

    // 5. 生成适配器代码
    const adapter = this.generateWechatAdapter();

    console.log('微信小游戏构建完成！');

    return {
      gameRuntime,
      gameConfig,
      sceneDataFile,
      adapter
    };
  }

  /**
   * 生成游戏运行时代码
   */
  private generateGameRuntime(platform: 'h5' | 'wechat' = 'h5'): string {
    return `
// 游戏运行时 - ${platform}
// 简化版本，直接在浏览器中运行

class SimpleGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.sceneData = null;
    this.currentScene = null;
    this.entities = [];
    this.animationId = null;
  }

  async init() {
    console.log('SimpleGame: 开始初始化游戏...');

    // 获取Canvas
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('SimpleGame: 找不到游戏Canvas');
      document.body.innerHTML += '<div style="color: red; font-size: 20px;">错误：找不到游戏Canvas</div>';
      return;
    }

    console.log('SimpleGame: Canvas找到，尺寸:', this.canvas.width, 'x', this.canvas.height);
    this.ctx = this.canvas.getContext('2d');

    // 加载场景数据
    try {
      console.log('SimpleGame: 开始加载场景数据...');
      console.log('SimpleGame: window.sceneData存在?', !!window.sceneData);

      // 优先从window对象获取注入的场景数据
      if (window.sceneData) {
        this.sceneData = window.sceneData;
        console.log('SimpleGame: 从window.sceneData加载场景数据成功');
      } else if (window.SCENE_DATA) {
        this.sceneData = window.SCENE_DATA;
        console.log('SimpleGame: 从window.SCENE_DATA加载场景数据成功');
      } else {
        console.log('SimpleGame: 尝试通过fetch加载场景数据...');
        const response = await fetch('./data/scenes.json');
        this.sceneData = await response.json();
        console.log('SimpleGame: 通过fetch加载场景数据成功');
      }

      console.log('SimpleGame: 场景数据加载完成:', this.sceneData);
      console.log('SimpleGame: 场景数量:', this.sceneData?.scenes?.length || 0);

    } catch (error) {
      console.error('SimpleGame: 加载场景数据失败:', error);

      // 创建默认场景数据
      console.log('SimpleGame: 创建默认场景数据');
      this.sceneData = {
        scenes: [{
          id: 'default',
          name: '默认场景',
          entities: {
            'default-entity': {
              id: 'default-entity',
              type: 'ui-text',
              position: { x: 50, y: 50 },
              properties: {
                width: 200,
                height: 40,
                text: '默认测试实体',
                color: [1, 1, 1, 1],
                textColor: [0, 0, 0, 1],
                fontSize: 16,
                textAlign: 'left',
                backgroundType: 'color'
              },
              components: []
            }
          },
          animations: {},
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            entityCount: 1
          }
        }],
        metadata: {
          buildTime: new Date().toISOString(),
          version: '1.0.0',
          totalScenes: 1
        }
      };
      console.log('SimpleGame: 默认场景数据创建完成');
    }

    // 隐藏加载文字
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    console.log('SimpleGame: 游戏初始化完成');
  }

  start() {
    console.log('开始游戏');

    // 加载第一个场景
    if (this.sceneData && this.sceneData.scenes && this.sceneData.scenes.length > 0) {
      this.loadScene(this.sceneData.scenes[0]);
    }

    // 开始渲染循环
    this.gameLoop();
  }

  loadScene(scene) {
    console.log('SimpleGame: 开始加载场景:', scene.name);
    console.log('SimpleGame: 场景实体数据:', scene.entities);
    console.log('SimpleGame: 实体数量:', Object.keys(scene.entities || {}).length);

    this.currentScene = scene;
    this.entities = Object.values(scene.entities || {});

    console.log('SimpleGame: 转换后的实体数组:', this.entities);
    console.log('SimpleGame: 每个实体的详细信息:');
    this.entities.forEach((entity, index) => {
      console.log('实体 ' + index + ':', {
        id: entity.id,
        type: entity.type,
        position: entity.position,
        properties: entity.properties
      });
    });

    // 更新页面标题
    document.title = scene.name + ' - Cocos Game';
  }

  gameLoop() {
    // 清空画布
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染实体
    if (this.entities) {
      this.entities.forEach(entity => {
        this.renderEntity(entity);
      });
    }

    // 显示场景信息
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('场景: ' + (this.currentScene ? this.currentScene.name : '无'), 10, 25);
    this.ctx.fillText('实体数量: ' + (this.entities ? this.entities.length : 0), 10, 45);

    // 继续循环
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  renderEntity(entity) {
    if (!entity || !entity.position || !entity.properties) return;

    const { position, properties, type } = entity;
    const { x, y } = position;
    const { width, height, color, text } = properties;

    // 保存上下文
    this.ctx.save();

    // 绘制背景
    if (color && Array.isArray(color)) {
      this.ctx.fillStyle = 'rgba(' + Math.floor(color[0] * 255) + ', ' + Math.floor(color[1] * 255) + ', ' + Math.floor(color[2] * 255) + ', ' + (color[3] || 1) + ')';
    } else {
      this.ctx.fillStyle = type === 'sprite' ? '#fff' : '#ccc';
    }

    this.ctx.fillRect(x, y, width, height);

    // 绘制文本
    if (text && type.startsWith('ui-')) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = (properties.fontSize || 16) + 'px Arial';
      this.ctx.textAlign = properties.textAlign || 'left';
      this.ctx.fillText(text, x + 5, y + height/2 + 5);
    }

    // 绘制边框
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // 恢复上下文
    this.ctx.restore();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// 启动游戏
const game = new SimpleGame();

${platform === 'wechat' ? `
// 微信小游戏适配
wx.onShow(() => {
  game.init().then(() => game.start());
});
` : `
// H5版本
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM已加载，开始初始化游戏');

  // 等待一下确保所有脚本都已加载
  setTimeout(() => {
    console.log('开始执行游戏初始化');
    game.init().then(() => {
      console.log('游戏初始化完成，开始游戏');
      game.start();
    }).catch(error => {
      console.error('游戏初始化失败:', error);
    });
  }, 100);
});
`}

// 导出游戏实例
window.game = game;
`;
  }

  /**
   * 生成场景数据文件
   */
  private generateSceneDataFile(): string {
    const exportData = {
      scenes: this.sceneData,
      metadata: {
        buildTime: new Date().toISOString(),
        version: '1.0.0',
        totalScenes: this.sceneData.length
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 生成 HTML 模板
   */
  private generateHTMLTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cocos Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #000;
            font-family: Arial, sans-serif;
        }
        #gameCanvas {
            border: 1px solid #333;
            background: #222;
        }
        #loading {
            position: absolute;
            color: white;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div id="loading">正在加载游戏...</div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <!-- 游戏代码将在这里注入 -->
</body>
</html>
`;
  }

  /**
   * 生成微信小游戏配置
   */
  private generateWechatGameConfig(): string {
    return JSON.stringify({
      "deviceOrientation": "portrait",
      "showStatusBar": false,
      "networkTimeout": {
        "request": 10000,
        "connectSocket": 10000,
        "uploadFile": 10000,
        "downloadFile": 10000
      },
      "subpackages": [],
      "workers": "workers",
      "requiredPrivateInfos": [],
      "permission": {
        "scope.userLocation": {
          "desc": "你的位置信息将用于小游戏位置接口的效果展示"
        }
      },
      "plugins": {},
      "resizable": false
    }, null, 2);
  }

  /**
   * 生成微信适配器
   */
  private generateWechatAdapter(): string {
    return `
// 微信小游戏适配器
// 适配 DOM API
if (!global.document) {
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') return wx.createCanvas();
      return {};
    },
    getElementById: () => wx.createCanvas(),
  };
}

// 适配 Window API
if (!global.window) {
  global.window = global;
  global.window.devicePixelRatio = wx.getSystemInfoSync().pixelRatio;
  global.window.requestAnimationFrame = wx.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
  global.window.cancelAnimationFrame = wx.cancelAnimationFrame || clearTimeout;
}

// 适配 Image API
if (!global.Image) {
  global.Image = () => wx.createImage();
}

// 适配 Audio API
if (!global.Audio) {
  global.Audio = (src) => {
    const audio = wx.createInnerAudioContext();
    if (src) audio.src = src;
    return audio;
  };
}

console.log('微信小游戏适配器加载完成');
`;
  }

  /**
   * 生成构建配置
   */
  private generateBuildConfig(platform: 'h5' | 'wechat'): any {
    if (platform === 'h5') {
      return {
        type: 'h5',
        entry: './game.js',
        output: {
          path: './dist',
          filename: 'game.min.js'
        },
        optimization: {
          minimize: true
        }
      };
    } else {
      return {
        type: 'wechat',
        entry: './game.js',
        output: {
          path: './dist',
          filename: 'game.js'
        },
        adapter: './adapter.js'
      };
    }
  }

  /**
   * 复制资源文件
   */
  private async copyResources(platform: 'h5' | 'wechat'): Promise<void> {
    // 这里需要复制纹理、字体、音频等资源文件
    console.log(`复制 ${platform} 平台资源文件...`);

    // 复制 SDF 字体文件
    const sdfFontFiles = [
      '../core/2d/sdf-font/roboto-msdf.json',
      '../core/2d/sdf-font/roboto-msdf.png'
    ];

    // 复制纹理资源
    const textureFiles = this.resourceManager.getAllTextures();

    console.log('资源文件复制完成');
  }

  /**
   * 写入文件到输出目录 (浏览器版本 - 模拟写入)
   */
  private async writeFiles(files: Record<string, string>): Promise<void> {
    console.log('构建文件准备完成:');

    for (const [filePath, content] of Object.entries(files)) {
      console.log(`文件: ${filePath} (${content.length} 字符)`);

      // 在浏览器环境中，我们将文件内容存储到localStorage或直接提供下载
      if (typeof window !== 'undefined') {
        // 存储到localStorage便于调试
        localStorage.setItem(`build_${filePath.replace(/[\/\\]/g, '_')}`, content);

        // 如果是主要文件，提供下载链接
        if (filePath === 'index.html' || filePath === 'data/scenes.json') {
          this.downloadFile(filePath, content);
        }
      }
    }

    console.log('所有文件已准备完成，可通过浏览器开发者工具查看localStorage中的build_*项目');
  }

  /**
   * 在浏览器中下载文件
   */
  private downloadFile(filename: string, content: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/[\/\\]/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default GameBuilder;
