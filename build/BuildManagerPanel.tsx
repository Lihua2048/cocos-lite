import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { GameBuilder } from './GameBuilder';
import { RootState } from '../core/types';
import ResourceManager from '../core/resources/ResourceManager';
import { phase2CoreManager } from '../core/phase2/Phase2CoreManager';
import { BuildPlatform, BuildMode } from '../core/build/ProjectBuildSystem';

/**
 * 构建管理面板组件
 */
export function BuildManagerPanel() {
  const scenesObject = useSelector((state: RootState) => state.editor.scenes);
  const scenes = useMemo(() => Object.values(scenesObject || {}), [scenesObject]);
  const currentProject = useSelector((state: RootState) => {
    const projectId = state.projects?.currentProjectId;
    return projectId ? state.projects?.projects[projectId] : null;
  });
  const resourceManager = new ResourceManager();
  const [isBuilding, setIsBuilding] = useState(false);
  const [autoBuildEnabled, setAutoBuildEnabled] = useState(false);
  const [lastBuildTime, setLastBuildTime] = useState<number>(0);

  // 自动构建功能
  useEffect(() => {
    if (!autoBuildEnabled) return;

    const checkForChanges = () => {
      const now = Date.now();
      // 检查是否有场景更新（简单的时间戳比较）
      if (scenes.length > 0 && now - lastBuildTime > 30000) { // 30秒后重新构建
        handleAutoBuild();
      }
    };

    const interval = setInterval(checkForChanges, 5000); // 每5秒检查一次
    return () => clearInterval(interval);
  }, [autoBuildEnabled, scenes, lastBuildTime]);

  const handleAutoBuild = async () => {
    if (isBuilding) return;

    try {
      setIsBuilding(true);
      // 使用 Phase2 构建系统进行自动构建
      await phase2CoreManager.buildProject(BuildPlatform.WEB, BuildMode.DEBUG);
      setLastBuildTime(Date.now());
    } catch (error) {
      console.error('自动构建失败:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleBuildH5 = async () => {
    if (isBuilding) return;

    try {
      setIsBuilding(true);
      console.log('开始构建 H5 游戏...');

      const builder = new GameBuilder(scenes, resourceManager, './game/h5');
      const result = await builder.buildH5Game();

      Alert.alert('成功', 'H5 游戏构建成功！');
    } catch (error) {
      console.error('H5 构建失败:', error);
      Alert.alert('错误', `H5 构建失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleBuildWechat = async () => {
    if (isBuilding) return;

    try {
      setIsBuilding(true);
      console.log('开始构建微信小游戏...');

      const builder = new GameBuilder(scenes, resourceManager, './game/wechat');
      const result = await builder.buildWechatGame();

      Alert.alert('成功', '微信小游戏构建成功！');
    } catch (error) {
      console.error('微信小游戏构建失败:', error);
      Alert.alert('错误', `微信小游戏构建失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handlePreviewH5 = () => {
    console.log('预览 H5 游戏');
  };

  return (
    <View style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <Text style={styles.title}>构建</Text>
        {currentProject && (
          <Text style={styles.projectInfo}>
            {currentProject.name} • {scenes.length} 场景
          </Text>
        )}
      </View>

      {/* 自动构建开关 */}
      <View style={styles.autoSection}>
        <Text style={styles.autoLabel}>自动构建</Text>
        <Switch
          value={autoBuildEnabled}
          onValueChange={setAutoBuildEnabled}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={autoBuildEnabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {/* 构建按钮 */}
      <View style={styles.buildSection}>
        <TouchableOpacity
          style={[styles.buildButton, styles.h5Button, isBuilding && styles.disabledButton]}
          onPress={handleBuildH5}
          disabled={isBuilding}
        >
          <Text style={styles.buildButtonText}>
            {isBuilding ? '构建中...' : 'H5'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buildButton, styles.wechatButton, isBuilding && styles.disabledButton]}
          onPress={handleBuildWechat}
          disabled={isBuilding}
        >
          <Text style={styles.buildButtonText}>
            {isBuilding ? '构建中...' : '微信'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buildButton, styles.previewButton]}
          onPress={handlePreviewH5}
        >
          <Text style={styles.buildButtonText}>预览</Text>
        </TouchableOpacity>
      </View>

      {/* 构建信息 */}
      {scenes.length === 0 && (
        <Text style={styles.emptyText}>
          暂无场景可构建
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    margin: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  // Header styles
  header: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  projectInfo: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  // Auto build section
  autoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 4,
  },
  autoLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },

  // Build section
  buildSection: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  buildButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  h5Button: {
    backgroundColor: '#4CAF50',
  },
  wechatButton: {
    backgroundColor: '#00C851',
  },
  previewButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buildButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty state
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});

export default BuildManagerPanel;
