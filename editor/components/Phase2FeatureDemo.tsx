import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { phase2CoreManager, type ProjectStats } from '../../core/phase2/Phase2CoreManager';

interface FeatureDemoProps {
  onClose: () => void;
}

export default function Phase2FeatureDemo({ onClose }: FeatureDemoProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [renderingMode, setRenderingMode] = useState<'webgl' | 'canvas2d'>('webgl');
  const [compositionMode, setCompositionMode] = useState<'layered' | 'sequential' | 'parallel' | 'masking'>('layered');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);

  useEffect(() => {
    // 订阅统计更新
    phase2CoreManager.onStatsUpdate(setStats);

    return () => {
      phase2CoreManager.offStatsUpdate(setStats);
    };
  }, []);

  // 演示渲染引擎切换
  const handleRenderingModeChange = async (mode: 'webgl' | 'canvas2d') => {
    try {
      console.log(`🎨 Switching rendering mode to: ${mode}`);
      setRenderingMode(mode);

      // 这里可以添加实际的渲染模式切换逻辑
      // await phase2CoreManager.renderingEngine.switchMode(mode);

    } catch (error) {
      console.error('Failed to switch rendering mode:', error);
    }
  };

  // 演示场景组合模式切换
  const handleCompositionModeChange = async (mode: 'layered' | 'sequential' | 'parallel' | 'masking') => {
    try {
      console.log(`🎭 Switching composition mode to: ${mode}`);
      setCompositionMode(mode);

      // 这里可以添加实际的组合模式切换逻辑
      // await phase2CoreManager.renderingEngine.setCompositionMode(mode);

    } catch (error) {
      console.error('Failed to switch composition mode:', error);
    }
  };

  // 演示构建系统
  const handleBuildDemo = async () => {
    try {
      setIsBuilding(true);
      setBuildProgress(0);

      console.log('🔨 Starting build demo...');

      // 模拟构建进度
      const buildSteps = [
        '📋 Validating project configuration...',
        '🧹 Cleaning previous build...',
        '📦 Bundling assets...',
        '🎨 Processing scenes...',
        '⚡ Optimizing performance...',
        '🏗️ Generating platform builds...',
        '✅ Finalizing build...',
        '📊 Generating reports...'
      ];

      for (let i = 0; i < buildSteps.length; i++) {
        console.log(buildSteps[i]);
        setBuildProgress(((i + 1) / buildSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('🎉 Build completed successfully!');

    } catch (error) {
      console.error('Build demo failed:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  // 演示场景生命周期
  const handleLifecycleDemo = async () => {
    try {
      console.log('🔄 Demonstrating scene lifecycle...');

      const demoSceneId = 'demo-scene-' + Date.now();
      const lifecycleStates = ['created', 'loading', 'loaded', 'active', 'paused', 'destroyed'];

      for (const state of lifecycleStates) {
        console.log(`📍 Scene ${demoSceneId} -> ${state}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log('✨ Lifecycle demo completed!');

    } catch (error) {
      console.error('Lifecycle demo failed:', error);
    }
  };

  const supportedFeatures = phase2CoreManager.getSupportedFeatures();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 第二期核心功能演示</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 项目统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 项目统计</Text>
          {stats ? (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>场景数量</Text>
                <Text style={styles.statValue}>{stats.scenes.total}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>活跃场景</Text>
                <Text style={styles.statValue}>{stats.scenes.active}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>渲染调用</Text>
                <Text style={styles.statValue}>{stats.rendering.renderCalls}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>帧率</Text>
                <Text style={styles.statValue}>{stats.rendering.frameRate}FPS</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>组合节点</Text>
                <Text style={styles.statValue}>{stats.composition.nodes}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>构建历史</Text>
                <Text style={styles.statValue}>{stats.build.buildHistory}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>正在加载统计数据...</Text>
          )}
        </View>

        {/* 支持的功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 支持的功能</Text>
          <View style={styles.featureGrid}>
            {Object.entries(supportedFeatures).map(([category, features]) => (
              <View key={category} style={styles.featureCategory}>
                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                {features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureText}>✅ {feature}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* 渲染引擎控制 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 渲染引擎</Text>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>渲染模式:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.modeButton, renderingMode === 'webgl' && styles.activeModeButton]}
                onPress={() => handleRenderingModeChange('webgl')}
              >
                <Text style={[styles.modeButtonText, renderingMode === 'webgl' && styles.activeModeButtonText]}>
                  WebGL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, renderingMode === 'canvas2d' && styles.activeModeButton]}
                onPress={() => handleRenderingModeChange('canvas2d')}
              >
                <Text style={[styles.modeButtonText, renderingMode === 'canvas2d' && styles.activeModeButtonText]}>
                  Canvas2D
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>组合模式:</Text>
            <View style={styles.buttonGroup}>
              {(['layered', 'sequential', 'parallel', 'masking'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeButton, compositionMode === mode && styles.activeModeButton]}
                  onPress={() => handleCompositionModeChange(mode)}
                >
                  <Text style={[styles.modeButtonText, compositionMode === mode && styles.activeModeButtonText]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 构建系统 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔨 项目构建系统</Text>
          <TouchableOpacity
            style={[styles.actionButton, isBuilding && styles.disabledButton]}
            onPress={handleBuildDemo}
            disabled={isBuilding}
          >
            <Text style={styles.actionButtonText}>
              {isBuilding ? `构建中... ${buildProgress.toFixed(0)}%` : '开始构建演示'}
            </Text>
          </TouchableOpacity>
          {isBuilding && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${buildProgress}%` }]} />
            </View>
          )}
        </View>

        {/* 场景生命周期 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 场景生命周期管理</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLifecycleDemo}
          >
            <Text style={styles.actionButtonText}>演示场景生命周期</Text>
          </TouchableOpacity>
        </View>

        {/* 可视化编辑器 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎭 可视化场景编辑器</Text>
          <Text style={styles.featureDescription}>
            包含拖拽式节点编辑、属性面板、节点树视图等功能
          </Text>
          <View style={styles.editorFeatures}>
            <Text style={styles.featureText}>• 🎯 拖拽式节点放置</Text>
            <Text style={styles.featureText}>• 🎨 实时属性编辑</Text>
            <Text style={styles.featureText}>• 🌳 层级结构管理</Text>
            <Text style={styles.featureText}>• 🔍 节点选择与变换</Text>
            <Text style={styles.featureText}>• 🔗 节点连接与组合</Text>
            <Text style={styles.featureText}>• 📐 网格对齐与布局</Text>
          </View>
        </View>

        {/* 跨平台存储 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 跨平台存储</Text>
          <Text style={styles.featureDescription}>
            统一的存储接口，自动适配 React Native 和 Web 环境
          </Text>
          <View style={styles.editorFeatures}>
            <Text style={styles.featureText}>• 📱 React Native AsyncStorage 支持</Text>
            <Text style={styles.featureText}>• 🌐 Web localStorage 支持</Text>
            <Text style={styles.featureText}>• 🔄 异步场景加载</Text>
            <Text style={styles.featureText}>• 🛡️ 错误处理与恢复</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d2d30',
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e42',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#252526',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e3e42',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007acc',
  },
  noDataText: {
    color: '#cccccc',
    fontStyle: 'italic',
  },
  featureGrid: {
    gap: 8,
  },
  featureCategory: {
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#007acc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureText: {
    color: '#cccccc',
    fontSize: 14,
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3e3e42',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5a5a5a',
  },
  activeModeButton: {
    backgroundColor: '#007acc',
    borderColor: '#007acc',
  },
  modeButtonText: {
    color: '#cccccc',
    fontSize: 12,
  },
  activeModeButtonText: {
    color: '#ffffff',
  },
  actionButton: {
    padding: 12,
    backgroundColor: '#007acc',
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#5a5a5a',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3e3e42',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007acc',
  },
  featureDescription: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  editorFeatures: {
    gap: 6,
  },
});
