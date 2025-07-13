import { configureStore, Middleware, combineReducers } from '@reduxjs/toolkit';
import { editorReducer } from '../core/reducer';
import { projectReducer } from '../core/reducers/projectReducer';
import { CrossPlatformStorage } from '../core/utils/CrossPlatformStorage';

// 初始化时不直接加载，而是使用默认状态
// 场景数据将在应用启动后异步加载

const initialState = {
  entities: {},
  selectedEntityId: null,
  textures: [],
  animations: {},
  physicsRunning: true,
  // 使用默认场景，实际数据将在应用启动后异步加载
  scenes: {
    'default': {
      id: 'default',
      name: '默认场景',
      entities: {},
      animations: {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityCount: 0
      }
    }
  },
  currentSceneId: 'default',
  sceneHistory: ['default']
};

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

// 组合所有 reducers
const rootReducer = combineReducers({
  editor: editorReducer,
  projects: projectReducer,
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
    }).concat(sceneAutoSaveMiddleware),
  devTools: process.env.NODE_ENV !== 'production'
});

// 导出类型
export type AppDispatch = typeof store.dispatch;
