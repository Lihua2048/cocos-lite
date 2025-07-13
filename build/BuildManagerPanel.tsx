import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { GameBuilder } from './GameBuilder';
import { RootState } from '../core/types';
import ResourceManager from '../core/resources/ResourceManager';
import { phase2CoreManager } from '../core/phase2/Phase2CoreManager';
import { BuildPlatform, BuildMode } from '../core/build/ProjectBuildSystem';
import { saveCurrentScene, addEntity } from '../core/actions';
import { store } from '../editor/store';

/**
 * 构建管理面板组件
 */
export function BuildManagerPanel() {
  const dispatch = useDispatch();
  const currentEntities = useSelector((state: RootState) => state.editor.entities);
  const currentSceneId = useSelector((state: RootState) => state.editor.currentSceneId);
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
  const [buildProgress, setBuildProgress] = useState('');
  const [buildPercent, setBuildPercent] = useState(0);

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
      setBuildProgress('正在保存当前场景...');
      setBuildPercent(5);

      // 在构建前保存当前场景状态
      dispatch(saveCurrentScene());

      // 等待保存完成 - 增加等待时间确保Redux状态更新
      await new Promise(resolve => setTimeout(resolve, 500));

      setBuildProgress('正在准备构建环境...');
      setBuildPercent(10);

      console.log('BuildManagerPanel: Building H5 with current entities:', Object.keys(currentEntities));
      console.log('BuildManagerPanel: Current scene ID:', currentSceneId);

      // 获取最新的scene数据（包含刚保存的当前场景）
      const state = store.getState();
      const updatedScenes = Object.values(state.editor.scenes || {});

      // 详细验证场景数据
      console.log('BuildManagerPanel: ========== 场景数据验证 ==========');
      updatedScenes.forEach((scene, index) => {
        console.log(`场景 ${index + 1}:`, {
          id: scene.id,
          name: scene.name,
          entityCount: Object.keys(scene.entities || {}).length,
          entityIds: Object.keys(scene.entities || {}),
          entities: scene.entities
        });

        // 验证每个实体的完整性
        Object.values(scene.entities || {}).forEach((entity: any) => {
          console.log(`  实体 ${entity.id}:`, {
            type: entity.type,
            position: entity.position,
            properties: entity.properties,
            hasRequiredFields: !!(entity.id && entity.type && entity.position && entity.properties)
          });
        });
      });
      console.log('BuildManagerPanel: =====================================');

      // 如果当前场景没有实体，创建一个测试实体
      const currentScene = updatedScenes.find(s => s.id === currentSceneId);
      if (!currentScene || Object.keys(currentScene.entities || {}).length === 0) {
        console.log('BuildManagerPanel: 当前场景没有实体，创建测试实体...');

        // @ts-ignore
        const { createDefaultEntity } = require("../core/types");
        const testEntity = createDefaultEntity(`build-test-${Date.now()}`, 'ui-button');
        testEntity.position = { x: 100, y: 100 };
        testEntity.properties = {
          ...testEntity.properties,
          text: '构建测试实体',
          color: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
          width: 150,
          height: 50
        };

        dispatch(addEntity(testEntity));

        // 再次保存并等待
        dispatch(saveCurrentScene());
        await new Promise(resolve => setTimeout(resolve, 300));

        // 重新获取数据
        const newState = store.getState();
        const finalScenes = Object.values(newState.editor.scenes || {});
        console.log('BuildManagerPanel: 添加测试实体后的场景数据:', finalScenes.map(s => ({
          id: s.id,
          entityCount: Object.keys(s.entities || {}).length
        })));
      }

      console.log('BuildManagerPanel: Building H5 with scenes:', updatedScenes.map(s => ({
        id: s.id,
        name: s.name,
        entityCount: Object.keys(s.entities).length,
        entities: Object.keys(s.entities)
      })));

      const builder = new GameBuilder(updatedScenes, resourceManager, './game/h5');

      setBuildProgress('正在编译场景...');
      setBuildPercent(30);

      const result = await builder.buildH5Game();

      setBuildProgress('正在优化资源...');
      setBuildPercent(70);

      // 模拟优化过程
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBuildProgress('构建完成，正在打开页面...');
      setBuildPercent(100);      // 创建游戏页面并在新窗口中打开
      const gameWindow = window.open('', '_blank', 'width=900,height=700');
      if (gameWindow) {
        console.log('BuildManagerPanel: 准备注入的场景数据:', result.sceneDataFile);

        // 解析并验证场景数据
        const sceneData = JSON.parse(result.sceneDataFile);
        console.log('BuildManagerPanel: 解析后的场景数据:', sceneData);
        console.log('BuildManagerPanel: 场景数量:', sceneData.scenes?.length);

        if (sceneData.scenes && sceneData.scenes.length > 0) {
          console.log('BuildManagerPanel: 第一个场景的实体:', sceneData.scenes[0].entities);
          console.log('BuildManagerPanel: 第一个场景实体数量:', Object.keys(sceneData.scenes[0].entities || {}).length);
        }

        // 创建包含数据和代码的HTML
        const htmlWithData = result.htmlTemplate.replace(
          '<!-- 游戏代码将在这里注入 -->',
          `
          <script>
            // 注入场景数据到全局变量
            window.sceneData = ${JSON.stringify(sceneData)};
            console.log('页面加载: 场景数据已注入到window.sceneData');
            console.log('页面加载: 场景数据内容:', window.sceneData);
            console.log('页面加载: 第一个场景实体:', window.sceneData.scenes?.[0]?.entities);
          </script>
          <script>
            // 游戏运行时代码
            ${result.gameRuntime}

            // 自动启动游戏
            window.addEventListener('load', async () => {
              console.log('页面加载完成，启动游戏');
              const game = new SimpleGame();
              await game.init();
              game.start();
            });
          </script>`
        );

        // 写入HTML
        gameWindow.document.write(htmlWithData);
        gameWindow.document.close();

      } else {
        Alert.alert('错误', '无法打开新窗口，请检查浏览器弹窗设置');
      }

      setTimeout(() => {
        setBuildProgress('');
        setBuildPercent(0);
      }, 800);

      Alert.alert('成功', 'H5 游戏构建成功！页面已打开');
    } catch (error) {
      setBuildProgress('');
      setBuildPercent(0);
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
      setBuildProgress('正在准备微信小游戏构建环境...');
      setBuildPercent(10);

      const builder = new GameBuilder(scenes, resourceManager, './game/wechat');

      setBuildProgress('正在编译场景...');
      setBuildPercent(30);

      const result = await builder.buildWechatGame();

      setBuildProgress('正在适配微信小游戏API...');
      setBuildPercent(70);

      // 模拟适配过程
      await new Promise(resolve => setTimeout(resolve, 1500));

      setBuildProgress('构建完成');
      setBuildPercent(100);

      setTimeout(() => {
        setBuildProgress('');
        setBuildPercent(0);
      }, 800);

      Alert.alert('成功', '微信小游戏构建成功！请使用微信开发者工具打开 ./game/wechat 目录');
    } catch (error) {
      setBuildProgress('');
      setBuildPercent(0);
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
    <View style={styles.compactContainer}>
      <Text style={styles.compactLabel}>构建</Text>
      <View style={styles.compactControls}>
        <TouchableOpacity
          style={[styles.compactBuildButton, styles.h5Button, isBuilding && styles.disabledButton]}
          onPress={handleBuildH5}
          disabled={isBuilding}
        >
          <Text style={styles.compactBuildButtonText}>
            {isBuilding && buildProgress.includes('H5') ? 'H5...' : 'H5'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.compactBuildButton, styles.wechatButton, isBuilding && styles.disabledButton]}
          onPress={handleBuildWechat}
          disabled={isBuilding}
        >
          <Text style={styles.compactBuildButtonText}>
            {isBuilding && buildProgress.includes('微信') ? '微信...' : '微信'}
          </Text>
        </TouchableOpacity>
      </View>
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

  // 紧凑样式 - 参考UnifiedToolbar
  compactContainer: {
    marginRight: 20,
    position: 'relative',
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactBuildButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactBuildButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
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

  // Progress section
  progressSection: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  percentText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
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
