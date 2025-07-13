import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RootState, SceneData, SceneCompositionMode } from '../../../core/types';
import {
  createScene,
  deleteScene,
  switchScene,
  renameScene,
  saveCurrentScene,
  setSelectedScenes,
  toggleSceneLock,
  addEntity
} from '../../../core/actions';
import { SceneStorage } from '../../../core/utils/sceneStorage';

export default function SceneManagerPanel() {
  const dispatch = useDispatch();
  const { scenes, currentSceneId, sceneComposition } = useSelector((state: RootState) => ({
    scenes: state.editor.scenes || {},
    currentSceneId: state.editor.currentSceneId,
    sceneComposition: state.editor.sceneComposition
  }));

  const sceneList = Object.values(scenes);
  const { mode, selectedScenes, lockedScenes } = sceneComposition;


  // 切换场景 - 根据组合模式处理
  const handleSwitchScene = (sceneId: string) => {
    if (mode === SceneCompositionMode.DEFAULT) {
      // 默认模式：单场景切换
      if (sceneId === currentSceneId) return;
      console.log('SceneManagerPanel: Switching to scene', sceneId);
      // 在切换前保存当前场景
      dispatch(saveCurrentScene());
      dispatch(switchScene(sceneId));
    } else if (mode === SceneCompositionMode.MIXED) {
      // 混合模式：也支持场景切换
      if (sceneId === currentSceneId) return;
      console.log('SceneManagerPanel: Switching to scene in mixed mode', sceneId);
      // 在切换前保存当前场景
      dispatch(saveCurrentScene());
      dispatch(switchScene(sceneId));
    }
  };

  // 叠加模式：多选场景处理
  const handleSceneMultiSelect = (sceneId: string) => {
    if (mode === SceneCompositionMode.OVERLAY) {
      const newSelectedScenes = selectedScenes.includes(sceneId)
        ? selectedScenes.filter(id => id !== sceneId)
        : [...selectedScenes, sceneId];

      console.log('SceneManagerPanel: Multi-select scene', sceneId, 'new selection:', newSelectedScenes);
      dispatch(setSelectedScenes(newSelectedScenes));
    }
  };

  // 混合模式：切换锁定状态
  const handleToggleLock = (sceneId: string) => {
    dispatch(toggleSceneLock(sceneId));
  };

  // 创建场景的简化方法
  const handleCreateScene = () => {
    const name = prompt('场景名称:');
    if (name?.trim()) {
      const id = `scene_${Date.now()}`;
      console.log('SceneManagerPanel: Creating new scene', id, name);
      dispatch(createScene(id, name.trim()));

      // 为新场景创建一个示例实体，便于测试场景组合
      setTimeout(() => {
        // @ts-ignore
        const { createDefaultEntity } = require("../../../core/types");
        const entity = createDefaultEntity(`test-entity-${Date.now()}`, 'ui-button');
        entity.position = { x: 50, y: 50 };
        entity.properties = {
          ...entity.properties,
          text: `${name}场景实体`,
          color: [Math.random(), Math.random(), Math.random(), 1] as [number, number, number, number]
        };
        console.log('SceneManagerPanel: Creating test entity for new scene', entity.id);
        dispatch(addEntity(entity));
      }, 100);
    }
  };

  // 渲染场景选择器 - 根据模式不同显示不同UI
  const renderSceneSelector = () => {
    if (mode === SceneCompositionMode.DEFAULT) {
      // 默认模式：单选下拉框
      return (
        <Picker
          selectedValue={currentSceneId || ''}
          onValueChange={handleSwitchScene}
          style={styles.compactPicker}
        >
          <Picker.Item label="选择场景..." value="" />
          {sceneList.map(scene => (
            <Picker.Item
              key={scene.id}
              label={scene.name}
              value={scene.id}
            />
          ))}
        </Picker>
      );
    } else if (mode === SceneCompositionMode.OVERLAY) {
      // 叠加模式：多选列表
      return (
        <View style={styles.multiSelectContainer}>
          {sceneList.map(scene => (
            <TouchableOpacity
              key={scene.id}
              style={[
                styles.sceneOption,
                selectedScenes.includes(scene.id) && styles.sceneOptionSelected
              ]}
              onPress={() => handleSceneMultiSelect(scene.id)}
            >
              <Text style={[
                styles.sceneOptionText,
                selectedScenes.includes(scene.id) && styles.sceneOptionTextSelected
              ]}>
                {scene.name}
              </Text>
              {selectedScenes.includes(scene.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (mode === SceneCompositionMode.MIXED) {
      // 混合模式：带锁定状态的列表
      return (
        <View style={styles.mixedModeContainer}>
          <Picker
            selectedValue={currentSceneId || ''}
            onValueChange={handleSwitchScene}
            style={styles.compactPicker}
          >
            <Picker.Item label="选择场景..." value="" />
            {sceneList.map(scene => (
              <Picker.Item
                key={scene.id}
                label={`${scene.name} ${lockedScenes[scene.id] ? '🔒' : '🔓'}`}
                value={scene.id}
              />
            ))}
          </Picker>
          <View style={styles.lockControls}>
            {sceneList.map(scene => (
              <TouchableOpacity
                key={scene.id}
                style={styles.lockButton}
                onPress={() => handleToggleLock(scene.id)}
              >
                <Text style={styles.lockIcon}>
                  {lockedScenes[scene.id] ? '🔒' : '🔓'}
                </Text>
                <Text style={styles.lockLabel}>{scene.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.compactContainer}>
      <Text style={styles.compactLabel}>场景</Text>
      <View style={styles.compactControls}>
        {renderSceneSelector()}
        <TouchableOpacity
          style={styles.compactAddButton}
          onPress={handleCreateScene}
        >
          <Text style={styles.compactAddText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  compactPicker: {
    minWidth: 120,
    height: 32,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  compactAddButton: {
    width: 32,
    height: 32,
    backgroundColor: '#28a745',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  compactAddText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 叠加模式多选样式
  multiSelectContainer: {
    maxWidth: 200,
    maxHeight: 120,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
  },
  sceneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  sceneOptionSelected: {
    backgroundColor: '#007bff',
  },
  sceneOptionText: {
    fontSize: 12,
    color: '#333',
  },
  sceneOptionTextSelected: {
    color: '#fff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // 混合模式样式
  mixedModeContainer: {
    flexDirection: 'column',
  },
  lockControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    maxWidth: 200,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    marginRight: 4,
    marginBottom: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 3,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  lockLabel: {
    fontSize: 10,
    color: '#666',
  },
});
