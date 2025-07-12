#!/usr/bin/env node
"use strict";
const express = require('express');
const path = require('path');
const fs = require('fs');
/**
 * 开发预览服务器
 */
class PreviewServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.platform = process.argv.includes('--platform=wechat') ? 'wechat' : 'h5';
    }
    start() {
        // 静态文件服务
        const gameDir = path.resolve(__dirname, `../game/${this.platform}`);
        this.app.use(express.static(gameDir));
        // 添加 CORS 头
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        // API 接口
        this.setupAPI();
        // 启动服务器
        this.app.listen(this.port, () => {
            console.log(`🚀 预览服务器已启动`);
            console.log(`📱 平台: ${this.platform}`);
            console.log(`🌐 地址: http://localhost:${this.port}`);
            if (this.platform === 'h5') {
                console.log(`🎮 游戏入口: http://localhost:${this.port}/index.html`);
            }
        });
    }
    setupAPI() {
        // 获取场景数据
        this.app.get('/api/scenes', (req, res) => {
            const dataPath = path.resolve(__dirname, `../game/${this.platform}/data/scenes.json`);
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                res.json(JSON.parse(data));
            }
            else {
                res.status(404).json({ error: 'Scenes data not found' });
            }
        });
        // 获取构建信息
        this.app.get('/api/build-info', (req, res) => {
            const gameDir = path.resolve(__dirname, `../game/${this.platform}`);
            const stats = fs.statSync(gameDir);
            res.json({
                platform: this.platform,
                buildTime: stats.mtime,
                directory: gameDir
            });
        });
        // 热重载支持
        if (process.env.NODE_ENV === 'development') {
            this.setupHotReload();
        }
    }
    setupHotReload() {
        const chokidar = require('chokidar');
        const gameDir = path.resolve(__dirname, `../game/${this.platform}`);
        console.log('🔥 热重载已启用');
        chokidar.watch(gameDir).on('change', (filePath) => {
            console.log(`📝 文件变更: ${path.relative(gameDir, filePath)}`);
            // 这里可以添加 WebSocket 通知浏览器刷新
        });
    }
}
// 启动预览服务器
const server = new PreviewServer();
server.start();
//# sourceMappingURL=preview.js.map