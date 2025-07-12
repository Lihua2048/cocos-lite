// 动画关键帧相关
export const saveAnimation = (name, propertyName, keyframes) => ({
    type: 'SAVE_ANIMATION',
    payload: { name, propertyName, keyframes }
});
export const ADD_ENTITY = "ADD_ENTITY";
export const REMOVE_ENTITY = "REMOVE_ENTITY";
export const SELECT_ENTITY = "SELECT_ENTITY";
export const UPDATE_ENTITY = "UPDATE_ENTITY";
export const ADD_TEXTURE = "ADD_TEXTURE";
// 动画相关action类型
export const UPDATE_ENTITY_TEXTURE = "UPDATE_ENTITY_TEXTURE";
export const PLAY_ANIMATION = 'PLAY_ANIMATION';
export const PAUSE_ANIMATION = 'PAUSE_ANIMATION';
export const STOP_ANIMATION = 'STOP_ANIMATION';
// 场景相关
export const createScene = (id, name) => ({
    type: 'CREATE_SCENE',
    payload: { id, name }
});
export const deleteScene = (sceneId) => ({
    type: 'DELETE_SCENE',
    payload: sceneId
});
export const switchScene = (sceneId) => ({
    type: 'SWITCH_SCENE',
    payload: sceneId
});
export const saveCurrentScene = () => ({
    type: 'SAVE_CURRENT_SCENE'
});
export const renameScene = (id, newName) => ({
    type: 'RENAME_SCENE',
    payload: { id, newName }
});
// 物理运行/暂停
export const setPhysicsRunning = (running) => ({
    type: "SET_PHYSICS_RUNNING",
    payload: running,
});
// 添加物理组件
export const addPhysicsComponent = (entityId, component) => ({
    type: "ADD_PHYSICS_COMPONENT",
    payload: { entityId, component },
});
// 移除物理组件
export const removePhysicsComponent = (entityId) => ({
    type: "REMOVE_PHYSICS_COMPONENT",
    payload: { entityId },
});
// 更新物理组件
export const updatePhysicsComponent = (entityId, updates) => ({
    type: "UPDATE_PHYSICS_COMPONENT",
    payload: { entityId, updates },
});
export const addEntity = (entity) => ({
    type: "ADD_ENTITY",
    payload: entity,
});
export const removeEntity = (id) => ({
    type: "REMOVE_ENTITY",
    payload: { id },
});
export const selectEntity = (id) => ({
    type: "SELECT_ENTITY",
    payload: id,
});
export const updateEntity = (id, updates) => ({
    type: "UPDATE_ENTITY",
    payload: { id, updates },
});
export const updateEntityProperty = (id, property, value) => {
    // 只允许受支持的属性
    const allowedPosition = ["position.x", "position.y", "x", "y"];
    // 扩展支持 UI 组件所有属性
    const allowedProperties = [
        "width", "height", "color", "texture",
        "text", "textColor", "fontSize", "backgroundType", "textAlign"
    ];
    if (typeof property === 'string' && allowedPosition.includes(property)) {
        // 支持 position.x/y
        const axis = property.endsWith('.x') ? 'x' : property.endsWith('.y') ? 'y' : property;
        return updateEntity(id, {
            position: {
                [axis]: value,
            },
        });
    }
    else if (typeof property === 'string' && allowedProperties.includes(property)) {
        // 支持 width/height/color/texture
        return updateEntity(id, {
            properties: {
                [property]: value,
            },
        });
    }
    else {
        // 不支持的属性直接忽略
        return { type: "IGNORE_UPDATE_ENTITY_PROPERTY" };
    }
};
export const addTexture = (texture) => ({
    type: ADD_TEXTURE,
    payload: texture,
});
export const updateEntityTexture = (entityId, textureId) => ({
    type: "UPDATE_ENTITY_TEXTURE",
    payload: { entityId, textureId },
});
export const playAnimation = (entityId, name, loop) => ({
    type: "PLAY_ANIMATION",
    payload: { entityId, name, ...(typeof loop === 'boolean' ? { loop } : {}) }
});
export const pauseAnimation = (entityId) => ({
    type: "PAUSE_ANIMATION",
    payload: { entityId }
});
export const stopAnimation = (entityId) => ({
    type: "STOP_ANIMATION",
    payload: { entityId }
});
//# sourceMappingURL=actions.js.map