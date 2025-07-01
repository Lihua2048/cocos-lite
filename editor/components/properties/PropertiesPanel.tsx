import React, { useState, useEffect } from "react";
import PhysicsPanel from '../physics/PhysicsPanel';
import { useSelector, useDispatch } from "react-redux";
import {
  updateEntityProperty,
  updateEntityTexture,
  addPhysicsComponent,
  setPhysicsRunning
} from "../../../core/actions";
import { RootState, TextureResource } from "../../../core/types";
import { EntityProperty } from "../../../core/types";
import KeyframeEditor from "../animation/KeyframeEditor";
import AnimationControls from "../animation/AnimationControls";
import "./PropertiesPanel.css";

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const selectedEntityId = useSelector((state: RootState) => state.selectedEntityId);
  const entities = useSelector((state: RootState) => state.entities);
  const textures = useSelector((state: RootState) => state.textures); // 添加textures选择器
  const physicsRunning = useSelector((state: RootState) => state.physicsRunning);
  const selectedEntity =
    selectedEntityId && entities[selectedEntityId]
      ? entities[selectedEntityId]
      : null;

  // 本地状态管理编辑中的属性（支持 sprite 和 ui 类型）
  const [editableProps, setEditableProps] = useState({
    position: { x: 0, y: 0 },
    width: 0,
    height: 0,
    color: [0, 0, 0, 1] as [number, number, number, number],
    backgroundType: 'color',
    texture: '',
    text: '',
    textColor: [0, 0, 0, 1] as [number, number, number, number],
    fontSize: 16,
    textAlign: 'left',
  });

  // 当选中实体变化时更新本地状态
  useEffect(() => {
    if (selectedEntity) {
      // 通用属性
      const colorArray = selectedEntity.properties.color;
      const colorTuple: [number, number, number, number] = [
        colorArray[0] || 0,
        colorArray[1] || 0,
        colorArray[2] || 0,
        colorArray[3] !== undefined ? colorArray[3] : 1,
      ];
      // 区分 sprite 和 ui 类型
      if (selectedEntity.type === 'sprite') {
        setEditableProps({
          position: { ...selectedEntity.position },
          width: selectedEntity.properties.width,
          height: selectedEntity.properties.height,
          color: colorTuple,
          backgroundType: 'color',
          texture: '',
          text: '',
          textColor: [0, 0, 0, 1],
          fontSize: 16,
          textAlign: 'left',
        });
      } else {
        // UIEntity
        const uiProps = selectedEntity.properties as any;
        setEditableProps({
          position: { ...selectedEntity.position },
          width: uiProps.width,
          height: uiProps.height,
          color: colorTuple,
          backgroundType: uiProps.backgroundType || 'color',
          texture: uiProps.texture || '',
          text: uiProps.text || '',
          textColor: uiProps.textColor || [0, 0, 0, 1],
          fontSize: uiProps.fontSize || 16,
          textAlign: uiProps.textAlign || 'left',
        });
      }
    }
  }, [selectedEntity]);

  // 处理输入变化（支持 string/number/数组）
  const handleInputChange = (field: string, value: string, index?: number, isString?: boolean) => {
    let newValue: any = isString ? value : parseFloat(value) || 0;
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setEditableProps((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: newValue,
        },
      }));
      dispatch(updateEntityProperty(selectedEntityId!, child as EntityProperty, newValue));
    } else if (index !== undefined) {
      // 支持 color/textColor
      setEditableProps((prev) => {
        const arr = [...(prev as any)[field]];
        arr[index] = newValue;
        return { ...prev, [field]: arr };
      });
      const arr = [...(editableProps as any)[field]];
      arr[index] = newValue;
      dispatch(updateEntityProperty(selectedEntityId!, field as EntityProperty, arr as [number, number, number, number]));
    } else {
      setEditableProps((prev) => ({ ...prev, [field]: newValue }));
      dispatch(updateEntityProperty(selectedEntityId!, field as EntityProperty, newValue));
    }
  };

  if (!selectedEntity) {
    return (
      <div className="prop-container">
        <div className="prop-no-selection">未选择实体</div>
      </div>
    );
  }

  // 检查是否有物理组件
  let physicsComponent: import('../../../core/types').PhysicsComponent | null = null;
  let hasPhysicsComponent = false;
  if (selectedEntity) {
    const found = selectedEntity.components.find(c => c.type === 'physics');
    if (found) {
      physicsComponent = found as import('../../../core/types').PhysicsComponent;
      hasPhysicsComponent = true;
    }
  }

  // 根据类型渲染不同属性面板
  if (selectedEntity.type === 'sprite') {
    return (
      <div className="prop-container">
        <div className="prop-group">
          <div className="prop-title">精灵属性</div>
          <div className="prop-label">纹理:</div>
          <select
            className="prop-input"
            value={selectedEntity.properties.texture || ""}
            onChange={e => dispatch(updateEntityTexture(selectedEntity.id, e.target.value))}
          >
            <option value="">无纹理</option>
            {textures.map((texture: TextureResource) =>
              typeof texture === "string" ? (
                <option key={texture} value={texture}>{texture}</option>
              ) : (
                <option key={texture.id} value={texture.id}>{texture.name}</option>
              )
            )}
          </select>
        </div>
        <div className="prop-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasPhysicsComponent ? (
            <PhysicsPanel entityId={selectedEntity.id} component={physicsComponent!} />
          ) : (
            <button className="prop-btn" onClick={() => {
              dispatch(addPhysicsComponent(selectedEntity.id, {
                type: 'physics', bodyType: 'dynamic', density: 1, friction: 0.5, restitution: 0.2, fixedRotation: false
              }));
            }}>添加物理组件</button>
          )}
          <button className="prop-btn" style={{ background: physicsRunning ? '#d4f7d4' : '#f7d4d4' }} onClick={() => dispatch(setPhysicsRunning(!physicsRunning))}>
            {physicsRunning ? '暂停物理' : '运行物理'}
          </button>
        </div>
        <div className="prop-group"><KeyframeEditor propertyName="position.x" /></div>
        <div className="prop-group"><AnimationControls entityId={selectedEntity.id} /></div>
        {selectedEntity.animation && (
          <div className="prop-label">当前动画: {selectedEntity.animation.currentAnimation}</div>
        )}
        <div className="prop-group">
          <div className="prop-subtitle">位置</div>
          <div className="prop-row">
            <label className="prop-label">X:<input className="prop-input" type="number" value={editableProps.position.x} onChange={e => handleInputChange("position.x", e.target.value)} /></label>
            <label className="prop-label">Y:<input className="prop-input" type="number" value={editableProps.position.y} onChange={e => handleInputChange("position.y", e.target.value)} /></label>
          </div>
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">尺寸</div>
          <div className="prop-row">
            <label className="prop-label">宽:<input className="prop-input" type="number" value={editableProps.width} onChange={e => handleInputChange("width", e.target.value)} /></label>
            <label className="prop-label">高:<input className="prop-input" type="number" value={editableProps.height} onChange={e => handleInputChange("height", e.target.value)} /></label>
          </div>
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">颜色 (RGBA)</div>
          <div className="prop-row">
            {["R", "G", "B", "A"].map((channel, index) => (
              <label key={index} className="prop-label">{channel}:<input className="prop-input" type="number" value={editableProps.color[index]} onChange={e => handleInputChange("color", e.target.value, index)} /></label>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    // UI组件属性面板
    return (
      <div className="prop-container">
        <div className="prop-group"><div className="prop-title">UI组件属性</div></div>
        <div className="prop-group">
          <div className="prop-subtitle">背景类型</div>
          <select className="prop-input" value={selectedEntity.properties.backgroundType} onChange={e => dispatch(updateEntityProperty(selectedEntity.id, 'backgroundType', e.target.value))}>
            <option value="color">纯色</option>
            <option value="image">图片</option>
          </select>
        </div>
        {editableProps.backgroundType === 'color' && (
          <div className="prop-group">
            <div className="prop-subtitle">背景色 (RGBA)</div>
            <div className="prop-row">
              {["R", "G", "B", "A"].map((channel, index) => (
                <label key={index} className="prop-label">{channel}:<input className="prop-input" type="number" value={editableProps.color[index]} onChange={e => handleInputChange('color', e.target.value, index)} /></label>
              ))}
            </div>
          </div>
        )}
        {editableProps.backgroundType === 'image' && (
          <div className="prop-group">
            <div className="prop-subtitle">背景图片</div>
            <select className="prop-input" value={editableProps.texture || ''} onChange={e => handleInputChange('texture', e.target.value, undefined, true)}>
              <option value="">无图片</option>
              {textures.map((texture: TextureResource) =>
                typeof texture === 'string' ? (
                  <option key={texture} value={texture}>{texture}</option>
                ) : (
                  <option key={texture.id} value={texture.id}>{texture.name}</option>
                )
              )}
            </select>
          </div>
        )}
        <div className="prop-group">
          <div className="prop-subtitle">{selectedEntity.type === 'ui-input' ? '占位符(placeholder)' : '文字内容'}</div>
          <input className="prop-input" type="text" value={editableProps.text} onChange={e => handleInputChange('text', e.target.value, undefined, true)} />
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">文字颜色 (RGBA)</div>
          <div className="prop-row">
            {["R", "G", "B", "A"].map((channel, index) => (
              <label key={index} className="prop-label">{channel}:<input className="prop-input" type="number" value={editableProps.textColor[index]} onChange={e => handleInputChange('textColor', e.target.value, index)} /></label>
            ))}
          </div>
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">字体大小</div>
          <input className="prop-input" type="number" value={editableProps.fontSize || 16} onChange={e => handleInputChange('fontSize', e.target.value)} />
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">文字排版</div>
          <select className="prop-input" value={editableProps.textAlign} onChange={e => handleInputChange('textAlign', e.target.value, undefined, true)}>
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">位置</div>
          <div className="prop-row">
            <label className="prop-label">X:<input className="prop-input" type="number" value={editableProps.position.x} onChange={e => handleInputChange('position.x', e.target.value)} /></label>
            <label className="prop-label">Y:<input className="prop-input" type="number" value={editableProps.position.y} onChange={e => handleInputChange('position.y', e.target.value)} /></label>
          </div>
        </div>
        <div className="prop-group">
          <div className="prop-subtitle">尺寸</div>
          <div className="prop-row">
            <label className="prop-label">宽:<input className="prop-input" type="number" value={editableProps.width} onChange={e => handleInputChange('width', e.target.value)} /></label>
            <label className="prop-label">高:<input className="prop-input" type="number" value={editableProps.height} onChange={e => handleInputChange('height', e.target.value)} /></label>
          </div>
        </div>
      </div>
    );
  }
}


