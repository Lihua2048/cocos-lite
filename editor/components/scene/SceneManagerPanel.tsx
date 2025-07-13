import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { RootState, SceneData } from '../../../core/types';
import { createScene, deleteScene, switchScene, renameScene, saveCurrentScene } from '../../../core/actions';
import { SceneStorage } from '../../../core/utils/sceneStorage';

export default function SceneManagerPanel() {
  const dispatch = useDispatch();
  const { scenes, currentSceneId } = useSelector((state: RootState) => ({
    scenes: state.editor.scenes || {},
    currentSceneId: state.editor.currentSceneId
  }));

  const [newSceneName, setNewSceneName] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const sceneList = Object.values(scenes);

  // 创建新场景
  const handleCreateScene = () => {
    if (!newSceneName.trim()) return;
    const id = `scene_${Date.now()}`;
    dispatch(createScene(id, newSceneName.trim()));
    setNewSceneName('');
  };

  // 切换场景
  const handleSwitchScene = (sceneId: string) => {
    if (sceneId === currentSceneId) return;
    dispatch(switchScene(sceneId));
  };

  // 删除场景
  const handleDeleteScene = (sceneId: string) => {
    if (sceneId === currentSceneId) {
      alert('无法删除当前活动场景');
      return;
    }
    if (confirm('确定要删除这个场景吗？')) {
      dispatch(deleteScene(sceneId));
    }
  };

  // 重命名场景
  const handleRenameScene = (sceneId: string) => {
    if (!editingName.trim()) return;
    dispatch(renameScene(sceneId, editingName.trim()));
    setEditingSceneId(null);
    setEditingName('');
  };

  // 保存当前场景
  const handleSaveCurrentScene = () => {
    dispatch(saveCurrentScene());
  };

  // 导出场景
  const handleExportScenes = () => {
    SceneStorage.exportScenesAsFile(scenes);
  };

  return (
    <View style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <Text style={styles.title}>场景</Text>
        <Text style={styles.sceneCount}>{sceneList.length} 个场景</Text>
      </View>

      {/* 创建新场景 */}
      <View style={styles.createSection}>
        <TextInput
          style={styles.createInput}
          placeholder="新场景名称"
          value={newSceneName}
          onChangeText={setNewSceneName}
          maxLength={30}
        />
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateScene}
          disabled={!newSceneName.trim()}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 场景列表 */}
      <View style={styles.sceneList}>
        {sceneList.map((scene) => (
          <View key={scene.id} style={[
            styles.sceneItem,
            scene.id === currentSceneId && styles.activeScene
          ]}>
            <TouchableOpacity
              style={styles.sceneMain}
              onPress={() => handleSwitchScene(scene.id)}
            >
              <View style={styles.sceneIndicator} />
              <View style={styles.sceneContent}>
                <Text style={styles.sceneName}>{scene.name}</Text>
                <Text style={styles.sceneInfo}>
                  {scene.metadata.entityCount || 0} 实体
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.sceneActions}>
              {scene.id !== currentSceneId && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteScene(scene.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {sceneList.length === 0 && (
          <Text style={styles.emptyText}>暂无场景</Text>
        )}
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

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sceneCount: {
    fontSize: 11,
    color: '#666',
  },

  // Create section
  createSection: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  createInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    height: 32,
  },
  createButton: {
    backgroundColor: '#28a745',
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Scene list
  sceneList: {
    flex: 1,
  },
  sceneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  activeScene: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  sceneMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sceneIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  sceneContent: {
    flex: 1,
  },
  sceneName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  sceneInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  sceneActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
