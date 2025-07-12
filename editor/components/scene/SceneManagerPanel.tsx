import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { EditorState, SceneData } from '../../../core/types';
import { createScene, deleteScene, switchScene, renameScene, saveCurrentScene } from '../../../core/actions';
import { SceneStorage } from '../../../core/utils/sceneStorage';

export default function SceneManagerPanel() {
  const dispatch = useDispatch();
  const { scenes, currentSceneId } = useSelector((state: EditorState) => ({
    scenes: state.scenes,
    currentSceneId: state.currentSceneId
  }));

  const [newSceneName, setNewSceneName] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  // 导入场景
  const handleImportScenes = async () => {
    const importedScenes = await SceneStorage.importScenesFromFile();
    if (importedScenes) {
      // 这里需要dispatch一个导入action
      console.log('Imported scenes:', importedScenes);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>场景管理</Text>

      {/* 创建新场景 */}
      <View style={styles.createSection}>
        <TextInput
          style={styles.input}
          placeholder="输入场景名称"
          value={newSceneName}
          onChangeText={setNewSceneName}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreateScene}>
          <Text style={styles.buttonText}>创建场景</Text>
        </TouchableOpacity>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSaveCurrentScene}>
          <Text style={styles.actionButtonText}>保存当前场景</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleExportScenes}>
          <Text style={styles.actionButtonText}>导出场景</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleImportScenes}>
          <Text style={styles.actionButtonText}>导入场景</Text>
        </TouchableOpacity>
      </View>

      {/* 场景列表 */}
      <View style={styles.sceneList}>
        {Object.values(scenes).map((scene) => (
          <View key={scene.id} style={[
            styles.sceneItem,
            scene.id === currentSceneId && styles.activeScene
          ]}>
            {editingSceneId === scene.id ? (
              <View style={styles.editingRow}>
                <TextInput
                  style={styles.editInput}
                  value={editingName}
                  onChangeText={setEditingName}
                  onBlur={() => handleRenameScene(scene.id)}
                  autoFocus
                />
              </View>
            ) : (
              <View style={styles.sceneRow}>
                <TouchableOpacity
                  style={styles.sceneInfo}
                  onPress={() => handleSwitchScene(scene.id)}
                >
                  <Text style={styles.sceneName}>{scene.name}</Text>
                  <Text style={styles.sceneInfo}>
                    实体数: {scene.metadata.entityCount}
                  </Text>
                </TouchableOpacity>

                <View style={styles.sceneActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingSceneId(scene.id);
                      setEditingName(scene.name);
                    }}
                  >
                    <Text style={styles.editButtonText}>重命名</Text>
                  </TouchableOpacity>

                  {scene.id !== currentSceneId && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteScene(scene.id)}
                    >
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  createSection: {
    flexDirection: 'row',
    marginBottom: 15
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 4
  },
  buttonText: {
    color: 'white',
    fontSize: 14
  },
  actionsSection: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 5
  },
  actionButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 4,
    flex: 1
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center'
  },
  sceneList: {
    flex: 1
  },
  sceneItem: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  activeScene: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd'
  },
  sceneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sceneInfo: {
    flex: 1
  },
  sceneName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  sceneActions: {
    flexDirection: 'row',
    gap: 5
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 5,
    borderRadius: 3
  },
  editButtonText: {
    color: 'white',
    fontSize: 12
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 5,
    borderRadius: 3
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12
  },
  editingRow: {
    flexDirection: 'row'
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 3,
    padding: 5,
    backgroundColor: 'white'
  }
});
