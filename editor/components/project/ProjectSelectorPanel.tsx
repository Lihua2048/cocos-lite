import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RootState } from '../../../core/types';
import {
  createProject,
  deleteProject,
  switchProject,
  updateProject,
  saveCurrentScene,
  loadProjectScenes
} from '../../../core/actions';

interface ProjectSelectorPanelProps {}

export default function ProjectSelectorPanel({}: ProjectSelectorPanelProps) {
  const dispatch = useDispatch();
  const { projects, currentProjectId } = useSelector((state: RootState) => state.projects);
  const currentProject = currentProjectId ? projects[currentProjectId] : null;
  const projectList = Object.values(projects);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // 处理项目切换
  const handleProjectSwitch = async (projectId: string) => {
    if (!projectId || projectId === currentProjectId) return;

    try {
      // 1. 保存当前项目的场景数据
      if (currentProjectId) {
        dispatch({ type: 'SAVE_CURRENT_SCENE' });
        await new Promise(resolve => setTimeout(resolve, 100)); // 等待保存完成
      }

      // 2. 切换到新项目
      dispatch({ type: 'SWITCH_PROJECT', payload: { projectId } });

      // 3. 加载新项目的场景数据
      dispatch({ type: 'LOAD_PROJECT_SCENES', payload: { projectId } });

      console.log(`项目已切换到: ${projects[projectId]?.name}`);
    } catch (error) {
      console.error('切换项目失败:', error);
      Alert.alert('错误', '切换项目失败');
    }
  };

  // 创建新项目
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('错误', '请输入项目名称');
      return;
    }

    try {
      // 1. 保存当前项目
      if (currentProjectId) {
        dispatch(saveCurrentScene());
        await new Promise(resolve => setTimeout(resolve, 100));
      }      // 2. 创建新项目
      const projectId = `project-${Date.now()}`;
      const defaultSceneId = `${projectId}-scene-1`;

      const newProject: any = {
        id: projectId,
        name: newProjectName.trim(),
        version: '1.0.0',
        description: newProjectDescription.trim(),
        created: Date.now(),
        lastModified: Date.now(),
        scenes: {
          [defaultSceneId]: {
            id: defaultSceneId,
            name: '场景 1',
            type: 'main' as const,
            layer: 0,
            dependencies: [],
            loadPriority: 1,
            renderMode: 'normal' as const,
            state: 'inactive' as const,
            lastModified: Date.now(),
            data: {
              id: defaultSceneId,
              name: '场景 1',
              entities: {},
              version: 1
            }
          }
        },
        sceneGraph: {
          layers: [],
          transitions: [],
          initialScene: defaultSceneId,
          currentScene: defaultSceneId
        },
        buildSettings: {
          h5: {
            outputPath: './dist/h5',
            minify: true,
            sourceMap: false,
            optimization: true,
            bundleAnalyzer: false
          },
          wechat: {
            outputPath: './dist/wechat',
            appId: '',
            minify: true
          }
        },
        assets: {
          textures: [],
          audio: [],
          fonts: [],
          scripts: []
        }
      };

      dispatch({ type: 'CREATE_PROJECT', payload: { project: newProject } });

      // 3. 切换到新项目
      dispatch({ type: 'SWITCH_PROJECT', payload: { projectId } });

      // 4. 创建默认场景
      dispatch({
        type: 'CREATE_SCENE',
        payload: {
          id: defaultSceneId,
          name: '场景 1',
          projectId: projectId
        }
      });

      setShowCreateDialog(false);
      setNewProjectName('');
      setNewProjectDescription('');
      Alert.alert('成功', `项目 "${newProjectName}" 创建成功！`);
    } catch (error) {
      console.error('创建项目失败:', error);
      Alert.alert('错误', '创建项目失败');
    }
  };

  // 删除项目
  const handleDeleteProject = (projectId: string) => {
    const project = projects[projectId];
    if (!project) return;

    if (Object.keys(projects).length <= 1) {
      Alert.alert('错误', '至少需要保留一个项目');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除项目 "${project.name}" 吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',          onPress: () => {
            try {
              dispatch({ type: 'DELETE_PROJECT', payload: { projectId } });

              // 如果删除的是当前项目，切换到其他项目
              if (projectId === currentProjectId) {
                const remainingProjects = Object.keys(projects).filter(id => id !== projectId);
                if (remainingProjects.length > 0) {
                  dispatch({ type: 'SWITCH_PROJECT', payload: { projectId: remainingProjects[0] } });
                }
              }

              Alert.alert('成功', '项目已删除');
            } catch (error) {
              Alert.alert('错误', '删除项目失败');
            }
          },
        },
      ]
    );
  };

  if (showCreateDialog) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>新建项目</Text>
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
            value={newProjectName}
            onChangeText={setNewProjectName}
            placeholder="项目名称"
            maxLength={50}
          />
          <TextInput
            style={styles.compactDescInput}
            value={newProjectDescription}
            onChangeText={setNewProjectDescription}
            placeholder="项目描述（可选）"
            maxLength={200}
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
              onPress={handleCreateProject}
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
      <Text style={styles.compactLabel}>项目</Text>
      <View style={styles.compactControls}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={currentProjectId || ''}
            onValueChange={handleProjectSwitch}
            style={styles.compactPicker}
          >
            {projectList.map(project => (
              <Picker.Item
                key={project.id}
                label={project.name}
                value={project.id}
              />
            ))}
          </Picker>
          {/* 删除按钮 */}
          {currentProjectId && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteProject(currentProjectId)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
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
  pickerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactPicker: {
    height: 32,
    minWidth: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
  },
  deleteText: {
    fontSize: 12,
    color: '#ff4444',
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
  compactDescInput: {
    height: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 10,
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
