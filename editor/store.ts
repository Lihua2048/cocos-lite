import { configureStore, Middleware, combineReducers } from '@reduxjs/toolkit';
import { editorReducerWithAutoSave } from '../core/reducer';
import { projectReducer } from '../core/reducers/projectReducer';
import blueprintReducer from '../core/reducers/blueprintReducer';
import { CrossPlatformStorage } from '../core/utils/CrossPlatformStorage';
import { AutoSave } from '../core/utils/autoSave';

// 初始化时创建默认的main项目和场景
const createInitialState = () => {
  const defaultProjectId = 'main';
  const defaultSceneId = 'main-scene';

  return {
    editor: {
      entities: {},
      selectedEntityId: null,
      textures: [],
      animations: {},
      physicsRunning: true,
      scenes: {
        [defaultSceneId]: {
          id: defaultSceneId,
          name: '主场景',
          entities: {},
          animations: {},
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            entityCount: 0
          }
        }
      },
      currentSceneId: defaultSceneId,
      sceneHistory: [defaultSceneId],
      sceneComposition: {
        mode: 0, // SceneCompositionMode.DEFAULT
        selectedScenes: [],
        lockedScenes: {}
      }
    },
    projects: {
      projects: {
        [defaultProjectId]: {
          id: defaultProjectId,
          name: 'Main Project',
          version: '1.0.0',
          description: '默认主项目',
          created: Date.now(),
          lastModified: Date.now(),
          scenes: {
            [defaultSceneId]: {
              id: defaultSceneId,
              name: '主场景',
              type: 'main' as const,
              layer: 0,
              dependencies: [],
              loadPriority: 1,
              renderMode: 'normal' as const,
              state: 'active' as const,
              lastModified: Date.now(),
              data: {
                id: defaultSceneId,
                name: '主场景',
                entities: {},
                animations: {},
                metadata: {
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  entityCount: 0
                },
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
        }
      },
      currentProjectId: defaultProjectId,
      recentProjects: [defaultProjectId]
    },
    blueprint: {
      nodes: [
        {
          id: 'node_1',
          type: 'input',
          label: '开始节点',
          position: { x: 100, y: 100 },
          inputs: [],
          outputs: ['output'],
          data: {},
          style: {
            backgroundColor: '#4CAF50',
            width: 150,
            height: 80
          }
        },
        {
          id: 'node_2',
          type: 'process',
          label: '处理节点',
          position: { x: 350, y: 100 },
          inputs: ['input'],
          outputs: ['output'],
          data: {},
          style: {
            backgroundColor: '#FF9800',
            width: 150,
            height: 80
          }
        },
        {
          id: 'node_3',
          type: 'output',
          label: '结束节点',
          position: { x: 600, y: 100 },
          inputs: ['input'],
          outputs: [],
          data: {},
          style: {
            backgroundColor: '#2196F3',
            width: 150,
            height: 80
          }
        }
      ],
      connections: [
        {
          id: 'conn_1',
          from: 'node_1',
          to: 'node_2',
          fromPort: 'output',
          toPort: 'input',
          style: {
            color: '#666',
            width: 2
          }
        },
        {
          id: 'conn_2',
          from: 'node_2',
          to: 'node_3',
          fromPort: 'output',
          toPort: 'input',
          style: {
            color: '#666',
            width: 2
          }
        }
      ],
      zoom: 1,
      pan: { x: 0, y: 0 },
      history: {
        past: [],
        future: []
      },
      canUndo: false,
      canRedo: false
    }
  };
};

// 初始化时不直接加载，而是使用默认状态
// 场景数据将在应用启动后异步加载

const initialState = createInitialState().editor;

// 场景自动保存中间件（更新为使用 CrossPlatformStorage）
const sceneAutoSaveMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // 在场景相关操作后自动保存到存储
  const sceneActions = [
    'CREATE_SCENE',
    'DELETE_SCENE',
    'SWITCH_SCENE',
    'SAVE_CURRENT_SCENE',
    'RENAME_SCENE',
    'ADD_ENTITY',
    'REMOVE_ENTITY',
    'UPDATE_ENTITY'
  ];

  if (sceneActions.includes(action.type)) {
    const state = store.getState();
    // 延迟保存，避免频繁写入
    setTimeout(() => {
      CrossPlatformStorage.saveScenes(state.editor.scenes).catch(error => {
        console.error('Failed to auto-save scenes:', error);
      });
    }, 500);
  }

  return result;
};

// 项目自动保存中间件
const projectAutoSaveMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // 在项目相关操作后自动保存到存储
  const projectActions = [
    'CREATE_PROJECT',
    'DELETE_PROJECT',
    'SWITCH_PROJECT',
    'UPDATE_PROJECT'
  ];

  if (projectActions.includes(action.type)) {
    const state = store.getState();
    try {
      CrossPlatformStorage.setItem('projectsData', JSON.stringify(state.projects));
    } catch (error) {
      console.error('Failed to save projects data:', error);
    }
  }

  return result;
};

// 项目切换中间件 - 处理项目切换时的场景数据保存和加载
const projectSwitchMiddleware: Middleware = (store) => (next) => (action: any) => {
  // 在项目切换前，先保存当前项目的所有场景数据到项目配置中
  if (action.type === 'SWITCH_PROJECT' || action.type === 'CREATE_PROJECT') {
    const currentState = store.getState();
    const currentProjectId = currentState.projects.currentProjectId;

    console.log('🔄 项目切换中间件: 准备切换项目', {
      actionType: action.type,
      currentProjectId,
      targetProjectId: action.payload?.projectId
    });

    if (currentProjectId && currentState.projects.projects[currentProjectId]) {
      console.log('💾 项目切换中间件: 保存当前项目场景数据', currentProjectId);
      console.log('💾 当前编辑器场景:', Object.keys(currentState.editor.scenes || {}));

      // 先保存当前场景到编辑器状态
      store.dispatch({ type: 'SAVE_CURRENT_SCENE' });

      // 立即获取最新状态并保存
      const updatedState = store.getState();
      const currentProject = updatedState.projects.projects[currentProjectId];
      const editorScenes = updatedState.editor.scenes || {};

      console.log('💾 保存前的编辑器场景数量:', Object.keys(editorScenes).length);

      // 将编辑器场景数据转换为项目场景配置格式
      const projectScenes: Record<string, any> = {};

      Object.keys(editorScenes).forEach(sceneId => {
        const sceneData = editorScenes[sceneId];
        const existingConfig = currentProject.scenes?.[sceneId];

        console.log('💾 转换场景:', { sceneId, sceneData: !!sceneData, hasEntities: Object.keys(sceneData?.entities || {}).length });

        projectScenes[sceneId] = {
          id: sceneId,
          name: sceneData.name,
          type: existingConfig?.type || 'main',
          layer: existingConfig?.layer || 0,
          dependencies: existingConfig?.dependencies || [],
          loadPriority: existingConfig?.loadPriority || 1,
          renderMode: existingConfig?.renderMode || 'normal',
          state: existingConfig?.state || 'active',
          lastModified: Date.now(),
          data: sceneData // 这里是真正的场景数据
        };
      });

      // 更新项目数据
      store.dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          projectId: currentProjectId,
          updates: {
            scenes: projectScenes,
            sceneGraph: {
              ...currentProject.sceneGraph,
              currentScene: updatedState.editor.currentSceneId || currentProject.sceneGraph.currentScene
            },
            lastModified: Date.now()
          }
        }
      });

      console.log('💾 项目切换中间件: 已保存场景数据到项目', currentProjectId, '场景数量:', Object.keys(projectScenes).length);
    }
  }

  const result = next(action);

  // 处理创建项目后的编辑器状态重置
  if (action.type === 'CREATE_PROJECT') {
    const newProjectId = action.payload.project.id;
    const newSceneId = `${newProjectId}-scene`;

    console.log('🆕 项目切换中间件: 创建新项目后重置编辑器状态', { newProjectId, newSceneId });

    // 为新项目创建默认场景，保持场景ID的一致性
    const newDefaultScene = {
      id: newSceneId,
      name: '主场景',
      entities: {},
      animations: {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityCount: 0
      }
    };

    // 重置编辑器到新项目的初始状态
    store.dispatch({
      type: 'LOAD_PROJECT_DATA',
      payload: {
        scenes: {
          [newSceneId]: newDefaultScene
        },
        currentSceneId: newSceneId
      }
    });
  }

  // 处理项目切换后的场景数据加载
  if (action.type === 'SWITCH_PROJECT') {
    const state = store.getState();
    const projectId = action.payload.projectId;
    const project = state.projects.projects[projectId];

    console.log('📥 项目切换中间件: 准备加载项目数据', { projectId, hasProject: !!project });

    if (project) {
      console.log('📥 项目切换中间件: 切换到项目', project.name);

      const projectSceneConfigs = project.scenes || {};
      const sceneIds = Object.keys(projectSceneConfigs);

      console.log('📥 项目中的场景配置:', { sceneIds, sceneCount: sceneIds.length });

      if (sceneIds.length > 0) {
        // 从项目场景配置中提取真正的场景数据
        const editorScenes: Record<string, any> = {};

        sceneIds.forEach(sceneId => {
          const sceneConfig = projectSceneConfigs[sceneId];
          console.log('📥 检查场景配置:', { sceneId, hasConfig: !!sceneConfig, hasData: !!sceneConfig?.data });

          if (sceneConfig && sceneConfig.data) {
            editorScenes[sceneId] = sceneConfig.data;
            console.log('📥 加载场景数据:', {
              sceneId,
              entitiesCount: Object.keys(sceneConfig.data.entities || {}).length,
              sceneName: sceneConfig.data.name
            });
          } else {
            console.warn('⚠️ 场景配置缺失或无数据:', { sceneId, sceneConfig });
          }
        });

        const currentSceneId = project.sceneGraph?.currentScene || sceneIds[0];
        console.log('📥 项目切换中间件: 准备加载场景数据', {
          editorScenesCount: Object.keys(editorScenes).length,
          currentSceneId,
          availableScenes: Object.keys(editorScenes)
        });

        // 加载转换后的场景数据到编辑器
        store.dispatch({
          type: 'LOAD_PROJECT_DATA',
          payload: {
            scenes: editorScenes,
            currentSceneId: currentSceneId
          }
        });
      } else {
        console.log('📥 项目切换中间件: 空项目，重置编辑器状态');
        // 空项目，重置编辑器状态
        store.dispatch({
          type: 'LOAD_PROJECT_DATA',
          payload: {
            scenes: {},
            currentSceneId: null
          }
        });
      }
    } else {
      console.error('❌ 项目切换中间件: 目标项目不存在', { projectId, availableProjects: Object.keys(state.projects.projects) });
    }
  }

  return result;
};

// 组合所有 reducers
const rootReducer = combineReducers({
  editor: editorReducerWithAutoSave,
  projects: projectReducer,
  blueprint: blueprintReducer,
});

// 更新 RootState 类型
export type RootState = ReturnType<typeof rootReducer>;

// 配置store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些action的序列化检查
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // 忽略某些path的序列化检查
        ignoredPaths: ['register', 'rehydrate']
      }
    }).concat(sceneAutoSaveMiddleware, projectAutoSaveMiddleware, projectSwitchMiddleware),
  devTools: process.env.NODE_ENV !== 'production'
});

// 在store创建后初始化默认项目数据
const initializeDefaultProject = () => {
  const currentState = store.getState();
  console.log('🚀 初始化默认项目: 当前状态', {
    hasCurrentProject: !!currentState.projects.currentProjectId,
    projectsCount: Object.keys(currentState.projects.projects).length
  });

  if (!currentState.projects.currentProjectId) {
    const initialData = createInitialState();
    console.log('🚀 初始化默认项目: 创建初始数据', {
      projectsCount: Object.keys(initialData.projects.projects).length,
      scenesInMainProject: Object.keys(initialData.projects.projects.main?.scenes || {}).length
    });

    store.dispatch({ type: 'LOAD_PROJECTS', payload: { projects: initialData.projects.projects } });
    store.dispatch({ type: 'SWITCH_PROJECT', payload: { projectId: 'main' } });

    console.log('🚀 初始化默认项目: 完成');
  } else {
    console.log('🚀 初始化默认项目: 跳过，已有当前项目', currentState.projects.currentProjectId);
  }
};

// 初始化
setTimeout(initializeDefaultProject, 0);

// 导出类型
export type AppDispatch = typeof store.dispatch;
