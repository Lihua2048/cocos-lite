import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useStore } from "react-redux";
import { WebGLRenderer } from "../../../core/2d/webgl-renderer";
import { physicsWorld } from '../../../core/physics';
import planck from 'planck-js';
import { addEntity, removeEntity, selectEntity, updateEntity } from "../../../core/actions";
import { PhysicsComponent } from '../../../core/types';
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
    pointerEvents: "none",
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

  // 只在初始渲染时获取，后续每帧用 store.getState()
  const store = useStore<RootState>();
  const animations = useSelector((state: RootState) => state.editor.animations);
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

    // 每次都用最新 entities
    const entities: Record<string, Entity> = store.getState().editor.entities;
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
    const entities: Record<string, Entity> = store.getState().editor.entities;
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

  // 多属性关键帧插值函数
  function lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
  }

  function lerpColor(a: [number, number, number, number], b: [number, number, number, number], t: number): [number, number, number, number] {
    return [0, 1, 2, 3].map(i => lerp(a[i], b[i], t)) as [number, number, number, number];
  }

  function interpolateFrame(keyframes: any[], t: number) {
    if (!keyframes || keyframes.length === 0) return undefined;
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
        x: lerp(prev.position.x, next.position.x, ratio),
        y: lerp(prev.position.y, next.position.y, ratio)
      },
      width: lerp(prev.width, next.width, ratio),
      height: lerp(prev.height, next.height, ratio),
      color: lerpColor(prev.color, next.color, ratio),
      texture: ratio < 0.5 ? prev.texture : next.texture,
      ...(text !== undefined ? { text } : {})
    };
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
        const physicsRunning = store.getState().editor.physicsRunning;
        if (physicsRunning) physicsWorld.step(delta);

        // 获取实体并处理物理同步
        const entities = Object.values(store.getState().editor.entities);
        const animations = store.getState().editor.animations;

        // 限制dispatch频率，避免无限循环
        const shouldDispatch = (now - lastDispatchTime) > DISPATCH_THROTTLE;

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

            if (anim && Array.isArray(anim.keyframes) && anim.keyframes.length > 0) {
              maxTime = anim.keyframes[anim.keyframes.length - 1].time;
              if (newTime >= maxTime) {
                shouldStop = true;
              }
            }

            // 循环播放逻辑
            const isLoop = !!entity.animation.loop;
            const safeTime = shouldStop ? maxTime : newTime;
            const nextTime = shouldStop ? (isLoop ? 0 : 0) : safeTime;
            const nextPlaying = shouldStop ? isLoop : true;

            if (anim && Array.isArray(anim.keyframes) && anim.keyframes.length > 0) {
              const frame = interpolateFrame(anim.keyframes, safeTime);
              if (frame && shouldDispatch) {
                // 修复：text 字段安全合并
                let mergedText = (frame.text !== undefined && frame.text !== null && frame.text !== '')
                  ? frame.text
                  : (entity.properties && 'text' in entity.properties ? entity.properties.text : undefined);

                dispatch(updateEntity(entity.id, {
                  animation: {
                    ...entity.animation,
                    currentTime: nextTime,
                    playing: nextPlaying
                  },
                  position: frame.position,
                  properties: {
                    ...entity.properties,
                    width: frame.width,
                    height: frame.height,
                    color: frame.color || entity.properties.color || [1,1,1,1],
                    texture: frame.texture,
                    ...(mergedText !== undefined ? { text: mergedText } : {})
                  }
                }));
              }
            } else if (shouldDispatch) {
              // 只推进时间
              dispatch(updateEntity(entity.id, {
                animation: {
                  ...entity.animation,
                  currentTime: nextTime,
                  playing: nextPlaying
                }
              }));
            }
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
  }, []);

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
      <View style={styles.tips}>
        <Text style={styles.tipsText}>
          {draggingEntityId ? "拖拽中..." : "点击添加实体 | 点击实体选中 | 拖拽移动实体"}
        </Text>
      </View>
    </View>
  );
}

export default Canvas;
