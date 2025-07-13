import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/types';
import {
  sceneCompositionManager,
  CompositionMode,
  CompositionProject,
  SceneLayer
} from '../../../core/scene/SceneCompositionManager';

export default function SceneCompositionEditor() {
  const scenes = useSelector((state: RootState) => state.editor.scenes || {});
  const sceneList = Object.values(scenes);

  const [projects, setProjects] = useState<CompositionProject[]>([]);
  const [currentProject, setCurrentProject] = useState<CompositionProject | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectMode, setNewProjectMode] = useState<CompositionMode>(CompositionMode.LAYERED);

  useEffect(() => {
    loadProjects();

    // 设置渲染回调
    sceneCompositionManager.setRenderCallback((project) => {
      // 更新当前项目状态
      setCurrentProject({ ...project });
    });
  }, []);

  const loadProjects = () => {
    setProjects(sceneCompositionManager.getAllProjects());
    setCurrentProject(sceneCompositionManager.getCurrentProject());
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      Alert.alert('错误', '请输入项目名称');
      return;
    }

    const project = sceneCompositionManager.createCompositionProject(
      newProjectName.trim(),
      newProjectMode
    );

    sceneCompositionManager.setCurrentProject(project.id);
    loadProjects();
    setShowCreateDialog(false);
    setNewProjectName('');
    Alert.alert('成功', `组合项目 "${project.name}" 创建成功！`);
  };

  const handleSwitchProject = (projectId: string) => {
    sceneCompositionManager.setCurrentProject(projectId);
    loadProjects();
  };

  const handleAddScene = (sceneId: string) => {
    if (!currentProject) return;

    const layerIndex = currentProject.layers.length;
    const success = sceneCompositionManager.addSceneToComposition(
      currentProject.id,
      sceneId,
      layerIndex
    );

    if (success) {
      loadProjects();
    }
  };

  const handleRemoveScene = (sceneId: string) => {
    if (!currentProject) return;

    const success = sceneCompositionManager.removeSceneFromComposition(
      currentProject.id,
      sceneId
    );

    if (success) {
      loadProjects();
    }
  };

  const handleLayerChange = (sceneId: string, newLayer: number) => {
    if (!currentProject) return;

    sceneCompositionManager.setSceneLayer(currentProject.id, sceneId, newLayer);
    loadProjects();
  };

  const handleVisibilityToggle = (sceneId: string) => {
    if (!currentProject) return;

    const layer = currentProject.layers.find(l => l.sceneId === sceneId);
    if (layer) {
      sceneCompositionManager.setSceneVisibility(
        currentProject.id,
        sceneId,
        !layer.visible
      );
      loadProjects();
    }
  };

  const handleAlphaChange = (sceneId: string, alpha: number) => {
    if (!currentProject) return;

    sceneCompositionManager.setSceneAlpha(currentProject.id, sceneId, alpha);
    loadProjects();
  };

  const handleActivateScene = (sceneId: string) => {
    if (!currentProject || currentProject.mode !== CompositionMode.SWITCH) return;

    sceneCompositionManager.activateScene(currentProject.id, sceneId);
    loadProjects();
  };

  const handleSetMainScene = (sceneId: string) => {
    if (!currentProject || currentProject.mode !== CompositionMode.HYBRID) return;

    sceneCompositionManager.setMainScene(currentProject.id, sceneId);
    loadProjects();
  };

  const handleTogglePersistentUI = (sceneId: string) => {
    if (!currentProject || currentProject.mode !== CompositionMode.HYBRID) return;

    const isPersistent = currentProject.persistentUIScenes.includes(sceneId);
    if (isPersistent) {
      sceneCompositionManager.removePersistentUIScene(currentProject.id, sceneId);
    } else {
      sceneCompositionManager.addPersistentUIScene(currentProject.id, sceneId);
    }
    loadProjects();
  };

  const renderModeControls = () => {
    if (!currentProject) return null;

    switch (currentProject.mode) {
      case CompositionMode.LAYERED:
        return (
          <View style={styles.modeControls}>
            <Text style={styles.modeTitle}>叠加模式控制</Text>
            <Text style={styles.modeDesc}>多场景同时渲染，可调整层级和透明度</Text>
            {currentProject.layers.map((layer, index) => (
              <View key={layer.sceneId} style={styles.layerControl}>
                <Text style={styles.layerName}>
                  {scenes[layer.sceneId]?.name || layer.sceneId}
                </Text>
                <View style={styles.layerControls}>
                  <TextInput
                    style={styles.layerInput}
                    placeholder="层级"
                    value={layer.layerIndex.toString()}
                    onChangeText={(text) => {
                      const newLayer = parseInt(text) || 0;
                      handleLayerChange(layer.sceneId, newLayer);
                    }}
                  />
                  <TextInput
                    style={styles.layerInput}
                    placeholder="透明度"
                    value={layer.alpha.toString()}
                    onChangeText={(text) => {
                      const alpha = parseFloat(text) || 0;
                      handleAlphaChange(layer.sceneId, Math.max(0, Math.min(1, alpha)));
                    }}
                  />
                  <TouchableOpacity
                    style={[styles.toggleButton, layer.visible && styles.activeButton]}
                    onPress={() => handleVisibilityToggle(layer.sceneId)}
                  >
                    <Text style={styles.toggleText}>
                      {layer.visible ? '显示' : '隐藏'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        );

      case CompositionMode.SWITCH:
        return (
          <View style={styles.modeControls}>
            <Text style={styles.modeTitle}>切换模式控制</Text>
            <Text style={styles.modeDesc}>同时只有一个主场景激活</Text>
            <Text style={styles.activeSceneLabel}>
              当前激活: {currentProject.activeSceneId ?
                (scenes[currentProject.activeSceneId]?.name || currentProject.activeSceneId) :
                '无'}
            </Text>
            {currentProject.layers.map((layer) => (
              <TouchableOpacity
                key={layer.sceneId}
                style={[
                  styles.sceneButton,
                  currentProject.activeSceneId === layer.sceneId && styles.activeSceneButton
                ]}
                onPress={() => handleActivateScene(layer.sceneId)}
              >
                <Text style={styles.sceneButtonText}>
                  {scenes[layer.sceneId]?.name || layer.sceneId}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case CompositionMode.HYBRID:
        return (
          <View style={styles.modeControls}>
            <Text style={styles.modeTitle}>混合模式控制</Text>
            <Text style={styles.modeDesc}>主场景 + 持久化UI场景组合</Text>

            <Text style={styles.sectionTitle}>主场景:</Text>
            <Text style={styles.mainSceneLabel}>
              {currentProject.mainSceneId ?
                (scenes[currentProject.mainSceneId]?.name || currentProject.mainSceneId) :
                '未设置'}
            </Text>

            <Text style={styles.sectionTitle}>持久化UI场景:</Text>
            {currentProject.persistentUIScenes.map((sceneId) => (
              <Text key={sceneId} style={styles.persistentUILabel}>
                • {scenes[sceneId]?.name || sceneId}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>场景操作:</Text>
            {currentProject.layers.map((layer) => (
              <View key={layer.sceneId} style={styles.hybridControl}>
                <Text style={styles.hybridSceneName}>
                  {scenes[layer.sceneId]?.name || layer.sceneId}
                </Text>
                <View style={styles.hybridButtons}>
                  <TouchableOpacity
                    style={[
                      styles.hybridButton,
                      currentProject.mainSceneId === layer.sceneId && styles.activeButton
                    ]}
                    onPress={() => handleSetMainScene(layer.sceneId)}
                  >
                    <Text style={styles.hybridButtonText}>设为主场景</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.hybridButton,
                      currentProject.persistentUIScenes.includes(layer.sceneId) && styles.activeButton
                    ]}
                    onPress={() => handleTogglePersistentUI(layer.sceneId)}
                  >
                    <Text style={styles.hybridButtonText}>
                      {currentProject.persistentUIScenes.includes(layer.sceneId) ?
                        '移除UI' : '添加UI'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 项目选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>场景组合项目</Text>
        <View style={styles.projectControls}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateDialog(true)}
          >
            <Text style={styles.createButtonText}>新建组合项目</Text>
          </TouchableOpacity>

          {projects.length > 0 && (
            <Picker
              style={styles.projectPicker}
              selectedValue={currentProject?.id || ''}
              onValueChange={handleSwitchProject}
            >
              <Picker.Item label="选择项目..." value="" />
              {projects.map((project) => (
                <Picker.Item
                  key={project.id}
                  label={`${project.name} (${project.mode})`}
                  value={project.id}
                />
              ))}
            </Picker>
          )}
        </View>
      </View>

      {/* 创建项目对话框 */}
      {showCreateDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>创建场景组合项目</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="项目名称"
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            <Picker
              style={styles.dialogPicker}
              selectedValue={newProjectMode}
              onValueChange={setNewProjectMode}
            >
              <Picker.Item label="叠加模式" value={CompositionMode.LAYERED} />
              <Picker.Item label="切换模式" value={CompositionMode.SWITCH} />
              <Picker.Item label="混合模式" value={CompositionMode.HYBRID} />
            </Picker>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogButton}
                onPress={() => setShowCreateDialog(false)}
              >
                <Text style={styles.dialogButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.primaryButton]}
                onPress={handleCreateProject}
              >
                <Text style={[styles.dialogButtonText, styles.primaryButtonText]}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 场景列表 */}
      {currentProject && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>可用场景</Text>
          {sceneList.map((scene) => (
            <View key={scene.id} style={styles.sceneItem}>
              <Text style={styles.sceneName}>{scene.name}</Text>
              <TouchableOpacity
                style={styles.addSceneButton}
                onPress={() => handleAddScene(scene.id)}
              >
                <Text style={styles.addSceneButtonText}>添加到组合</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 组合场景列表 */}
      {currentProject && currentProject.layers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>组合场景</Text>
          {currentProject.layers.map((layer) => (
            <View key={layer.sceneId} style={styles.compositionSceneItem}>
              <Text style={styles.compositionSceneName}>
                {scenes[layer.sceneId]?.name || layer.sceneId}
              </Text>
              <TouchableOpacity
                style={styles.removeSceneButton}
                onPress={() => handleRemoveScene(layer.sceneId)}
              >
                <Text style={styles.removeSceneButtonText}>移除</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 模式控制 */}
      {currentProject && renderModeControls()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  projectControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  projectPicker: {
    flex: 1,
    height: 40,
  },

  // 对话框样式
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dialogPicker: {
    height: 50,
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dialogButtonText: {
    fontSize: 14,
    color: '#333',
  },
  primaryButtonText: {
    color: '#ffffff',
  },

  // 场景列表样式
  sceneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sceneName: {
    fontSize: 14,
    color: '#333',
  },
  addSceneButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addSceneButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },

  // 组合场景样式
  compositionSceneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    marginBottom: 8,
  },
  compositionSceneName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  removeSceneButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeSceneButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },

  // 模式控制样式
  modeControls: {
    marginTop: 16,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modeDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },

  // 叠加模式样式
  layerControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  layerName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  layerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  layerInput: {
    width: 60,
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  toggleText: {
    fontSize: 12,
    color: '#333',
  },

  // 切换模式样式
  activeSceneLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  sceneButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  activeSceneButton: {
    backgroundColor: '#4CAF50',
  },
  sceneButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },

  // 混合模式样式
  mainSceneLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    paddingLeft: 16,
    fontStyle: 'italic',
  },
  persistentUILabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 16,
  },
  hybridControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hybridSceneName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  hybridButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  hybridButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  hybridButtonText: {
    fontSize: 12,
    color: '#333',
  },
});
