import React from 'react';

const components = [
  { type: 'sprite', label: '精灵' },
  { type: 'ui-button', label: '按钮' },
  { type: 'ui-input', label: '输入框' },
  { type: 'ui-text', label: '文本框' },
];

const paletteStyle: React.CSSProperties = {
  width: 120,
  background: '#f5f5f5',
  borderRight: '1px solid #ddd',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  height: '100vh',
  boxSizing: 'border-box',
};

const itemStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #bbb',
  borderRadius: 6,
  padding: '10px 0',
  textAlign: 'center',
  cursor: 'grab',
  fontWeight: 500,
  fontSize: 15,
  userSelect: 'none',
};

const ComponentPalette: React.FC = () => (
  <div style={paletteStyle}>
    <div style={{fontWeight: 'bold', marginBottom: 8}}>组件栏</div>
    {components.map(c => (
      <div
        key={c.type}
        style={itemStyle}
        draggable
        onDragStart={e => e.dataTransfer.setData('component-type', c.type)}
      >
        {c.label}
      </div>
    ))}
  </div>
);

export default ComponentPalette;
