import React from 'react';
import { useDispatch } from 'react-redux';
import { PhysicsComponent } from '../../../core/types';
import { updatePhysicsComponent, removePhysicsComponent } from '../../../core/actions';

interface PhysicsPanelProps {
  entityId: string;
  component: PhysicsComponent;
}

const PhysicsPanel: React.FC<PhysicsPanelProps> = ({ entityId, component }) => {
  const dispatch = useDispatch();

  const handleChange = (field: keyof PhysicsComponent, value: any) => {
    console.log(`[PhysicsPanel] updatePhysicsComponent: entityId=${entityId}, field=${field}, value=${value}`);
    dispatch(updatePhysicsComponent(entityId, { [field]: value }));
  };

  return (
    <div style={{ border: '1px solid #aaa', padding: 8, marginTop: 8 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>物理属性</div>
      <div>
        <label>类型：</label>
        <select
          value={component.bodyType}
          onChange={e => handleChange('bodyType', e.target.value)}
        >
          <option value="dynamic">动态</option>
          <option value="static">静态</option>
          <option value="kinematic">运动学</option>
        </select>
      </div>
      <div>
        <label>密度：</label>
        <input
          type="number"
          value={component.density}
          step={0.01}
          min={0}
          onChange={e => handleChange('density', parseFloat(e.target.value))}
        />
      </div>
      <div>
        <label>摩擦：</label>
        <input
          type="number"
          value={component.friction}
          step={0.01}
          min={0}
          onChange={e => handleChange('friction', parseFloat(e.target.value))}
        />
      </div>
      <div>
        <label>弹性：</label>
        <input
          type="number"
          value={component.restitution}
          step={0.01}
          min={0}
          onChange={e => handleChange('restitution', parseFloat(e.target.value))}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={!!component.fixedRotation}
            onChange={e => handleChange('fixedRotation', e.target.checked)}
          />
          固定旋转
        </label>
      </div>
      <button style={{ marginTop: 8, color: 'red' }} onClick={() => dispatch(removePhysicsComponent(entityId))}>
        移除物理组件
      </button>
    </div>
  );
};

export default PhysicsPanel;
