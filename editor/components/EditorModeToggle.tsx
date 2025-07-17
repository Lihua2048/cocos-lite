/**
 * 编辑器模式切换组件 - 三段式开关
 * 第一个按钮: 蓝图节点编辑器
 * 第二个按钮: 当前编辑器页面 (Canvas)
 * 第三个按钮: 预留模式
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setEditorMode, setBlueprintProject } from '../../core/actions';
import { BlueprintProject } from '../../core/types';

export type EditorMode = 'blueprint' | 'canvas' | 'reserved';

interface EditorModeToggleProps {
  onModeChange?: (mode: EditorMode) => void;
}

export default function EditorModeToggle({ onModeChange }: EditorModeToggleProps) {
  const dispatch = useDispatch();
  const { editorMode, blueprintEditor } = useSelector((state: RootState) => ({
    editorMode: state.editor.editorMode,
    blueprintEditor: state.editor.blueprintEditor
  }));

  // 创建默认蓝图项目
  const createDefaultBlueprintProject = (): BlueprintProject => ({
    id: 'default_blueprint',
    name: 'Default Blueprint',
    nodes: new Map(),
    connections: new Map(),
    viewport: { x: 0, y: 0, scale: 1.0 },
    selectedNodes: new Set()
  });

  const handleModeChange = (mode: EditorMode) => {
    console.log('EditorModeToggle: Switching to mode:', mode);

    if (mode === 'blueprint') {
      // 切换到蓝图编辑器
      dispatch(setEditorMode('blueprint'));
      
      // 如果还没有蓝图项目，创建一个默认的
      if (!blueprintEditor.currentProject) {
        const defaultProject = createDefaultBlueprintProject();
        dispatch(setBlueprintProject(defaultProject));
      }
    } else if (mode === 'canvas') {
      // 切换到画布编辑器
      dispatch(setEditorMode('canvas'));
    } else if (mode === 'reserved') {
      // 预留模式，暂时不做处理
      console.log('Reserved mode - not implemented yet');
      return;
    }

    onModeChange?.(mode);
  };

  const getModeFromEditorState = (): EditorMode => {
    if (editorMode === 'blueprint') return 'blueprint';
    if (editorMode === 'canvas') return 'canvas';
    return 'canvas'; // 默认为canvas
  };

  const currentMode = getModeFromEditorState();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>编辑器模式</Text>
      
      <View style={styles.toggleContainer}>
        {/* 蓝图编辑器按钮 */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.leftButton,
            currentMode === 'blueprint' && styles.activeButton
          ]}
          onPress={() => handleModeChange('blueprint')}
        >
          <Text style={[
            styles.buttonText,
            currentMode === 'blueprint' && styles.activeButtonText
          ]}>
            蓝图
          </Text>
        </TouchableOpacity>

        {/* 画布编辑器按钮 */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.centerButton,
            currentMode === 'canvas' && styles.activeButton
          ]}
          onPress={() => handleModeChange('canvas')}
        >
          <Text style={[
            styles.buttonText,
            currentMode === 'canvas' && styles.activeButtonText
          ]}>
            画布
          </Text>
        </TouchableOpacity>

        {/* 预留模式按钮 */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.rightButton,
            currentMode === 'reserved' && styles.activeButton
          ]}
          onPress={() => handleModeChange('reserved')}
          disabled={true} // 暂时禁用
        >
          <Text style={[
            styles.buttonText,
            styles.disabledText,
            currentMode === 'reserved' && styles.activeButtonText
          ]}>
            预留
          </Text>
        </TouchableOpacity>
      </View>

      {/* 当前模式指示器 */}
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          当前: {
            currentMode === 'blueprint' ? '蓝图编辑器' :
            currentMode === 'canvas' ? '画布编辑器' :
            '预留模式'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16
  },

  label: {
    fontSize: 11,
    color: '#cccccc',
    marginBottom: 4,
    textAlign: 'center'
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#3e3e42',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
    overflow: 'hidden'
  },

  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: '#555'
  },

  leftButton: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5
  },

  centerButton: {
    // 中间按钮无特殊样式
  },

  rightButton: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderRightWidth: 0
  },

  activeButton: {
    backgroundColor: '#007acc'
  },

  buttonText: {
    fontSize: 12,
    color: '#cccccc',
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 40
  },

  activeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },

  disabledText: {
    color: '#666666'
  },

  indicator: {
    marginTop: 4
  },

  indicatorText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center'
  }
});