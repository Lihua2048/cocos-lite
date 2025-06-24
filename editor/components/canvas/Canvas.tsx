import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { WebGLRenderer } from "../../../2d/webgl-renderer";
import { addEntity, removeEntity, selectEntity, updateEntity } from "../../../core/actions";
import { Entity } from "../../../core/types";
import { RootState } from "../../../core/types";

export default function Canvas() {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 使用自定义类型处理数据
  const entities = useSelector((state: RootState) =>
  state.entities ? Object.values(state.entities) as Entity[] : []
);
  const rendererRef = useRef<WebGLRenderer | null>(null);

  // 获取点击位置的实体（复用点击检测逻辑）
  const getEntityAtPosition = (clientX: number, clientY: number): Entity | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const clickX = (clientX - rect.left) * pixelRatio;
    const clickY = (clientY - rect.top) * pixelRatio;

    // 查找点击位置的实体
    return entities.find(entity => {
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
      dispatch(selectEntity(clickedEntity.id));
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

    // 更新实体位置
    dispatch(updateEntity(draggingEntityId, {
      position: { x: newX, y: newY }
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

  // 左键点击处理（添加实体）
  const handleClick = (event: React.MouseEvent) => {
    // 如果正在拖拽，不处理点击事件
    if (draggingEntityId) return;

    // 检查是否点击了实体
    const clickedEntity = getEntityAtPosition(event.clientX, event.clientY);

    if (clickedEntity) {
      // 点击实体 - 打开属性面板
      dispatch(selectEntity(clickedEntity.id));
    } else {
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
  };

  // 初始化WebGL渲染器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置canvas尺寸
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * pixelRatio;
    canvas.height = canvas.clientHeight * pixelRatio;

    const renderer = new WebGLRenderer();
    renderer.initialize(canvas);
    rendererRef.current = renderer;

    const renderLoop = () => {
      if (rendererRef.current) {
        rendererRef.current.render(entities);
      }
      requestAnimationFrame(renderLoop);
    };

    const animationId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationId);
      rendererRef.current?.cleanup();
    };
  }, [entities]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          display: "block",
          cursor: draggingEntityId ? "grabbing" : "default" // 添加拖拽光标
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // 鼠标离开时也结束拖拽
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "#000",
          pointerEvents: "none",
        }}
      >
        {draggingEntityId ? "拖拽中..." : "点击添加实体 | 点击实体选中 | 拖拽移动实体"}
      </div>
    </div>
  );
}
