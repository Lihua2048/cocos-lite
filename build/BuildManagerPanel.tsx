import { GameBuilder } from './GameBuilder';
import { useSelector } from 'react-redux';
import { RootState } from '../core/types';
import ResourceManager from '../core/resources/ResourceManager';

/**
 * 构建管理面板组件
 */
export function BuildManagerPanel() {
  const scenes = useSelector((state: RootState) => Object.values(state.scenes));
  const resourceManager = new ResourceManager();

  const handleBuildH5 = async () => {
    try {
      console.log('开始构建 H5 游戏...');

      const builder = new GameBuilder(scenes, resourceManager, './game/h5');
      const result = await builder.buildH5Game();

      // 写入文件
      await writeGameFiles('h5', result);

      alert('H5 游戏构建成功！文件已生成到 /game/h5 目录');
    } catch (error) {
      console.error('H5 构建失败:', error);
      alert(`H5 构建失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleBuildWechat = async () => {
    try {
      console.log('开始构建微信小游戏...');

      const builder = new GameBuilder(scenes, resourceManager, './game/wechat');
      const result = await builder.buildWechatGame();

      // 写入文件
      await writeGameFiles('wechat', result);

      alert('微信小游戏构建成功！文件已生成到 /game/wechat 目录');
    } catch (error) {
      console.error('微信小游戏构建失败:', error);
      alert(`微信小游戏构建失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handlePreviewH5 = () => {
    // 打开 H5 预览
    const previewUrl = './game/h5/index.html';
    window.open(previewUrl, '_blank');
  };

  const handleOpenGameDir = () => {
    // 在文件管理器中打开游戏目录
    console.log('打开游戏目录: ./game/');
  };

  return `
    <div style="padding: 16px; border: 1px solid #ddd; margin: 8px; background: #f9f9f9;">
      <h3>游戏构建与发布</h3>

      <div style="margin-bottom: 16px;">
        <h4>构建目标平台</h4>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button onclick="handleBuildH5()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            构建 H5 游戏
          </button>
          <button onclick="handleBuildWechat()" style="padding: 8px 16px; background: #00C851; color: white; border: none; border-radius: 4px; cursor: pointer;">
            构建微信小游戏
          </button>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <h4>预览与测试</h4>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button onclick="handlePreviewH5()" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            预览 H5 游戏
          </button>
          <button onclick="handleOpenGameDir()" style="padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
            打开游戏目录
          </button>
        </div>
      </div>

      <div>
        <h4>构建信息</h4>
        <p>场景数量: ${scenes.length}</p>
        <p>输出目录: ./game/</p>
        <p>支持平台: H5、微信小游戏</p>
      </div>
    </div>
  `;
}

/**
 * 写入游戏文件到指定目录
 */
async function writeGameFiles(platform: 'h5' | 'wechat', buildResult: any): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');

  const outputDir = `./game/${platform}`;

  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(`${outputDir}/runtime`, { recursive: true });
  await fs.mkdir(`${outputDir}/data`, { recursive: true });
  await fs.mkdir(`${outputDir}/assets`, { recursive: true });

  // 写入主要文件
  await fs.writeFile(`${outputDir}/game.js`, buildResult.gameRuntime);
  await fs.writeFile(`${outputDir}/data/scenes.json`, buildResult.sceneDataFile);

  if (platform === 'h5') {
    await fs.writeFile(`${outputDir}/index.html`, buildResult.htmlTemplate);
    await fs.writeFile(`${outputDir}/build-config.json`, JSON.stringify(buildResult.buildConfig, null, 2));
  } else {
    await fs.writeFile(`${outputDir}/game.json`, buildResult.gameConfig);
    await fs.writeFile(`${outputDir}/adapter.js`, buildResult.adapter);
  }

  // 复制运行时文件
  const runtimeFiles = [
    '../build/runtime/RuntimeSceneManager.ts',
    '../build/runtime/GameLoop.ts',
    '../core/2d/webgl-renderer.ts',
    '../core/physics/PhysicsWorld.ts'
  ];

  for (const file of runtimeFiles) {
    const fileName = path.basename(file);
    const content = await fs.readFile(file, 'utf8');
    await fs.writeFile(`${outputDir}/runtime/${fileName}`, content);
  }

  console.log(`${platform} 游戏文件写入完成: ${outputDir}`);
}

export default BuildManagerPanel;
