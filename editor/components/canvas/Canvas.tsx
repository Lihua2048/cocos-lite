import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";

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
const Canvas: React.FC<CanvasProps> = ({ resourceManager }) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 只在初始渲染时获取，后续每帧用 store.getState()
  const store = useStore<RootState>();
  const animations = useSelector((state: RootState) => state.animations);
  const rendererRef = useRef<WebGLRenderer | null>(null);

  // 获取点击位置的实体（复用点击检测逻辑）
  const getEntityAtPosition = (clientX: number, clientY: number): Entity | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const clickX = (clientX - rect.left) * pixelRatio;
    const clickY = (clientY - rect.top) * pixelRatio;

    // 每次都用最新 entities
    const entities: Record<string, Entity> = store.getState().entities;
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
    const entities: Record<string, Entity> = store.getState().entities;
    const entity = entities[draggingEntityId];
    const hasPhysics = entity && entity.components.some(c => c.type === 'physics');
    if (hasPhysics) {
      // 有物理组件，直接设置物理体位置
      const body = (physicsWorld as any).bodies?.get?.(draggingEntityId);
      if (body) {
        body.setPosition({ x: newX, y: newY });
        body.setLinearVelocity(planck.Vec2(0, 0)); // 拖拽时速度清零，防止弹飞
        body.setAwake(true);
      }
    } else {
      // 无物理组件，直接更新实体属性
      dispatch(updateEntity(draggingEntityId, {
        position: { x: newX, y: newY }
      }));
    }
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

  // 左键点击处理（添加实体）
  const handleClick = (event: React.MouseEvent) => {
    // 如果正在拖拽，不处理点击事件
    if (draggingEntityId) return;

    // 检查是否点击了实体
    const clickedEntity = getEntityAtPosition(event.clientX, event.clientY);

    if (!clickedEntity) {
      // 点击空白处 - 添加新实体
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;

      // 创建新实体对象（使用自定义类型）
      const newEntity: Entity = {
        id: `entity-${Date.now()}`,
        type: "sprite",
        position: {
          x: (event.clientX - rect.left) * pixelRatio,
          y: (event.clientY - rect.top) * pixelRatio,
        },
        properties: {
          width: 100,
          height: 100,
          color: [1.0, 0.0, 0.0, 1.0] as [number, number, number, number]
        },
        components: []
      };

      dispatch(addEntity(newEntity));
    }
    // 不再在 handleClick 里派发 selectEntity，统一在 handleMouseDown 处理
  };

  // 初始化WebGL渲染器
  useEffect(() => {
    // 确保物理世界只初始化一次
    if (!physicsWorld.isInitialized()) {
      physicsWorld.initialize({ x: 0, y: 10 });
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置canvas尺寸
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * pixelRatio;
    canvas.height = canvas.clientHeight * pixelRatio;

    const renderer = new WebGLRenderer(resourceManager);
    renderer.initialize(canvas);
    rendererRef.current = renderer;

    // 记录上一帧时间戳
    let lastTimestamp = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const delta = (now - lastTimestamp) / 1000; // 秒
      lastTimestamp = now;

      // 每帧获取最新 entities
      const state = store.getState();
      const entities: Record<string, Entity> = state.entities;
      const animations = state.animations;

      // 恢复物理主循环
      // 仅在物理运行状态下 step
      const physicsRunning = store.getState().physicsRunning;
      if (physicsRunning) {
        physicsWorld.step(delta);
      }
      // 自动创建/同步/销毁物理体
      const existingBodyIds = new Set(Array.from((physicsWorld as any).bodies?.keys?.() || []));
      Object.values(entities).forEach((entity: Entity) => {
        const physicsComp = entity.components.find(c => c.type === 'physics') as PhysicsComponent | undefined;
        const hasBody = (physicsWorld as any).bodies?.has?.(entity.id);
        // 仅有物理组件的实体才参与物理体创建/同步/销毁
        // --- 物理属性变更检测与物理体重建 ---
        // 用于缓存上一次的物理属性
        if (!(window as any)._entityPhysicsCache) (window as any)._entityPhysicsCache = {};
        const cache = (window as any)._entityPhysicsCache;
        const keyProps = physicsComp ? [physicsComp.bodyType, physicsComp.density, physicsComp.friction, physicsComp.restitution, physicsComp.fixedRotation].join(',') : '';
        if (physicsComp) {
          if (!hasBody || cache[entity.id] !== keyProps) {
            // 属性变更或无物理体时，重建物理体
            if (hasBody) (physicsWorld as any).destroyBody(entity.id);
            const safeY = Math.max(entity.position.y, 10);
            const def: any = {
              type: physicsComp.bodyType || 'dynamic',
              position: { x: entity.position.x, y: safeY },
              angle: entity.properties.angle || 0,
              fixedRotation: !!physicsComp.fixedRotation
            };
            const body = (physicsWorld as any).createBody(def, { id: entity.id });
            const w = entity.properties.width / 2;
            const h = entity.properties.height / 2;
            body.createFixture(planck.Box(w, h), {
              density: physicsComp.density,
              friction: physicsComp.friction,
              restitution: physicsComp.restitution
            });
            cache[entity.id] = keyProps;
          }
          // 同步物理体到实体
          const body = (physicsWorld as any).bodies.get(entity.id);
          if (body) {
            physicsWorld.syncEntityFromBody(entity, body);
            dispatch(updateEntity(entity.id, {
              position: { ...entity.position },
              properties: { ...entity.properties }
            }));
          }
          existingBodyIds.delete(entity.id);
        } else if (hasBody) {
          (physicsWorld as any).destroyBody(entity.id);
          delete cache[entity.id];
        }
      });
      // 清理已被删除的实体对应的物理体
      existingBodyIds.forEach(id => {
        (physicsWorld as any).destroyBody(id);
      });

      // 多属性关键帧插值
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
        return {
          time: t,
          position: {
            x: lerp(prev.position.x, next.position.x, ratio),
            y: lerp(prev.position.y, next.position.y, ratio)
          },
          width: lerp(prev.width, next.width, ratio),
          height: lerp(prev.height, next.height, ratio),
          color: lerpColor(prev.color, next.color, ratio),
          texture: ratio < 0.5 ? prev.texture : next.texture
        };
      }

      Object.values(entities).forEach((entity: Entity) => {
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
            if (frame) {
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
                  color: frame.color,
                  texture: frame.texture
                }
              }));
            }
          } else {
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

      if (rendererRef.current) {
    // 关键帧插值函数，兼容 position.x/y
    function interpolateKeyframes(keyframes: any[], t: number): number | undefined {
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
      if (prev === next) return prev.value;
      const ratio = (t - prev.time) / (next.time - prev.time);
      return prev.value * (1 - ratio) + next.value * ratio;
    }
        // 构建 entityAnimationState: { [entityId]: { currentAnimation, currentTime } }
        const entityAnimationState: Record<string, { currentAnimation?: string; currentTime: number }> = {};
        Object.values(entities).forEach(entity => {
          if (entity.animation) {
            entityAnimationState[entity.id] = {
              currentAnimation: entity.animation.currentAnimation,
              currentTime: entity.animation.currentTime
            };
          }
        });
        rendererRef.current.render(
          Object.values(entities),
          animations,
          entityAnimationState
        );
      }
      requestAnimationFrame(renderLoop);
    };

    const animationId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationId);
      rendererRef.current?.cleanup();
    };
  }, [resourceManager]);
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
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
