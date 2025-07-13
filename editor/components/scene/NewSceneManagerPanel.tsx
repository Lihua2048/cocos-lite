import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { RootState, SceneCompositionMode } from '../../../core/types';
import CustomPicker from '../common/CustomPicker';

export default function SceneManagerPanel() {
  const dispatch = useDispatch();
  const { scenes, currentSceneId, sceneComposition } = useSelector((state: RootState) => ({
    scenes: state.editor.scenes || {},
    currentSceneId: state.editor.currentSceneId,
    sceneComposition: state.editor.sceneComposition
  }));

  const sceneList = Object.values(scenes);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  // 切换场景
  const handleSwitchScene = (sceneId: string) => {
    if (sceneId === currentSceneId) return;
    console.log('SceneManagerPanel: Switching to scene', sceneId);
    // 在切换前保存当前场景
    dispatch({ type: 'SAVE_CURRENT_SCENE' });
    dispatch({ type: 'SWITCH_SCENE', payload: sceneId });
  };

  // 创建场景
  const handleCreateScene = () => {
    if (!newSceneName.trim()) {
      Alert.alert('错误', '请输入场景名称');
      return;
    }

    try {
      const id = `scene_${Date.now()}`;
      console.log('SceneManagerPanel: Creating new scene', id, newSceneName);
      dispatch({ type: 'CREATE_SCENE', payload: { id, name: newSceneName.trim() } });

      setShowCreateDialog(false);
      setNewSceneName('');
      Alert.alert('成功', `场景 "${newSceneName}" 创建成功！`);
    } catch (error) {
      console.error('创建场景失败:', error);
      Alert.alert('错误', '创建场景失败');
    }
  };

  // 删除场景
  const handleDeleteScene = (sceneId: string) => {
    const scene = scenes[sceneId];
    if (!scene) return;

    if (Object.keys(scenes).length <= 1) {
      Alert.alert('错误', '至少需要保留一个场景');
      return;
    }

    try {
      dispatch({ type: 'DELETE_SCENE', payload: sceneId });

      // 如果删除的是当前场景，切换到其他场景
      if (sceneId === currentSceneId) {
        const remainingScenes = Object.keys(scenes).filter(id => id !== sceneId);
        if (remainingScenes.length > 0) {
          dispatch({ type: 'SWITCH_SCENE', payload: remainingScenes[0] });
        }
      }

      console.log('场景已删除:', scene.name);
    } catch (error) {
      console.error('删除场景失败:', error);
      Alert.alert('错误', '删除场景失败');
    }
  };

  if (showCreateDialog) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>新建场景</Text>
          <TouchableOpacity
            style={styles.compactCloseButton}
            onPress={() => setShowCreateDialog(false)}
          >
            <Text style={styles.compactCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.compactForm}>
          <TextInput
            style={styles.compactInput}
            value={newSceneName}
            onChangeText={setNewSceneName}
            placeholder="场景名称"
            maxLength={50}
          />
          <View style={styles.compactButtonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowCreateDialog(false)}
            >
              <Text style={styles.secondaryButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateScene}
            >
              <Text style={styles.primaryButtonText}>创建</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.compactContainer}>
      <Text style={styles.compactLabel}>场景</Text>
      <View style={styles.compactControls}>
        <CustomPicker
          selectedValue={currentSceneId || ''}
          onValueChange={handleSwitchScene}
          onDelete={handleDeleteScene}
          items={sceneList.map(scene => ({
            id: scene.id,
            label: scene.name,
            value: scene.id
          }))}
          style={styles.compactPicker}
          canDelete={true}
        />
        <TouchableOpacity
          style={styles.compactAddButton}
          onPress={() => setShowCreateDialog(true)}
        >
          <Text style={styles.compactAddText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  compactPicker: {
    height: 32,
    minWidth: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  compactAddButton: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAddText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  compactCloseButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCloseText: {
    fontSize: 14,
    color: '#666',
  },
  compactForm: {
    gap: 8,
  },
  compactInput: {
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  compactButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    height: 28,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    height: 28,
    backgroundColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
});
