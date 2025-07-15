import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useStore } from "react-redux";
import { WebGLRenderer } from "../../../core/2d/webgl-renderer";
import { physicsWorld } from '../../../core/physics';
import planck from 'planck-js';
import { addEntity, removeEntity, selectEntity, updateEntity } from "../../../core/actions";
import { PhysicsComponent, SceneCompositionMode } from '../../../core/types';
import { Entity } from "../../../core/types";
import { RootState } from "../../../core/types";
import  ResourceManager  from "../../../core/resources/ResourceManager";

interface CanvasProps {
  resourceManager: ResourceManager;
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  tips: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  tipsText: {
    color: "#000",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

const Canvas: React.FC<CanvasProps> = ({ resourceManager }) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 使用store引用而不是useSelector来避免渲染循环
  const store = useStore<RootState>();

  // 使用memoized selector避免不必要的重渲染
  const sceneData = useSelector((state: RootState) => ({
    sceneComposition: state.editor.sceneComposition,
    scenes: state.editor.scenes,
    currentSceneId: state.editor.currentSceneId
  }), (left, right) => {
    return (
      left.sceneComposition === right.sceneComposition &&
      left.scenes === right.scenes &&
      left.currentSceneId === right.currentSceneId
    );
  });

  const { sceneComposition, scenes, currentSceneId } = sceneData;
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>();

  // 获取点击位置的实体（复用点击检测逻辑）
  const getEntityAtPosition = (clientX: number, clientY: number): Entity | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const clickX = (clientX - rect.left) * pixelRatio;
    const clickY = (clientY - rect.top) * pixelRatio;

    // 使用新的场景组合实体获取方法
    const entities = getRenderEntities();
    return Object.values(entities).find((entity: Entity) => {
      const { position, properties } = entity;
      const left = position.x;
      const right = position.x + properties.width;
      const top = position.y;
      const bottom = position.y + properties.height;

      // 添加1像素容差，避免边缘点击失效
      return (
        clickX >= left - 1 &&
        clickX <= right + 1 &&
        clickY >= top - 1 &&
        clickY <= bottom + 1
      );
    }) || null;
  };

  // 鼠标按下处理（开始拖拽）
  const handleMouseDown = (event: React.MouseEvent) => {
    const clickedEntity = getEntityAtPosition(event.clientX, event.clientY);

    if (clickedEntity) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const clickX = (event.clientX - rect.left) * pixelRatio;
      const clickY = (event.clientY - rect.top) * pixelRatio;

      // 计算鼠标位置与实体左上角的偏移量
      setDragOffset({
        x: clickX - clickedEntity.position.x,
        y: clickY - clickedEntity.position.y
      });

      setDraggingEntityId(clickedEntity.id);
      // 修复：无论拖拽还是点击都应派发 selectEntity
      if (clickedEntity.id !== draggingEntityId) {
        dispatch(selectEntity(clickedEntity.id));
      }
    } else {
      // 点击空白处时取消选中
      dispatch(selectEntity(null));
    }
  };

  // 鼠标移动处理（更新位置）
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggingEntityId || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const newX = (event.clientX - rect.left) * pixelRatio - dragOffset.x;
    const newY = (event.clientY - rect.top) * pixelRatio - dragOffset.y;

    // 判断实体是否有物理组件
    const entities = getRenderEntities();
    const entity = entities[draggingEntityId];
    if (!entity) return;
    const hasPhysics = entity.components.some(c => c.type === 'physics');
    // 只有 sprite 且有物理体时优先操作物理体
    if (entity.type === 'sprite' && hasPhysics) {
      const body = (physicsWorld as any).bodies?.get?.(draggingEntityId);
      if (body) {
        body.setPosition({ x: newX, y: newY });
        body.setLinearVelocity(planck.Vec2(0, 0));
        body.setAwake(true);
        return;
      }
    }
    // 其它情况（包括 UI 组件/无物理体 sprite），始终 updateEntity
    let newProperties: any = {};
    if (entity.type === 'sprite') {
      const { width, height, color, texture, angle } = entity.properties as any;
      newProperties = {
        width,
        height,
        color: Array.isArray(color) && color.length === 4 ? color : [1,1,1,1],
        ...(texture !== undefined ? { texture } : {}),
        ...(angle !== undefined ? { angle } : {})
      };
    } else if (entity.type === 'ui-button' || entity.type === 'ui-input' || entity.type === 'ui-text') {
      const { width, height, color, backgroundType, texture, text, textColor, fontSize, textAlign } = entity.properties as any;
      newProperties = {
        width,
        height,
        color: Array.isArray(color) && color.length === 4 ? color : [0.9,0.9,0.9,1],
        backgroundType: backgroundType || 'color',
        ...(texture !== undefined ? { texture } : {}),
        ...(text !== undefined ? { text } : {}),
        ...(textColor !== undefined ? { textColor } : {}),
        ...(fontSize !== undefined ? { fontSize } : {}),
        ...(textAlign !== undefined ? { textAlign } : {})
      };
    }
    dispatch(updateEntity(draggingEntityId, {
      position: { x: newX, y: newY },
      properties: newProperties
    }));
  };

  // 鼠标松开处理（结束拖拽）
  const handleMouseUp = () => {
    setDraggingEntityId(null);
  };

  // 右键选择并删除实体
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    // 获取点击的实体
    const clickedEntity = getEntityAtPosition(event.clientX, event.clientY);

    if (clickedEntity) {
      dispatch(removeEntity(clickedEntity.id));
    }
  };

  // 取消点击空白处创建实体逻辑，改为支持拖拽创建

  // 支持拖拽组件到canvas创建实体
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('component-type');
    if (!type) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // 将CSS像素转换为物理像素（匹配WebGL坐标系）
    const x = (event.clientX - rect.left) * pixelRatio;
    const y = (event.clientY - rect.top) * pixelRatio;
    // 默认属性
    let entity: Entity;
    // 统一用 createDefaultEntity，保证 UI 组件 color 字段和所有属性有默认值
    // 并且 position 用拖拽点覆盖
    // @ts-ignore
    const { createDefaultEntity } = require("../../../core/types");
    if (type === 'sprite' || type === 'ui-button' || type === 'ui-input' || type === 'ui-text') {
      entity = createDefaultEntity(`entity-${Date.now()}`, type);
      // 将实体放置在拖拽位置的中心
      entity.position = {
        x: x - entity.properties.width / 2,
        y: y - entity.properties.height / 2
      };

      // 实体创建完成，坐标已转换
      // 类型安全兜底，防止 UI/sprite 字段互相污染
      if (type === 'sprite') {
        // 只保留 sprite 合法字段
        const { width, height, color, texture, angle } = entity.properties as any;
        let safeColor: [number, number, number, number] = [1,1,1,1];
        if (Array.isArray(color) && color.length === 4 && color.every(v => typeof v === 'number')) {
          safeColor = [color[0], color[1], color[2], color[3]];
        }
        entity.properties = {
          width,
          height,
          color: safeColor,
          ...(texture !== undefined ? { texture } : {}),
          ...(angle !== undefined ? { angle } : {})
        };
      } else {
        // 只保留 UI 合法字段
        const { width, height, color, backgroundType, texture, text, textColor, fontSize, textAlign } = entity.properties as any;
        let safeColor: [number, number, number, number] = [0.9,0.9,0.9,1];
        if (Array.isArray(color) && color.length === 4 && color.every(v => typeof v === 'number')) {
          safeColor = [color[0], color[1], color[2], color[3]];
        }
        // 调试输出color属性
        // eslint-disable-next-line no-console
        // UI组件颜色处理完成
        entity.properties = {
          width,
          height,
          color: safeColor,
          backgroundType: backgroundType || 'color',
          ...(texture !== undefined ? { texture } : {}),
          ...(text !== undefined ? { text } : {}),
          ...(textColor !== undefined ? { textColor } : {}),
          ...(fontSize !== undefined ? { fontSize } : {}),
          ...(textAlign !== undefined ? { textAlign } : {})
        };
      }
    } else {
      return;
    }

    // 实体已添加到状态管理
    dispatch(addEntity(entity));
  };

  // 允许拖拽经过canvas
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // 根据场景组合模式获取需要渲染的实体 - 直接使用函数，不使用useMemo避免依赖问题
  const getRenderEntities = (): Record<string, Entity> => {
    const currentState = store.getState().editor;
    const { mode, selectedScenes, lockedScenes } = currentState.sceneComposition;
    const currentEntities = currentState.entities;
    const allScenes = currentState.scenes;
    const activeSceneId = currentState.currentSceneId;

    switch (mode) {
      case SceneCompositionMode.DEFAULT:
        // 默认模式：只渲染当前活动的实体
        return currentEntities;

      case SceneCompositionMode.OVERLAY:
        // 叠加模式：合并选中场景的实体 + 当前活动实体
        const overlayEntities: Record<string, Entity> = {};


        // 添加选中场景的实体
        selectedScenes.forEach(sceneId => {
          if (allScenes[sceneId]) {
            const sceneEntities = allScenes[sceneId].entities;

            Object.keys(sceneEntities).forEach(entityId => {
              // 如果是当前场景，直接使用当前实体（避免过期数据）
              if (sceneId === activeSceneId) {
                if (currentEntities[entityId]) {
                  overlayEntities[entityId] = currentEntities[entityId];
                }
              } else {
                // 其他场景的实体加前缀避免ID冲突
                const prefixedId = `scene_${sceneId}_${entityId}`;
                overlayEntities[prefixedId] = {
                  ...sceneEntities[entityId],
                  id: prefixedId
                };
              }
            });
          } else {
          }
        });

        // 确保当前场景的实体也包含在内（如果当前场景不在选中列表中）
        if (!selectedScenes.includes(activeSceneId || '')) {
          Object.assign(overlayEntities, currentEntities);
        }

        return overlayEntities;

      case SceneCompositionMode.MIXED:
        // 混合模式：当前实体 + 锁定场景的实体
        const mixedEntities: Record<string, Entity> = {};

        // 先添加当前活动的实体
        Object.assign(mixedEntities, currentEntities);

        const lockedSceneIds = Object.keys(lockedScenes).filter(id => lockedScenes[id]);

        // 再添加锁定场景的实体
        lockedSceneIds.forEach(sceneId => {
          if (allScenes[sceneId] && sceneId !== activeSceneId) {
            const sceneEntities = allScenes[sceneId].entities;

            Object.keys(sceneEntities).forEach(entityId => {
              // 给锁定场景的实体加前缀避免ID冲突
              const prefixedId = `locked_${sceneId}_${entityId}`;
              mixedEntities[prefixedId] = {
                ...sceneEntities[entityId],
                id: prefixedId
              };
            });
          } else if (sceneId === activeSceneId) {
            console.log(`MIXED: Skipping current scene ${sceneId} (already added)`);
          } else {
            console.log(`MIXED: Scene ${sceneId} not found in allScenes`);
          }
        });

        return mixedEntities;

      default:
        return currentEntities;
    }
  };

  // 多属性关键帧插值函数
  function lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
  }

  function lerpColor(a: [number, number, number, number], b: [number, number, number, number], t: number): [number, number, number, number] {
    return [0, 1, 2, 3].map(i => lerp(a[i], b[i], t)) as [number, number, number, number];
  }

  function interpolateFrame(keyframes: any[], t: number) {
    if (!keyframes || keyframes.length === 0) return undefined;

    // 检查关键帧数据格式
    let prev = keyframes[0];
    let next = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
        prev = keyframes[i];
        next = keyframes[i + 1];
        break;
      }
    }

    if (prev === next) return prev;

    const ratio = (t - prev.time) / (next.time - prev.time);

    // 处理简单数值关键帧（来自TimelineKeyframeEditor）
    if (typeof prev.value === 'number' && typeof next.value === 'number') {
      return {
        time: t,
        value: lerp(prev.value, next.value, ratio)
      };
    }

    // 处理复杂对象关键帧（旧格式兼容）
    if (prev.position && next.position) {
      // 合成 text 字段，若关键帧未设置则为 undefined
      let text;
      if ('text' in prev && 'text' in next) {
        // 若前后帧 text 相同则直接用，否则插值时取靠近当前时间的
        if (prev.text === next.text) {
          text = prev.text;
        } else {
          text = ratio < 0.5 ? prev.text : next.text;
        }
      }

      return {
        time: t,
        position: {
          x: lerp(prev.position?.x || 0, next.position?.x || 0, ratio),
          y: lerp(prev.position?.y || 0, next.position?.y || 0, ratio)
        },
        width: lerp(prev.width || 0, next.width || 0, ratio),
        height: lerp(prev.height || 0, next.height || 0, ratio),
        color: prev.color && next.color ? lerpColor(prev.color, next.color, ratio) : (prev.color || next.color),
        texture: ratio < 0.5 ? prev.texture : next.texture,
        ...(text !== undefined ? { text } : {})
      };
    }

    // 默认返回原始帧
    return prev;
  }

  // 多轨动画插值函数
  function interpolateMultiTrackFrame(keyframes: any[], t: number) {
    if (!keyframes || keyframes.length === 0) return undefined;

    // 找到时间区间
    let prev = keyframes[0];
    let next = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
        prev = keyframes[i];
        next = keyframes[i + 1];
        break;
      }
    }

    if (prev === next || prev.time === next.time) return prev;

    const ratio = (t - prev.time) / (next.time - prev.time);
    const result: any = { time: t };

    // 插值所有属性
    Object.keys(prev).forEach(key => {
      if (key === 'time') return;

      const prevVal = prev[key];
      const nextVal = next[key];

      if (prevVal === undefined && nextVal === undefined) return;
      if (prevVal === undefined) { result[key] = nextVal; return; }
      if (nextVal === undefined) { result[key] = prevVal; return; }

      // 数值插值
      if (typeof prevVal === 'number' && typeof nextVal === 'number') {
        result[key] = lerp(prevVal, nextVal, ratio);
      }
      // 颜色数组插值
      else if (Array.isArray(prevVal) && Array.isArray(nextVal) && prevVal.length === 4 && nextVal.length === 4) {
        result[key] = lerpColor(
          prevVal as [number, number, number, number],
          nextVal as [number, number, number, number],
          ratio
        );
      }
      // 字符串属性（如texture）：取更接近的值
      else if (typeof prevVal === 'string' || typeof nextVal === 'string') {
        result[key] = ratio < 0.5 ? prevVal : nextVal;
      }
      // 其他类型直接取前一个值
      else {
        result[key] = prevVal;
      }
    });

    return result;
  }

  // 初始化WebGL渲染器
  useEffect(() => {
    // 初始化物理世界（仅一次）
    if (!physicsWorld.isInitialized()) {
      physicsWorld.initialize({ x: 0, y: 10 });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new WebGLRenderer(resourceManager);
    let animationId: number;

    // 缓存上一次的dispatch状态，避免重复dispatch
    let lastDispatchTime = 0;
    const DISPATCH_THROTTLE = 16; // ~60fps, 只在需要时dispatch

    const start = async () => {
      await renderer.initialize(canvas);
      rendererRef.current = renderer;
      // WebGLRenderer 初始化完成

      let lastTime = performance.now();
      const loop = (now: number) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        // 调整画布尺寸
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * pixelRatio;
        canvas.height = canvas.clientHeight * pixelRatio;

        // 步进物理世界
        const currentState = store.getState().editor;
        const physicsRunning = currentState.physicsRunning;
        if (physicsRunning) physicsWorld.step(delta);

        // 获取需要渲染的实体并处理物理同步
        const renderEntities = getRenderEntities();
        const entities = Object.values(renderEntities);
        const animations = currentState.animations;

        // 限制dispatch频率，避免无限循环
        const shouldDispatch = (now - lastDispatchTime) > DISPATCH_THROTTLE;

        // ...existing code for physics and animation processing...
        // 自动创建/同步/销毁物理体
        const existingBodyIds = new Set(Array.from((physicsWorld as any).bodies?.keys?.() || []));
        entities.forEach((entity: Entity) => {
          // 深拷贝 entity，防止 state mutation
          const entityCopy: Entity = JSON.parse(JSON.stringify(entity));
          const physicsComp = entityCopy.components.find(c => c.type === 'physics') as PhysicsComponent | undefined;
          const hasBody = (physicsWorld as any).bodies?.has?.(entityCopy.id);

          // 仅有物理组件的实体才参与物理体创建/同步/销毁
          if (physicsComp) {
            // 用于缓存上一次的物理属性
            if (!(window as any)._entityPhysicsCache) (window as any)._entityPhysicsCache = {};
            const cache = (window as any)._entityPhysicsCache;
            const keyProps = [physicsComp.bodyType, physicsComp.density, physicsComp.friction, physicsComp.restitution, physicsComp.fixedRotation].join(',');

            if (!hasBody || cache[entityCopy.id] !== keyProps) {
              // 属性变更或无物理体时，重建物理体
              if (hasBody) (physicsWorld as any).destroyBody(entityCopy.id);
              const safeY = Math.max(entityCopy.position.y, 10);
              const def: any = {
                type: physicsComp.bodyType || 'dynamic',
                position: { x: entityCopy.position.x, y: safeY },
                angle: (entityCopy.type === 'sprite' && 'angle' in entityCopy.properties) ? (entityCopy.properties as any).angle || 0 : 0,
                fixedRotation: !!physicsComp.fixedRotation
              };
              const body = (physicsWorld as any).createBody(def, { id: entityCopy.id });
              const w = entityCopy.properties.width / 2;
              const h = entityCopy.properties.height / 2;
              body.createFixture(planck.Box(w, h), {
                density: physicsComp.density,
                friction: physicsComp.friction,
                restitution: physicsComp.restitution
              });
              cache[entityCopy.id] = keyProps;
            }

            // 同步物理体到实体
            const body = (physicsWorld as any).bodies.get(entityCopy.id);
            if (body && shouldDispatch) {
              physicsWorld.syncEntityFromBody(entityCopy, body);
              dispatch(updateEntity(entityCopy.id, {
                position: { ...entityCopy.position },
                properties: { ...entityCopy.properties }
              }));
            }
            existingBodyIds.delete(entityCopy.id);
          } else if (hasBody) {
            (physicsWorld as any).destroyBody(entityCopy.id);
            if ((window as any)._entityPhysicsCache) {
              delete (window as any)._entityPhysicsCache[entityCopy.id];
            }
          }
        });

        // 清理已被删除的实体对应的物理体
        existingBodyIds.forEach(id => {
          (physicsWorld as any).destroyBody(id);
        });

        // 处理动画关键帧插值
        entities.forEach((entity: Entity) => {
          if (entity.animation && entity.animation.playing && entity.animation.currentAnimation) {
            const animName = entity.animation.currentAnimation;
            const anim = animations[animName];
            const newTime = entity.animation.currentTime + delta;
            let shouldStop = false;
            let maxTime: number = newTime;

            console.log(`处理实体 ${entity.id} 的动画 ${animName}，当前时间: ${entity.animation.currentTime.toFixed(2)}s，新时间: ${newTime.toFixed(2)}s`);

            if (anim && anim.keyframes && anim.keyframes.length > 0) {
              // 处理多轨动画格式（来自TimelineKeyframeEditor）
              if (anim.propertyName === 'multi-track') {
                // 多轨动画：keyframes是按时间点合并的数据
                maxTime = anim.duration || 10; // 使用保存的持续时间
                console.log(`多轨动画 ${animName}，持续时间: ${maxTime}s，关键帧数量: ${anim.keyframes.length}`);

                // 循环播放逻辑
                const isLoop = !!entity.animation.loop;
                let safeTime = newTime;
                let nextPlaying = true;

                if (newTime >= maxTime) {
                  console.log(`动画 ${animName} 到达结束时间，循环模式: ${isLoop}`);
                  if (isLoop) {
                    // 循环播放：重置时间到开始
                    safeTime = newTime % maxTime;
                    nextPlaying = true;
                  } else {
                    // 非循环：停止在最后一帧
                    safeTime = maxTime;
                    nextPlaying = false;
                  }
                }

                // 从合并的关键帧数据中插值所有属性
                const frame = interpolateMultiTrackFrame(anim.keyframes, safeTime);
                if (frame && shouldDispatch) {
                  // 批量更新实体的所有动画属性
                  let updatedEntity = { ...entity };

                  // 应用各种属性的动画值
                  if (frame['position.x'] !== undefined) {
                    updatedEntity.position = { ...updatedEntity.position, x: frame['position.x'] };
                  }
                  if (frame['position.y'] !== undefined) {
                    updatedEntity.position = { ...updatedEntity.position, y: frame['position.y'] };
                  }
                  if (frame.width !== undefined) {
                    updatedEntity.properties = { ...updatedEntity.properties, width: frame.width };
                  }
                  if (frame.height !== undefined) {
                    updatedEntity.properties = { ...updatedEntity.properties, height: frame.height };
                  }
                  if (frame.color !== undefined) {
                    updatedEntity.properties = { ...updatedEntity.properties, color: frame.color };
                  }
                  // 暂时跳过rotation属性，因为类型定义中没有
                  // if (frame.rotation !== undefined) {
                  //   updatedEntity.properties = { ...updatedEntity.properties, rotation: frame.rotation };
                  // }
                  if (frame.texture !== undefined) {
                    updatedEntity.properties = { ...updatedEntity.properties, texture: frame.texture };
                  }

                  // 使用dispatch更新实体状态
                  if (shouldDispatch) {
                    dispatch(updateEntity(entity.id, {
                      position: updatedEntity.position,
                      properties: updatedEntity.properties
                    }));

                    // 更新动画状态
                    dispatch({
                      type: 'UPDATE_ENTITY_ANIMATION',
                      payload: {
                        entityId: entity.id,
                        animation: {
                          ...entity.animation,
                          currentTime: safeTime,
                          playing: nextPlaying,
                        }
                      }
                    });
                  }
                }
              } else {
                // 处理旧格式：按属性分离的关键帧
                maxTime = anim.keyframes[anim.keyframes.length - 1].time;

                // 循环播放逻辑
                const isLoop = !!entity.animation.loop;
                let safeTime = newTime;
                let nextPlaying = true;

                if (newTime >= maxTime) {
                  if (isLoop) {
                    // 循环播放：重置时间到开始
                    safeTime = 0;
                    nextPlaying = true;
                  } else {
                    // 非循环：停止在最后一帧
                    safeTime = maxTime;
                    nextPlaying = false;
                  }
                }

                const frame = interpolateFrame(anim.keyframes, safeTime);
                if (frame && frame.value !== undefined && shouldDispatch) {
                  // 应用具体属性的动画值
                  let updates: any = {
                    animation: {
                      ...entity.animation,
                      currentTime: safeTime,
                      playing: nextPlaying
                    }
                  };

                  switch (anim.propertyName) {
                    case 'position.x':
                      updates.position = {
                        ...entity.position,
                        x: frame.value
                      };
                      break;
                    case 'position.y':
                      updates.position = {
                        ...entity.position,
                        y: frame.value
                      };
                      break;
                    case 'scale.x':
                      // 需要在实体上添加scale属性支持
                      updates.scale = {
                        x: frame.value,
                        y: (entity as any).scale?.y || 1
                      };
                      break;
                    case 'scale.y':
                      updates.scale = {
                        x: (entity as any).scale?.x || 1,
                        y: frame.value
                      };
                      break;
                    case 'rotation':
                      updates.rotation = frame.value;
                      break;
                  }

                  dispatch(updateEntity(entity.id, updates));
                }
              }
            } else if (shouldDispatch && entity.animation && entity.animation.playing) {
              // 只推进时间，但仅在动画播放时
              // 注意：这里只有在没有动画数据但动画状态为播放中时才执行
              console.log(`实体 ${entity.id} 的动画 ${entity.animation.currentAnimation} 没有找到动画数据`);
              dispatch({
                type: 'UPDATE_ENTITY_ANIMATION',
                payload: {
                  entityId: entity.id,
                  animation: {
                    ...entity.animation,
                    currentTime: entity.animation.currentTime + delta,
                    playing: entity.animation.playing // 保持原有的播放状态
                  }
                }
              });
            }
          } else if (entity.animation && entity.animation.playing) {
            console.log(`实体 ${entity.id} 动画状态异常: playing=${entity.animation.playing}, currentAnimation=${entity.animation.currentAnimation}`);
          }
        });

        // 更新dispatch时间戳
        if (shouldDispatch) {
          lastDispatchTime = now;
        }

        // 构建渲染状态
        const entityAnimationState = entities.reduce((acc, e) => {
          acc[e.id] = { currentAnimation: e.animation?.currentAnimation, currentTime: e.animation?.currentTime || 0 };
          return acc;
        }, {} as Record<string, { currentAnimation?: string; currentTime: number }>);

        rendererRef.current?.render(entities, animations, entityAnimationState);

        // 下一帧
        animationId = requestAnimationFrame(loop);
        animationIdRef.current = animationId;
      };

      animationId = requestAnimationFrame(loop);
      animationIdRef.current = animationId;
    };

    start();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      renderer.cleanup();
    };
  }, [resourceManager]); // 移除getRenderEntities依赖，避免循环

  return (
    <View style={styles.root}>
      {/* 画布区域 */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          cursor: draggingEntityId ? "grabbing" : "default"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
      {/* 操作提示 */}
      <View style={styles.tips} pointerEvents="none">
        <Text style={styles.tipsText}>
          {draggingEntityId ? "拖拽中..." : "点击添加实体 | 点击实体选中 | 拖拽移动实体"}
        </Text>
      </View>
    </View>
  );
}

export default Canvas;
