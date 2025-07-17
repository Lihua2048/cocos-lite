import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./editor/store";
import { RootState, SceneCompositionMode } from "./core/types";
import { loadSavedState } from "./core/actions";
import { AutoSave } from "./core/utils/autoSave";

import Canvas from "./editor/components/canvas/Canvas";
import PropertiesPanel from "./editor/components/properties/PropertiesPanel";
import EntityListPane from "./editor/components/resources/EntityListPanel";
import ResourceManager from "./core/resources/ResourceManager";
import ResourceManagerPanel from "./editor/components/resources/ResourceManagerPanel";
import UnifiedToolbar from "./editor/components/toolbar/UnifiedToolbar";
import ComponentPalette from "./editor/components/ComponentPalette";
import BlueprintNodeEditor from "./editor/components/BlueprintNodeEditor";
import EditorModeToggle from "./editor/components/EditorModeToggle";

// 第二期核心功能导入
import {
  phase2CoreManager,
  defaultPhase2Config,
  type ProjectStats
} from "./core/phase2/Phase2CoreManager";
import SceneAsyncLoader from "./core/utils/SceneAsyncLoader";
import NewSceneManagerPanel from "./editor/components/scene/NewSceneManagerPanel";
import NewProjectSelectorPanel from "./editor/components/project/NewProjectSelectorPanel";
import { BuildManagerPanel } from "./build/BuildManagerPanel";
import SceneCompositionEditor from "./editor/components/scene/SceneCompositionEditor";
import SceneCompositionModeSelector from "./editor/components/scene/SceneCompositionModeSelector";

export default function App() {
  const resourceManager = useRef(new ResourceManager());
  const [phase2Initialized, setPhase2Initialized] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [scenesLoaded, setScenesLoaded] = useState(false);

  return (
    <Provider store={store}>
      <AppContent resourceManager={resourceManager.current} />
    </Provider>
  );
}

function AppContent({ resourceManager }: { resourceManager: ResourceManager }) {
  const dispatch = useDispatch();
  const [phase2Initialized, setPhase2Initialized] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [scenesLoaded, setScenesLoaded] = useState(false);
  const [stateLoaded, setStateLoaded] = useState(false);

  // 加载保存的状态
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AutoSave.loadEditorState();
        if (savedState) {
          dispatch(loadSavedState(savedState));
          console.log('已加载保存的编辑器状态');
        }
      } catch (error) {
        console.error('加载保存状态失败:', error);
      } finally {
        setStateLoaded(true);
      }
    };

    loadState();
  }, [dispatch]);

  // 获取场景组合模式状态和编辑器模式
  const { compositionMode, sceneComposition, editorMode, blueprintEditor } = useSelector((state: RootState) => ({
    compositionMode: state.editor.sceneComposition.mode,
    sceneComposition: state.editor.sceneComposition,
    editorMode: state.editor.editorMode,
    blueprintEditor: state.editor.blueprintEditor
  }));

  // 调试场景组合状态变化
  useEffect(() => {
    console.log('App: Scene composition state changed:', sceneComposition);
  }, [sceneComposition]);

  // 初始化场景加载和第二期核心功能
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. 首先异步加载场景数据
        const loadStatus = await SceneAsyncLoader.loadScenesAsync();
        setScenesLoaded(loadStatus);

        // 2. 初始化第二期核心管理器
        await phase2CoreManager.initialize(defaultPhase2Config);

        // 3. 注册统计更新回调
        phase2CoreManager.onStatsUpdate(setProjectStats);

        setPhase2Initialized(true);

        // 显示支持的功能
        const features = phase2CoreManager.getSupportedFeatures();

      } catch (error) {
        console.error('❌ Failed to initialize application:', error);
      }
    };

    initializeApp();

    // 清理函数
    return () => {
      phase2CoreManager.offStatsUpdate(setProjectStats);
    };
  }, []);

  // 渲染顶栏 - 包含标题和管理组件
  const renderTopBar = () => {
    return (
      <View style={styles.topBar}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Cocos Creator 第二期编辑器</Text>
          <View style={styles.statusInfo}>
            {!phase2Initialized ? (
              <Text style={styles.loading}>正在初始化...</Text>
            ) : (
              <Text style={styles.ready}>系统就绪</Text>
            )}
            {projectStats && (
              <Text style={styles.stats}>
                场景: {projectStats.scenes.total} | FPS: {projectStats.rendering.frameRate}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.managerSection}>
          <EditorModeToggle />
          <SceneCompositionModeSelector />
          <NewProjectSelectorPanel />
          <NewSceneManagerPanel />
          <BuildManagerPanel />
        </View>
      </View>
    );
  };

  return (
    <Provider store={store}>
      <View style={styles.container}>
        {/* 顶栏 */}
        {renderTopBar()}



        {/* 主工作区 */}
        <View style={styles.mainArea}>
          {editorMode === 'blueprint' ? (
            // 蓝图编辑器模式
            <BlueprintNodeEditor 
              project={blueprintEditor.currentProject || undefined}
              onProjectChange={(project) => {
                dispatch({ type: 'SET_BLUEPRINT_PROJECT', payload: project });
              }}
              onNodeSelect={(nodeIds) => {
                dispatch({ type: 'SELECT_BLUEPRINT_NODES', payload: { nodeIds } });
              }}
            />
          ) : (
            // 画布编辑器模式（原有布局）
            <>
              {/* 左侧面板 */}
              <View style={styles.leftPanel}>
                <ComponentPalette />
                <EntityListPane />
                <ResourceManagerPanel resourceManager={resourceManager} />
              </View>

              {/* 中央画布区域 */}
              <View style={styles.centerPanel}>
                <Canvas resourceManager={resourceManager} />
              </View>

              {/* 右侧属性面板 */}
              <View style={styles.rightPanel}>
                <PropertiesPanel />
              </View>
            </>
          )}
        </View>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    flexDirection: "column",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2d2d30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3e3e42",
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loading: {
    fontSize: 12,
    color: "#ffa726",
  },
  ready: {
    fontSize: 12,
    color: "#4caf50",
  },
  stats: {
    fontSize: 11,
    color: "#cccccc",
  },
  managerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainArea: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: 250,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    flexDirection: "column",
  },
  centerPanel: {
    flex: 1,
    backgroundColor: "#e8e8e8",
  },
  rightPanel: {
    width: 600,
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
  },
});
