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

    console.log('H5 游戏构建完成！');

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
import { WebGLRenderer } from './runtime/renderer.js';
import { PhysicsWorld } from './runtime/physics.js';
import { SceneManager } from './runtime/scene-manager.js';
import { GameLoop } from './runtime/game-loop.js';
import sceneData from './data/scenes.json';

class Game {
  constructor() {
    this.canvas = null;
    this.renderer = null;
    this.physics = null;
    this.sceneManager = null;
    this.gameLoop = null;
    this.resourceManager = null;
  }

  async init() {
    // 初始化 Canvas
    this.canvas = ${platform === 'wechat' ? 'wx.createCanvas()' : 'document.getElementById("gameCanvas")'};

    // 初始化渲染器
    this.renderer = new WebGLRenderer(this.resourceManager);
    await this.renderer.initialize(this.canvas);

    // 初始化物理世界
    this.physics = new PhysicsWorld();

    // 初始化场景管理器
    this.sceneManager = new SceneManager(sceneData);

    // 初始化游戏循环
    this.gameLoop = new GameLoop(this.renderer, this.physics, this.sceneManager);

    console.log('游戏初始化完成');
  }

  start() {
    // 加载第一个场景
    const firstScene = this.sceneManager.getFirstScene();
    if (firstScene) {
      this.sceneManager.loadScene(firstScene.id);
    }

    // 开始游戏循环
    this.gameLoop.start();

    console.log('游戏开始运行');
  }

  stop() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }
  }
}

// 游戏实例
const game = new Game();

${platform === 'wechat' ? `
// 微信小游戏入口
wx.onShow(() => {
  game.init().then(() => game.start());
});

wx.onHide(() => {
  game.stop();
});
` : `
// H5 游戏入口
window.addEventListener('load', () => {
  game.init().then(() => game.start());
});
`}

export default game;
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

    <script type="module" src="./game.js"></script>
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
}

export default GameBuilder;
