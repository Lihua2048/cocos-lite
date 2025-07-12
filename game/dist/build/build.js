#!/usr/bin/env node
"use strict";
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
/**
 * 命令行构建脚本
 */
class CLIBuilder {
    constructor() {
        this.platform = process.argv.includes('--platform=wechat') ? 'wechat' : 'h5';
        this.outputDir = `../game/${this.platform}`;
    }
    async build() {
        console.log(`🚀 开始构建 ${this.platform} 游戏...`);
        try {
            // 1. 清理输出目录
            await this.cleanOutput();
            // 2. 创建目录结构
            await this.createDirectories();
            // 3. 编译 TypeScript
            await this.compileTypeScript();
            // 4. 复制资源文件
            await this.copyAssets();
            // 5. 生成配置文件
            await this.generateConfigs();
            // 6. 打包优化（生产环境）
            if (process.env.NODE_ENV === 'production') {
                await this.optimize();
            }
            console.log(`✅ ${this.platform} 游戏构建完成！`);
            console.log(`📁 输出目录: ${this.outputDir}`);
        }
        catch (error) {
            console.error(`❌ 构建失败: ${error.message}`);
            process.exit(1);
        }
    }
    async cleanOutput() {
        console.log('🧹 清理输出目录...');
        try {
            await fs.rmdir(this.outputDir, { recursive: true });
        }
        catch (error) {
            // 目录不存在，忽略错误
        }
    }
    async createDirectories() {
        console.log('📁 创建目录结构...');
        const dirs = [
            this.outputDir,
            `${this.outputDir}/runtime`,
            `${this.outputDir}/data`,
            `${this.outputDir}/assets`,
            `${this.outputDir}/assets/textures`,
            `${this.outputDir}/assets/fonts`,
            `${this.outputDir}/assets/audio`
        ];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    async compileTypeScript() {
        console.log('🔨 编译 TypeScript...');
        try {
            // 使用 tsc 编译 TypeScript 文件
            execSync('npx tsc --project ./tsconfig.build.json', {
                stdio: 'inherit',
                cwd: __dirname
            });
        }
        catch (error) {
            console.error('TypeScript 编译失败');
            throw error;
        }
    }
    async copyAssets() {
        console.log('📋 复制资源文件...');
        // 复制 SDF 字体文件
        const fontFiles = [
            '../core/2d/sdf-font/roboto-msdf.json',
            '../core/2d/sdf-font/roboto-msdf.png'
        ];
        for (const file of fontFiles) {
            const fileName = path.basename(file);
            try {
                const content = await fs.readFile(path.resolve(__dirname, file));
                await fs.writeFile(`${this.outputDir}/assets/fonts/${fileName}`, content);
            }
            catch (error) {
                console.warn(`警告: 无法复制字体文件 ${file}`);
            }
        }
        // 复制纹理文件（从编辑器资源管理器）
        // 这里需要从实际的资源目录复制
        console.log('复制纹理和其他资源文件...');
    }
    async generateConfigs() {
        console.log('⚙️ 生成配置文件...');
        if (this.platform === 'h5') {
            // 生成 index.html
            const htmlContent = this.generateHTML();
            await fs.writeFile(`${this.outputDir}/index.html`, htmlContent);
            // 生成 webpack 配置
            const webpackConfig = this.generateWebpackConfig();
            await fs.writeFile(`${this.outputDir}/webpack.config.js`, webpackConfig);
        }
        else if (this.platform === 'wechat') {
            // 生成 game.json
            const gameConfig = this.generateWechatConfig();
            await fs.writeFile(`${this.outputDir}/game.json`, gameConfig);
            // 生成 project.config.json
            const projectConfig = this.generateWechatProjectConfig();
            await fs.writeFile(`${this.outputDir}/project.config.json`, projectConfig);
        }
    }
    generateHTML() {
        return `<!DOCTYPE html>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Arial', sans-serif;
        }
        #gameContainer {
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border-radius: 8px;
            overflow: hidden;
        }
        #gameCanvas {
            display: block;
            background: #000;
        }
        #loadingScreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 18px;
        }
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        #gameInfo {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            font-size: 12px;
            background: rgba(0,0,0,0.5);
            padding: 5px 10px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <div id="loadingScreen">
            <div class="spinner"></div>
            <div>正在加载游戏...</div>
        </div>
        <div id="gameInfo" style="display: none;">
            <div>FPS: <span id="fps">60</span></div>
            <div>场景: <span id="currentScene">-</span></div>
        </div>
    </div>

    <script type="module" src="./game.js"></script>
</body>
</html>`;
    }
    generateWebpackConfig() {
        return `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './game.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'game.[contenthash].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'data', to: 'data' }
      ]
    })
  ],
  optimization: {
    minimize: true
  }
};`;
    }
    generateWechatConfig() {
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
            "requiredPrivateInfos": [],
            "permission": {},
            "resizable": false
        }, null, 2);
    }
    generateWechatProjectConfig() {
        return JSON.stringify({
            "description": "Cocos Engine 游戏项目",
            "packOptions": {
                "ignore": []
            },
            "setting": {
                "urlCheck": false,
                "es6": true,
                "enhance": false,
                "postcss": true,
                "preloadBackgroundData": false,
                "minified": true,
                "newFeature": false,
                "coverView": true,
                "nodeModules": false,
                "autoAudits": false,
                "showShadowRootInWxmlPanel": true,
                "scopeDataCheck": false,
                "uglifyFileName": false,
                "checkInvalidKey": true,
                "checkSiteMap": true,
                "uploadWithSourceMap": true,
                "compileHotReLoad": false,
                "useMultiFrameRuntime": true,
                "useApiHook": true,
                "babelSetting": {
                    "ignore": [],
                    "disablePlugins": [],
                    "outputPath": ""
                },
                "enableEngineNative": false,
                "bundle": false,
                "useIsolateContext": true,
                "useCompilerModule": true,
                "userConfirmedUseCompilerModuleSwitch": false,
                "userConfirmedBundleSwitch": false,
                "packNpmManually": false,
                "packNpmRelationList": []
            },
            "compileType": "miniprogram",
            "libVersion": "2.19.4",
            "appid": "wx1234567890abcdef",
            "projectname": "cocos-game",
            "debugOptions": {
                "hidedInDevtools": []
            },
            "scripts": {},
            "isGameTourist": false,
            "condition": {
                "search": {
                    "current": -1,
                    "list": []
                },
                "conversation": {
                    "current": -1,
                    "list": []
                },
                "game": {
                    "current": -1,
                    "list": []
                },
                "plugin": {
                    "current": -1,
                    "list": []
                },
                "gamePlugin": {
                    "current": -1,
                    "list": []
                },
                "miniprogram": {
                    "current": -1,
                    "list": []
                }
            }
        }, null, 2);
    }
    async optimize() {
        console.log('⚡ 优化构建产物...');
        if (this.platform === 'h5') {
            // 运行 webpack 打包
            try {
                execSync('npx webpack --config webpack.config.js', {
                    stdio: 'inherit',
                    cwd: this.outputDir
                });
            }
            catch (error) {
                console.warn('webpack 打包失败，使用原始文件');
            }
        }
        // 压缩 JSON 文件
        const dataDir = `${this.outputDir}/data`;
        try {
            const files = await fs.readdir(dataDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = `${dataDir}/${file}`;
                    const content = await fs.readFile(filePath, 'utf8');
                    const compressed = JSON.stringify(JSON.parse(content));
                    await fs.writeFile(filePath, compressed);
                }
            }
        }
        catch (error) {
            console.warn('JSON 压缩失败');
        }
    }
}
// 运行构建
const builder = new CLIBuilder();
builder.build().catch(console.error);
//# sourceMappingURL=build.js.map