import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RootState, SceneData } from '../../../core/types';
import { createScene, deleteScene, switchScene, renameScene, saveCurrentScene } from '../../../core/actions';
import { SceneStorage } from '../../../core/utils/sceneStorage';

export default function SceneManagerPanel() {
  const dispatch = useDispatch();
  const { scenes, currentSceneId } = useSelector((state: RootState) => ({
    scenes: state.editor.scenes || {},
    currentSceneId: state.editor.currentSceneId
  }));

  const sceneList = Object.values(scenes);

  // 切换场景
  const handleSwitchScene = (sceneId: string) => {
    if (sceneId === currentSceneId) return;
    dispatch(switchScene(sceneId));
  };

  // 创建场景的简化方法
  const handleCreateScene = () => {
    const name = prompt('场景名称:');
    if (name?.trim()) {
      const id = `scene_${Date.now()}`;
      dispatch(createScene(id, name.trim()));
    }
  };

  return (
    <View style={styles.compactContainer}>
      <Text style={styles.compactLabel}>场景</Text>
      <View style={styles.compactControls}>
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
});
