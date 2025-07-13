/**
 * 第二期核心功能集成测试
 * 验证所有第二期功能是否正常工作
 */

import { phase2CoreManager, defaultPhase2Config } from '../core/phase2/Phase2CoreManager';
import SceneAsyncLoader from '../core/utils/SceneAsyncLoader';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class Phase2IntegrationTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Phase 2 integration tests...');

    const tests = [
      this.testCrossPlatformStorage,
      this.testSceneAsyncLoader,
      this.testPhase2CoreManager,
      this.testRenderingEngine,
      this.testSceneLifecycle,
      this.testBuildSystem,
      this.testCompositionEditor
    ];

    for (const test of tests) {
      await this.runTest(test.bind(this));
    }

    this.printResults();
    return this.results;
  }

  private async runTest(testFn: () => Promise<void>): Promise<void> {
    const testName = testFn.name.replace('test', '');
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        name: testName,
        passed: true,
        duration
      });
      console.log(`✅ ${testName} passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      console.error(`❌ ${testName} failed: ${error}`);
    }
  }

  private async testCrossPlatformStorage(): Promise<void> {
    console.log('🧪 Testing cross-platform storage...');

    // 动态导入以避免模块加载问题
    const { CrossPlatformStorage } = await import('../core/utils/CrossPlatformStorage');

    const testKey = 'test-key-' + Date.now();
    const testValue = { test: 'data', timestamp: Date.now() };

    // 测试存储
    await CrossPlatformStorage.setItem(testKey, JSON.stringify(testValue));

    // 测试读取
    const retrieved = await CrossPlatformStorage.getItem(testKey);
    if (!retrieved) {
      throw new Error('Failed to retrieve stored data');
    }

    const parsedValue = JSON.parse(retrieved);
    if (parsedValue.test !== testValue.test) {
      throw new Error('Retrieved data does not match stored data');
    }

    // 测试删除
    await CrossPlatformStorage.removeItem(testKey);
    const afterRemoval = await CrossPlatformStorage.getItem(testKey);
    if (afterRemoval !== null) {
      throw new Error('Failed to remove stored data');
    }
  }

  private async testSceneAsyncLoader(): Promise<void> {
    console.log('🧪 Testing scene async loader...');

    // 测试场景加载
    const loadResult = await SceneAsyncLoader.loadScenesAsync();
    if (typeof loadResult !== 'boolean') {
      throw new Error('Scene loader should return boolean');
    }

    // 测试场景保存
    const testScenes = [
      {
        id: 'test-scene-1',
        name: 'Test Scene 1',
        entities: [],
        resources: []
      }
    ];

    await SceneAsyncLoader.saveScenesAsync(testScenes);

    // 验证保存成功
    const reloaded = await SceneAsyncLoader.loadScenesAsync();
    if (!reloaded) {
      throw new Error('Failed to reload saved scenes');
    }
  }

  private async testPhase2CoreManager(): Promise<void> {
    console.log('🧪 Testing Phase 2 core manager...');

    // 测试初始化
    if (!phase2CoreManager.isInitialized()) {
      await phase2CoreManager.initialize(defaultPhase2Config);
    }

    if (!phase2CoreManager.isInitialized()) {
      throw new Error('Phase 2 core manager failed to initialize');
    }

    // 测试功能获取
    const features = phase2CoreManager.getSupportedFeatures();
    if (!features || typeof features !== 'object') {
      throw new Error('Failed to get supported features');
    }

    // 测试统计更新
    let statsReceived = false;
    const unsubscribe = phase2CoreManager.onStatsUpdate(() => {
      statsReceived = true;
    });

    // 触发统计更新
    await phase2CoreManager.updateStats();

    // 等待统计更新
    await new Promise(resolve => setTimeout(resolve, 100));

    unsubscribe();

    if (!statsReceived) {
      throw new Error('Stats update callback was not triggered');
    }
  }

  private async testRenderingEngine(): Promise<void> {
    console.log('🧪 Testing rendering engine...');

    // 这里可以添加渲染引擎的测试
    // 由于我们在测试环境中，只做基本的API测试

    // 测试渲染引擎是否可访问
    const engine = phase2CoreManager.getRenderingEngine();
    if (!engine) {
      throw new Error('Rendering engine is not accessible');
    }

    // 测试基本配置
    const config = phase2CoreManager.getConfig();
    if (!config || !config.renderingSettings) {
      throw new Error('Rendering settings not found in config');
    }
  }

  private async testSceneLifecycle(): Promise<void> {
    console.log('🧪 Testing scene lifecycle...');

    // 测试生命周期管理器是否可访问
    const manager = phase2CoreManager.getLifecycleManager();
    if (!manager) {
      throw new Error('Scene lifecycle manager is not accessible');
    }

    // 测试场景状态跟踪
    const testSceneId = 'test-scene-lifecycle';

    // 这里可以添加更详细的生命周期测试
    // 由于在测试环境中，我们只验证API可用性
  }

  private async testBuildSystem(): Promise<void> {
    console.log('🧪 Testing build system...');

    // 测试构建系统是否可访问
    const buildSystem = phase2CoreManager.getBuildSystem();
    if (!buildSystem) {
      throw new Error('Build system is not accessible');
    }

    // 测试构建配置
    const config = phase2CoreManager.getConfig();
    if (!config || !config.buildSettings) {
      throw new Error('Build settings not found in config');
    }
  }

  private async testCompositionEditor(): Promise<void> {
    console.log('🧪 Testing composition editor...');

    // 测试组合编辑器配置
    const config = phase2CoreManager.getConfig();
    if (!config || !config.compositionSettings) {
      throw new Error('Composition settings not found in config');
    }

    // 验证基本的组合功能可用性
    if (!config.compositionSettings.enableVisualEditor) {
      console.warn('Visual editor is disabled in config');
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(`📈 Success rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n🎯 Phase 2 integration test completed!');
  }
}

export default Phase2IntegrationTest;
