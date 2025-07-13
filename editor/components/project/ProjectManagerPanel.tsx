import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { projectManager } from '../../managers/ProjectManager';
import { ProjectConfig, ProjectTemplate } from '../../../core/types';

interface ProjectManagerPanelProps {}

export default function ProjectManagerPanel({}: ProjectManagerPanelProps) {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectConfig | null>(null);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('empty');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(projectManager.getProjects());
    setCurrentProject(projectManager.getCurrentProject());
    setTemplates(projectManager.getProjectTemplates());
  };

  const handleProjectSwitch = async (projectId: string) => {
    if (projectId === currentProject?.id) return;

    try {
      const success = await projectManager.switchProject(projectId);
      if (success) {
        loadData();
        Alert.alert('成功', `已切换到项目: ${projectManager.getCurrentProject()?.name}`);
      }
    } catch (error) {
      Alert.alert('错误', `切换项目失败: ${error}`);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('错误', '请输入项目名称');
      return;
    }

    try {
      const project = await projectManager.createProject(
        newProjectName.trim(),
        selectedTemplate,
        newProjectDescription.trim()
      );

      await projectManager.switchProject(project.id);
      loadData();
      setShowCreateDialog(false);
      setNewProjectName('');
      setNewProjectDescription('');
      Alert.alert('成功', `项目 "${project.name}" 创建成功！`);
    } catch (error) {
      Alert.alert('错误', `创建项目失败: ${error}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    Alert.alert(
      '确认删除',
      `确定要删除项目 "${project.name}" 吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectManager.deleteProject(projectId);
              loadData();
              Alert.alert('成功', '项目已删除');
            } catch (error) {
              Alert.alert('错误', `删除项目失败: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleExportProject = (projectId: string) => {
    const projectData = projectManager.exportProject(projectId);
    if (projectData) {
      // 在实际应用中，这里应该触发文件下载
      console.log('导出项目数据:', projectData);
      Alert.alert('成功', '项目已导出到控制台（实际应用中会下载文件）');
    } else {
      Alert.alert('错误', '导出项目失败');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (showCreateDialog) {
    return (
      <View style={styles.container}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>创建新项目</Text>
          <TouchableOpacity
            style={styles.compactCloseButton}
            onPress={() => setShowCreateDialog(false)}
          >
            <Text style={styles.compactCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.compactForm}>
          <View style={styles.formRow}>
            <TextInput
              style={styles.compactInput}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="项目名称"
              maxLength={50}
            />
            <Picker
              selectedValue={selectedTemplate}
              onValueChange={setSelectedTemplate}
              style={styles.compactPicker}
            >
              {templates.map(template => (
                <Picker.Item
                  key={template.id}
                  label={template.name}
                  value={template.id}
                />
              ))}
            </Picker>
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
        <Picker
          selectedValue={currentProject?.id || ''}
          onValueChange={handleProjectSwitch}
          style={styles.compactPicker}
        >
          <Picker.Item label="选择项目..." value="" />
          {projects.map(project => (
            <Picker.Item
              key={project.id}
              label={project.name}
              value={project.id}
            />
          ))}
        </Picker>
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

  // Compact header styles
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  currentProjectName: {
    fontSize: 11,
    color: '#666',
  },

  // Form styles
  compactForm: {
    padding: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactInput: {
    flex: 2,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    height: 32,
  },
  compactPicker: {
    minWidth: 120,
    height: 32,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  projectPicker: {
    minWidth: 120,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    height: 32,
  },

  // Button styles
  primaryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  compactCloseButton: {
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCloseText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Stats section
  projectStats: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  statsText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});
