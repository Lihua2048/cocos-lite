/**
 * 第二期功能使用示例
 * 展示如何使用新的核心功能：渲染引擎、生命周期管理、构建系统、可视化编辑
 */

import {
  phase2CoreManager,
  defaultPhase2Config,
  ProjectPhase2Config
} from '../core/phase2/Phase2CoreManager';
import { RenderMode, CompositionMode } from '../core/rendering/RenderingEngine';
import { SceneConfig } from '../core/lifecycle/SceneLifecycleManager';
import { BuildPlatform, BuildMode } from '../core/build/ProjectBuildSystem';

export class Phase2Demo {

  /**
   * 初始化演示项目
   */
  static async initializeDemo(): Promise<void> {
    console.log('🚀 Starting Phase 2 Demo...');

    try {
      // 1. 初始化第二期核心功能
      await phase2CoreManager.initialize(defaultPhase2Config);
      console.log('✅ Phase 2 Core Manager initialized');

      // 2. 创建示例场景
      await this.createDemoScenes();
      console.log('✅ Demo scenes created');

      // 3. 演示渲染功能
      await this.demonstrateRendering();
      console.log('✅ Rendering demonstration completed');

      // 4. 演示构建功能
      await this.demonstrateBuilding();
      console.log('✅ Building demonstration completed');

      // 5. 展示统计信息
      this.showProjectStats();
      console.log('✅ Project stats displayed');

      console.log('🎉 Phase 2 Demo completed successfully!');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * 创建演示场景
   */
  private static async createDemoScenes(): Promise<void> {
    // 主菜单场景
    const mainMenuConfig: SceneConfig = {
      id: 'main-menu',
      name: '主菜单',
      description: '游戏主菜单场景',
      renderMode: 'webgl',
      compositionModes: ['layered'],
      priority: 1,
      preloadAssets: ['menu-bg.png', 'menu-music.mp3'],
      dependencies: [],
      persistent: true,
      autoStart: true,
      hooks: {
        onPreload: async () => {
          console.log('🔄 Preloading main menu assets...');
        },
        onLoad: async () => {
          console.log('📦 Main menu loaded');
        },
        onStart: () => {
          console.log('▶️ Main menu started');
        },
        onUpdate: (deltaTime: number) => {
          // 更新逻辑
        }
      }
    };

    await phase2CoreManager.createScene(mainMenuConfig);
    await phase2CoreManager.loadScene('main-menu');
    await phase2CoreManager.activateScene('main-menu');

    // 游戏场景
    const gameSceneConfig: SceneConfig = {
      id: 'game-level-1',
      name: '游戏关卡1',
      description: '第一个游戏关卡',
      renderMode: 'webgl',
      compositionModes: ['layered', 'parallel'],
      priority: 2,
      preloadAssets: ['level1-bg.png', 'player.png', 'enemies.png'],
      dependencies: ['main-menu'],
      persistent: false,
      autoStart: false,
      hooks: {
        onPreload: async () => {
          console.log('🔄 Preloading game level assets...');
        },
        onLoad: async () => {
          console.log('📦 Game level loaded');
        },
        onStart: () => {
          console.log('🎮 Game level started');
        },
        onUpdate: (deltaTime: number) => {
          // 游戏逻辑更新
        }
      }
    };

    await phase2CoreManager.createScene(gameSceneConfig);
    await phase2CoreManager.loadScene('game-level-1');

    // UI覆盖层场景
    const uiOverlayConfig: SceneConfig = {
      id: 'ui-overlay',
      name: 'UI覆盖层',
      description: '全局UI覆盖层',
      renderMode: 'webgl',
      compositionModes: ['layered'],
      priority: 10,
      preloadAssets: ['ui-atlas.png'],
      dependencies: [],
      persistent: true,
      autoStart: true,
      hooks: {
        onLoad: async () => {
          console.log('📱 UI overlay loaded');
        }
      }
    };

    await phase2CoreManager.createScene(uiOverlayConfig);
    await phase2CoreManager.loadScene('ui-overlay');
    await phase2CoreManager.activateScene('ui-overlay');
  }

  /**
   * 演示渲染功能
   */
  private static async demonstrateRendering(): Promise<void> {
    console.log('🎨 Demonstrating rendering features...');

    // 模拟渲染循环
    let frameCount = 0;
    const renderDemo = () => {
      if (frameCount < 60) { // 渲染60帧作为演示
        phase2CoreManager.renderScenes();
        frameCount++;

        if (frameCount % 20 === 0) {
          console.log(`🖼️ Rendered ${frameCount} frames`);
        }

        setTimeout(renderDemo, 16); // 约60fps
      } else {
        console.log('🎬 Rendering demonstration completed');
      }
    };

    renderDemo();
  }

  /**
   * 演示构建功能
   */
  private static async demonstrateBuilding(): Promise<void> {
    console.log('🔨 Demonstrating build system...');

    // 构建Web版本
    try {
      console.log('📦 Building for Web (Debug)...');
      await phase2CoreManager.buildProject(BuildPlatform.WEB, BuildMode.DEBUG);

      console.log('📦 Building for Web (Release)...');
      await phase2CoreManager.buildProject(BuildPlatform.WEB, BuildMode.RELEASE);

      console.log('📱 Building for Android (Release)...');
      await phase2CoreManager.buildProject(BuildPlatform.ANDROID, BuildMode.RELEASE);

    } catch (error) {
      console.warn('⚠️ Some builds may have failed (this is expected in demo mode)');
    }
  }

  /**
   * 显示项目统计信息
   */
  private static showProjectStats(): void {
    const stats = phase2CoreManager.getProjectStats();

    console.log('📊 Project Statistics:');
    console.log('=====================================');
    console.log(`Scenes: ${stats.scenes.active}/${stats.scenes.total} active`);
    console.log(`Rendering: ${stats.rendering.frameRate}fps, ${stats.rendering.activeContexts} contexts`);
    console.log(`Build: ${stats.build.buildHistory} builds, ${Math.round(stats.build.totalSize / 1024)}KB total`);
    console.log(`Composition: ${stats.composition.nodes} nodes, ${stats.composition.connections} connections`);
    console.log('=====================================');

    // 显示支持的功能
    const features = phase2CoreManager.getSupportedFeatures();
    console.log('🔧 Supported Features:');

    Object.entries(features).forEach(([category, featureList]) => {
      console.log(`\n${category.toUpperCase()}:`);
      featureList.forEach(feature => console.log(`  • ${feature}`));
    });
  }

  /**
   * 演示场景切换
   */
  static async demonstrateSceneSwitching(): Promise<void> {
    console.log('🔄 Demonstrating scene switching...');

    // 切换到游戏场景
    await phase2CoreManager.activateScene('game-level-1');
    console.log('✅ Switched to game level');

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 切换回主菜单
    await phase2CoreManager.activateScene('main-menu');
    console.log('✅ Switched back to main menu');
  }

  /**
   * 演示组合模式
   */
  static demonstrateCompositionModes(): void {
    console.log('🎭 Demonstrating composition modes...');

    const project = phase2CoreManager.getCompositionProject('default');
    if (project) {
      console.log(`Composition project has ${project.nodes.size} nodes`);

      // 显示所有节点
      project.nodes.forEach((node, id) => {
        console.log(`  Node: ${node.name} (${node.type}) at (${node.x}, ${node.y})`);
        console.log(`    Render mode: ${node.metadata.renderMode}`);
        console.log(`    Composition modes: ${node.metadata.compositionModes.join(', ')}`);
      });
    }
  }

  /**
   * 清理演示
   */
  static async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up demo...');
    await phase2CoreManager.destroy();
    console.log('✅ Demo cleanup completed');
  }
}

// 自动运行演示（可选）
export const runDemo = async () => {
  await Phase2Demo.initializeDemo();

  // 演示场景切换
  setTimeout(async () => {
    await Phase2Demo.demonstrateSceneSwitching();
  }, 3000);

  // 演示组合模式
  setTimeout(() => {
    Phase2Demo.demonstrateCompositionModes();
  }, 6000);

  // 清理（可选，通常在应用关闭时调用）
  // setTimeout(async () => {
  //   await Phase2Demo.cleanup();
  // }, 10000);
};

// 导出用于手动调用
export default Phase2Demo;
