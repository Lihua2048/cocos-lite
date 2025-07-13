import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../core/types';
import { createScene, switchScene, deleteScene } from '../../../core/actions';
import { addProject, setCurrentProject, deleteProject } from '../../../core/actions/projectActions';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, template: string, renderMode: string, compositionModes: string[]) => void;
}

interface CreateSceneModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const renderModes = [
  { id: 'webgl', name: 'WebGL 渲染', description: '高性能 3D 渲染', enabled: true },
  { id: 'canvas2d', name: 'Canvas 2D', description: '轻量级 2D 渲染', enabled: false },
  { id: 'webgpu', name: 'WebGPU', description: '下一代渲染API', enabled: false },
];

const compositionModes = [
  { id: 'layered', name: '分层渲染', description: '支持多层场景叠加' },
  { id: 'sequential', name: '顺序渲染', description: '按顺序渲染场景' },
  { id: 'parallel', name: '并行渲染', description: '支持多场景并行处理' },
  { id: 'masking', name: '遮罩渲染', description: '支持场景遮罩效果' },
];

const blendModes = [
  { id: 'normal', name: '正常' },
  { id: 'multiply', name: '叠加' },
  { id: 'screen', name: '滤色' },
  { id: 'overlay', name: '覆盖' },
  { id: 'additive', name: '加法' },
];

function CreateProjectModal({ visible, onClose, onSubmit }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('2d');
  const [selectedRenderMode, setSelectedRenderMode] = useState('webgl');
  const [selectedCompositionModes, setSelectedCompositionModes] = useState<string[]>(['layered']);

  const toggleCompositionMode = (modeId: string) => {
    setSelectedCompositionModes(prev =>
      prev.includes(modeId)
        ? prev.filter(id => id !== modeId)
        : [...prev, modeId]
    );
  };

  const handleSubmit = () => {
    if (!projectName.trim()) {
      Alert.alert('错误', '请输入项目名称');
      return;
    }
    if (selectedCompositionModes.length === 0) {
      Alert.alert('错误', '请至少选择一种场景组合模式');
      return;
    }
    onSubmit(projectName.trim(), selectedTemplate, selectedRenderMode, selectedCompositionModes);
    setProjectName('');
    setSelectedCompositionModes(['layered']);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>创建新项目</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>项目名称</Text>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="输入项目名称"
              maxLength={50}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>项目模板</Text>
            <Picker
              selectedValue={selectedTemplate}
              onValueChange={setSelectedTemplate}
              style={styles.picker}
            >
              <Picker.Item label="2D 游戏" value="2d" />
              <Picker.Item label="3D 游戏" value="3d" />
              <Picker.Item label="UI 界面" value="ui" />
            </Picker>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>渲染模式</Text>
            <View style={styles.renderModeContainer}>
              {renderModes.map(mode => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.renderModeItem,
                    selectedRenderMode === mode.id && styles.selectedRenderMode,
                    !mode.enabled && styles.disabledRenderMode
                  ]}
                  onPress={() => mode.enabled && setSelectedRenderMode(mode.id)}
                  disabled={!mode.enabled}
                >
                  <Text style={[
                    styles.renderModeText,
                    selectedRenderMode === mode.id && styles.selectedRenderModeText,
                    !mode.enabled && styles.disabledRenderModeText
                  ]}>
                    {mode.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.description}>
              {renderModes.find(m => m.id === selectedRenderMode)?.description}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>场景组合模式 (可多选)</Text>
            <View style={styles.compositionModeContainer}>
              {compositionModes.map(mode => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.compositionModeItem,
                    selectedCompositionModes.includes(mode.id) && styles.selectedCompositionMode
                  ]}
                  onPress={() => toggleCompositionMode(mode.id)}
                >
                  <View style={[
                    styles.checkbox,
                    selectedCompositionModes.includes(mode.id) && styles.checkedBox
                  ]}>
                    {selectedCompositionModes.includes(mode.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <View style={styles.compositionModeContent}>
                    <Text style={styles.compositionModeText}>{mode.name}</Text>
                    <Text style={styles.compositionModeDesc}>{mode.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>创建</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CreateSceneModal({ visible, onClose, onSubmit }: CreateSceneModalProps) {
  const [sceneName, setSceneName] = useState('');

  const handleSubmit = () => {
    if (!sceneName.trim()) {
      Alert.alert('错误', '请输入场景名称');
      return;
    }
    onSubmit(sceneName.trim());
    setSceneName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>创建新场景</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>场景名称</Text>
            <TextInput
              style={styles.input}
              value={sceneName}
              onChangeText={setSceneName}
              placeholder="输入场景名称"
              maxLength={30}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>创建</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UnifiedToolbar() {
  const dispatch = useDispatch();

  // Redux state
  const { projects, currentProjectId } = useSelector((state: RootState) => state.projects || {});
  const { scenes, currentSceneId } = useSelector((state: RootState) => state.editor || {});

  const currentProject = currentProjectId ? projects?.[currentProjectId] : null;
  const projectList = projects ? Object.values(projects) : [];
  const sceneList = scenes ? Object.values(scenes) : [];

  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateScene, setShowCreateScene] = useState(false);
  const [showBlendModeMenu, setShowBlendModeMenu] = useState(false);
  const [currentBlendMode, setCurrentBlendMode] = useState('normal');
  const [isBuilding, setIsBuilding] = useState(false);

  // Project actions
  const handleCreateProject = (name: string, template: string, renderMode: string, compositionModes: string[]) => {
    const projectId = `project_${Date.now()}`;
    const projectData = {
      id: projectId,
      name,
      version: '1.0.0',
      description: `基于 ${template} 模板创建的项目`,
      created: Date.now(),
      lastModified: Date.now(),
      scenes: {},
      sceneGraph: {
        layers: [],
        transitions: [],
        initialScene: '',
        currentScene: '',
      },
      buildSettings: {
        h5: {
          outputPath: './build/h5',
          minify: true,
          sourceMap: false,
          optimization: true,
          bundleAnalyzer: false,
        },
        wechat: {
          outputPath: './build/wechat',
          minify: true,
          subpackages: false,
          optimization: true,
        },
      },
      assets: {
        textures: [],
        audio: [],
        fonts: [],
        scripts: [],
      },
      // 添加渲染模式和组合模式
      renderMode,
      compositionModes,
    };
    dispatch(addProject(projectData) as any);
    dispatch(setCurrentProject(projectData.id) as any);
  };

  const handleSwitchProject = (projectId: string) => {
    if (projectId && projectId !== currentProjectId) {
      dispatch(setCurrentProject(projectId) as any);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (projectId === currentProjectId) {
      Alert.alert('错误', '无法删除当前活动项目');
      return;
    }
    Alert.alert(
      '确认删除',
      '确定要删除这个项目吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => dispatch(deleteProject(projectId) as any) }
      ]
    );
  };

  // Scene actions
  const handleCreateScene = (name: string) => {
    const sceneId = `scene_${Date.now()}`;
    dispatch(createScene(sceneId, name));
  };

  const handleSwitchScene = (sceneId: string) => {
    if (sceneId && sceneId !== currentSceneId) {
      dispatch(switchScene(sceneId));
    }
  };

  const handleDeleteScene = (sceneId: string) => {
    if (sceneId === currentSceneId) {
      Alert.alert('错误', '无法删除当前活动场景');
      return;
    }
    Alert.alert(
      '确认删除',
      '确定要删除这个场景吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => dispatch(deleteScene(sceneId)) }
      ]
    );
  };

  // Build actions
  const handleBuild = async (platform: 'h5' | 'wechat') => {
    if (isBuilding) return;

    setIsBuilding(true);
    try {
      console.log(`开始构建 ${platform} 游戏...`);
      // 模拟构建过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('成功', `${platform === 'h5' ? 'H5' : '微信小游戏'} 构建成功！`);
    } catch (error) {
      Alert.alert('错误', `构建失败: ${error}`);
    } finally {
      setIsBuilding(false);
    }
  };

  // Blend mode actions
  const handleBlendModeChange = (mode: string) => {
    setCurrentBlendMode(mode);
    setShowBlendModeMenu(false);
    // TODO: 应用混合模式到项目设置
  };

  return (
    <View style={styles.toolbar}>
      {/* 项目管理区域 */}
      <View style={styles.toolbarSection}>
        <Text style={styles.sectionLabel}>项目</Text>
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={currentProjectId || ''}
            onValueChange={handleSwitchProject}
            style={styles.dropdown}
          >
            <Picker.Item label="选择项目..." value="" />
            {projectList.map(project => (
              <Picker.Item
                key={project.id}
                label={project.name}
                value={project.id}
              />
            ))}
          </Picker>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateProject(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 场景管理区域 */}
      <View style={styles.toolbarSection}>
        <Text style={styles.sectionLabel}>场景</Text>
        <View style={styles.dropdownContainer}>
          <Picker
            selectedValue={currentSceneId || ''}
            onValueChange={handleSwitchScene}
            style={styles.dropdown}
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
            style={styles.addButton}
            onPress={() => setShowCreateScene(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 组合模式区域 */}
      {currentProject && (
        <View style={styles.toolbarSection}>
          <Text style={styles.sectionLabel}>组合模式</Text>
          <TouchableOpacity
            style={styles.blendModeButton}
            onPress={() => setShowBlendModeMenu(!showBlendModeMenu)}
          >
            <Text style={styles.blendModeText}>
              {(currentProject as any).compositionModes?.length || 0} 种模式
            </Text>
          </TouchableOpacity>
          {showBlendModeMenu && (
            <View style={styles.compositionModeDropdown}>
              {compositionModes.map(mode => {
                const isSelected = (currentProject as any).compositionModes?.includes(mode.id) || false;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.compositionModeDropdownItem, isSelected && styles.selectedCompositionModeDropdown]}
                    onPress={() => {
                      // TODO: 实现组合模式切换逻辑
                      console.log('切换组合模式:', mode.id);
                    }}
                  >
                    <View style={[styles.checkboxSmall, isSelected && styles.checkedBoxSmall]}>
                      {isSelected && <Text style={styles.checkmarkSmall}>✓</Text>}
                    </View>
                    <Text style={styles.compositionModeDropdownText}>{mode.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 构建区域 */}
      <View style={styles.toolbarSection}>
        <Text style={styles.sectionLabel}>构建</Text>
        <View style={styles.buildButtons}>
          <TouchableOpacity
            style={[styles.buildButton, styles.h5Button, isBuilding && styles.disabledButton]}
            onPress={() => handleBuild('h5')}
            disabled={isBuilding || !currentProject}
          >
            <Text style={styles.buildButtonText}>H5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buildButton, styles.wechatButton, isBuilding && styles.disabledButton]}
            onPress={() => handleBuild('wechat')}
            disabled={isBuilding || !currentProject}
          >
            <Text style={styles.buildButtonText}>微信</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 状态信息 */}
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>
          {currentProject ? `${currentProject.name} • ${sceneList.length}场景` : '未选择项目'}
        </Text>
      </View>

      {/* Modals */}
      <CreateProjectModal
        visible={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSubmit={handleCreateProject}
      />
      <CreateSceneModal
        visible={showCreateScene}
        onClose={() => setShowCreateScene(false)}
        onSubmit={handleCreateScene}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e9ea',
    alignItems: 'center',
    minHeight: 60,
  },

  toolbarSection: {
    marginRight: 20,
    position: 'relative',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },

  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dropdown: {
    minWidth: 120,
    height: 32,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },

  addButton: {
    width: 32,
    height: 32,
    backgroundColor: '#28a745',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  blendModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    minWidth: 80,
  },

  blendModeText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },

  blendModeMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 4,
    zIndex: 1000,
  },

  blendModeItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  blendModeItemText: {
    fontSize: 12,
    color: '#333',
  },

  buildButtons: {
    flexDirection: 'row',
    gap: 4,
  },

  buildButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },

  h5Button: {
    backgroundColor: '#4CAF50',
  },

  wechatButton: {
    backgroundColor: '#00C851',
  },

  disabledButton: {
    backgroundColor: '#ccc',
  },

  buildButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  statusSection: {
    marginLeft: 'auto',
  },

  statusText: {
    fontSize: 11,
    color: '#666',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    minWidth: 300,
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },

  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },

  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#6c757d',
  },

  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
  },

  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // 渲染模式样式
  renderModeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },

  renderModeItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },

  selectedRenderMode: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },

  disabledRenderMode: {
    backgroundColor: '#e9ecef',
    borderColor: '#dee2e6',
    opacity: 0.5,
  },

  renderModeText: {
    fontSize: 12,
    color: '#333',
  },

  selectedRenderModeText: {
    color: 'white',
  },

  disabledRenderModeText: {
    color: '#6c757d',
  },

  // 组合模式样式
  compositionModeContainer: {
    marginVertical: 8,
  },

  compositionModeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  selectedCompositionMode: {
    backgroundColor: '#f8f9fa',
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 3,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },

  checkedBox: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },

  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  compositionModeContent: {
    flex: 1,
  },

  compositionModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },

  compositionModeDesc: {
    fontSize: 12,
    color: '#666',
  },

  // 下拉框中的组合模式样式
  compositionModeDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 4,
    zIndex: 1000,
    minWidth: 150,
  },

  compositionModeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  selectedCompositionModeDropdown: {
    backgroundColor: '#f8f9fa',
  },

  checkboxSmall: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },

  checkedBoxSmall: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },

  checkmarkSmall: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  compositionModeDropdownText: {
    fontSize: 12,
    color: '#333',
  },
});
