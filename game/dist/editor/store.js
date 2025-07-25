import { configureStore } from '@reduxjs/toolkit';
import { editorReducer } from '../core/reducer';
import { SceneStorage } from '../core/utils/sceneStorage';
// 从本地存储加载场景数据
const loadedScenes = SceneStorage.loadFromLocalStorage();
const initialState = {
    entities: {},
    selectedEntityId: null,
    textures: [],
    animations: {},
    physicsRunning: true,
    // 如果有保存的场景数据则使用，否则使用默认场景
    scenes: loadedScenes || {
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
    currentSceneId: loadedScenes ? Object.keys(loadedScenes)[0] : 'default',
    sceneHistory: loadedScenes ? [Object.keys(loadedScenes)[0]] : ['default']
};
// 场景自动保存中间件
const sceneAutoSaveMiddleware = (store) => (next) => (action) => {
    const result = next(action);
    // 在场景相关操作后自动保存到localStorage
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
            SceneStorage.saveToLocalStorage(state.scenes);
        }, 500);
    }
    return result;
};
// 配置store
export const store = configureStore({
    reducer: editorReducer,
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // 忽略某些action的序列化检查
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            // 忽略某些path的序列化检查
            ignoredPaths: ['register', 'rehydrate']
        }
    }).concat(sceneAutoSaveMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
});
//# sourceMappingURL=store.js.map