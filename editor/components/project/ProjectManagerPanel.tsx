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
        <View style={styles.header}>
          <Text style={styles.title}>创建新项目</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateDialog(false)}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.createForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>项目名称 *</Text>
            <TextInput
              style={styles.input}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="输入项目名称"
              maxLength={50}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>项目描述</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={newProjectDescription}
              onChangeText={setNewProjectDescription}
              placeholder="输入项目描述（可选）"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>项目模板</Text>
            <Picker
              selectedValue={selectedTemplate}
              onValueChange={setSelectedTemplate}
              style={styles.picker}
            >
              {templates.map(template => (
                <Picker.Item
                  key={template.id}
                  label={template.name}
                  value={template.id}
                />
              ))}
            </Picker>
            {templates.find(t => t.id === selectedTemplate) && (
              <Text style={styles.templateDescription}>
                {templates.find(t => t.id === selectedTemplate)?.description}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateProject}
          >
            <Text style={styles.createButtonText}>创建项目</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>项目管理</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateDialog(true)}
        >
          <Text style={styles.addButtonText}>+ 新建项目</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.currentProject}>
        <Text style={styles.sectionTitle}>当前项目</Text>
        {currentProject ? (
          <View style={styles.projectCard}>
            <Text style={styles.projectName}>{currentProject.name}</Text>
            <Text style={styles.projectInfo}>
              版本: {currentProject.version} |
              场景: {Object.keys(currentProject.scenes).length} |
              修改: {formatDate(currentProject.lastModified)}
            </Text>
            {currentProject.description && (
              <Text style={styles.projectDescription}>{currentProject.description}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.noProject}>未选择项目</Text>
        )}
      </View>

      <View style={styles.projectSelector}>
        <Text style={styles.sectionTitle}>切换项目</Text>
        <Picker
          selectedValue={currentProject?.id || ''}
          onValueChange={handleProjectSwitch}
          style={styles.picker}
        >
          <Picker.Item label="选择项目..." value="" />
          {projects.map(project => (
            <Picker.Item
              key={project.id}
              label={`${project.name} (${Object.keys(project.scenes).length} 场景)`}
              value={project.id}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.projectList}>
        <Text style={styles.sectionTitle}>所有项目</Text>
        <ScrollView style={styles.projectScrollView}>
          {projects.map(project => (
            <View key={project.id} style={styles.projectItem}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectItemName}>{project.name}</Text>
                <Text style={styles.projectItemDetails}>
                  {Object.keys(project.scenes).length} 场景 | {formatDate(project.lastModified)}
                </Text>
                {project.description && (
                  <Text style={styles.projectItemDescription}>{project.description}</Text>
                )}
              </View>
              <View style={styles.projectActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.selectButton]}
                  onPress={() => handleProjectSwitch(project.id)}
                >
                  <Text style={styles.actionButtonText}>选择</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.exportButton]}
                  onPress={() => handleExportProject(project.id)}
                >
                  <Text style={styles.actionButtonText}>导出</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteProject(project.id)}
                >
                  <Text style={styles.actionButtonText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {projects.length === 0 && (
            <Text style={styles.emptyMessage}>暂无项目，点击"新建项目"开始创建</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  currentProject: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  projectCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  projectInfo: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 12,
    color: '#495057',
    fontStyle: 'italic',
  },
  noProject: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  projectSelector: {
    marginBottom: 16,
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  projectList: {
    flex: 1,
  },
  projectScrollView: {
    flex: 1,
  },
  projectItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  projectItemDetails: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 2,
  },
  projectItemDescription: {
    fontSize: 11,
    color: '#495057',
    fontStyle: 'italic',
  },
  projectActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: '#28a745',
  },
  exportButton: {
    backgroundColor: '#17a2b8',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  createForm: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#495057',
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  templateDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
