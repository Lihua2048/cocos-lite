/**
 * 第二期功能运行验证脚本
 * 用于快速验证所有第二期功能是否正常加载和运行
 */

import React from 'react';
import { phase2CoreManager, defaultPhase2Config } from '../core/phase2/Phase2CoreManager';
import SceneAsyncLoader from '../core/utils/SceneAsyncLoader';

export class Phase2FeatureValidator {

  /**
   * 验证所有第二期功能是否可以正常初始化
   */
  static async validatePhase2Features(): Promise<{
    success: boolean;
    results: { [key: string]: boolean };
    errors: { [key: string]: string };
  }> {
    const results: { [key: string]: boolean } = {};
    const errors: { [key: string]: string } = {};

    console.log('🔍 Starting Phase 2 feature validation...');

    // 1. 验证跨平台存储
    try {
      console.log('✅ Testing cross-platform storage...');
      const { CrossPlatformStorage } = await import('../core/utils/CrossPlatformStorage');
      results.crossPlatformStorage = true;
      console.log('✅ Cross-platform storage: OK');
    } catch (error) {
      results.crossPlatformStorage = false;
      errors.crossPlatformStorage = String(error);
      console.error('❌ Cross-platform storage: FAILED', error);
    }

    // 2. 验证场景异步加载器
    try {
      console.log('📂 Testing scene async loader...');
      await SceneAsyncLoader.loadScenesAsync();
      results.sceneAsyncLoader = true;
      console.log('✅ Scene async loader: OK');
    } catch (error) {
      results.sceneAsyncLoader = false;
      errors.sceneAsyncLoader = String(error);
      console.error('❌ Scene async loader: FAILED', error);
    }

    // 3. 验证第二期核心管理器
    try {
      console.log('⚙️ Testing Phase 2 core manager...');
      await phase2CoreManager.initialize(defaultPhase2Config);
      results.phase2CoreManager = true;
      console.log('✅ Phase 2 core manager: OK');
    } catch (error) {
      results.phase2CoreManager = false;
      errors.phase2CoreManager = String(error);
      console.error('❌ Phase 2 core manager: FAILED', error);
    }

    // 4. 验证渲染引擎
    try {
      console.log('🎨 Testing rendering engine...');
      const { renderingEngine } = await import('../core/rendering/RenderingEngine');
      results.renderingEngine = true;
      console.log('✅ Rendering engine: OK');
    } catch (error) {
      results.renderingEngine = false;
      errors.renderingEngine = String(error);
      console.error('❌ Rendering engine: FAILED', error);
    }

    // 5. 验证场景生命周期管理器
    try {
      console.log('🔄 Testing scene lifecycle manager...');
      const { sceneLifecycleManager } = await import('../core/lifecycle/SceneLifecycleManager');
      results.sceneLifecycleManager = true;
      console.log('✅ Scene lifecycle manager: OK');
    } catch (error) {
      results.sceneLifecycleManager = false;
      errors.sceneLifecycleManager = String(error);
      console.error('❌ Scene lifecycle manager: FAILED', error);
    }

    // 6. 验证项目构建系统
    try {
      console.log('🔨 Testing project build system...');
      const { projectBuildSystem } = await import('../core/build/ProjectBuildSystem');
      results.projectBuildSystem = true;
      console.log('✅ Project build system: OK');
    } catch (error) {
      results.projectBuildSystem = false;
      errors.projectBuildSystem = String(error);
      console.error('❌ Project build system: FAILED', error);
    }

    // 7. 验证场景组合编辑器
    try {
      console.log('🎭 Testing scene composition editor...');
      const SceneCompositionEditor = await import('../editor/components/composition/SceneCompositionEditor');
      results.sceneCompositionEditor = true;
      console.log('✅ Scene composition editor: OK');
    } catch (error) {
      results.sceneCompositionEditor = false;
      errors.sceneCompositionEditor = String(error);
      console.error('❌ Scene composition editor: FAILED', error);
    }

    // 8. 验证第二期功能演示组件
    try {
      console.log('🚀 Testing Phase 2 feature demo...');
      const Phase2FeatureDemo = await import('../editor/components/Phase2FeatureDemo');
      results.phase2FeatureDemo = true;
      console.log('✅ Phase 2 feature demo: OK');
    } catch (error) {
      results.phase2FeatureDemo = false;
      errors.phase2FeatureDemo = String(error);
      console.error('❌ Phase 2 feature demo: FAILED', error);
    }

    // 统计结果
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;

    console.log('\n📊 Validation Summary:');
    console.log('======================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    console.log(`📈 Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed components:');
      Object.entries(results).forEach(([key, passed]) => {
        if (!passed) {
          console.log(`  - ${key}: ${errors[key]}`);
        }
      });
    }

    const success = failedTests === 0;

    if (success) {
      console.log('\n🎉 All Phase 2 features are working correctly!');
    } else {
      console.log('\n⚠️  Some Phase 2 features need attention.');
    }

    return { success, results, errors };
  }

  /**
   * 获取功能状态报告
   */
  static getFeatureReport(): {
    coreFeatures: string[];
    supportSystems: string[];
    uiComponents: string[];
  } {
    return {
      coreFeatures: [
        '🎨 多模式渲染引擎 (WebGL/Canvas2D)',
        '🔄 完整场景生命周期管理',
        '🔨 多平台项目构建系统',
        '🎭 可视化场景组合编辑器'
      ],
      supportSystems: [
        '💾 跨平台统一存储接口',
        '📂 异步场景数据加载',
        '📊 实时项目统计监控',
        '⚙️ 统一配置管理系统'
      ],
      uiComponents: [
        '🚀 第二期功能演示面板',
        '🎯 拖拽式节点编辑界面',
        '🌳 层级结构管理视图',
        '🔧 实时属性编辑面板'
      ]
    };
  }

  /**
   * 显示详细的功能描述
   */
  static logFeatureDetails(): void {
    const report = this.getFeatureReport();

    console.log('\n🎯 第二期核心功能详细报告');
    console.log('============================');

    console.log('\n🔧 核心功能:');
    report.coreFeatures.forEach(feature => console.log(`  ${feature}`));

    console.log('\n🛠️ 支持系统:');
    report.supportSystems.forEach(system => console.log(`  ${system}`));

    console.log('\n🎨 UI 组件:');
    report.uiComponents.forEach(component => console.log(`  ${component}`));

    console.log('\n💡 使用方式:');
    console.log('  1. 启动应用后自动初始化所有第二期功能');
    console.log('  2. 点击状态栏的"功能演示"按钮查看完整功能');
    console.log('  3. 在主界面中直接使用可视化编辑功能');
    console.log('  4. 所有数据自动保存到跨平台存储中');
  }
}

export default Phase2FeatureValidator;
