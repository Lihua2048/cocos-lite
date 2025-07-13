import React from 'react';

interface ColorPickerProps {
  value: [number, number, number, number]; // RGBA 0-1
  onChange: (color: [number, number, number, number]) => void;
  label?: string;
  showAlpha?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label = "颜色",
  showAlpha = true
}) => {
  // 将0-1范围转换为0-255范围的十六进制
  const rgbaToHex = (rgba: [number, number, number, number]) => {
    const r = Math.round(rgba[0] * 255).toString(16).padStart(2, '0');
    const g = Math.round(rgba[1] * 255).toString(16).padStart(2, '0');
    const b = Math.round(rgba[2] * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  // 将十六进制转换为0-1范围的RGBA
  const hexToRgba = (hex: string, alpha: number = 1): [number, number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, alpha];
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hex = event.target.value;
    const newColor = hexToRgba(hex, value[3]);
    onChange(newColor);
  };

  const handleAlphaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const alpha = parseFloat(event.target.value);
    onChange([value[0], value[1], value[2], alpha]);
  };

  const handleChannelChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    const newColor = [...value] as [number, number, number, number];
    newColor[index] = Math.max(0, Math.min(1, newValue));
    onChange(newColor);
  };

  return (
    <div className="color-picker-container">
      <div className="color-picker-label">{label}</div>
      <div className="color-picker-controls">
        {/* 颜色选择器 */}
        <div className="color-picker-visual">
          <input
            type="color"
            value={rgbaToHex(value)}
            onChange={handleColorChange}
            className="color-picker-input"
            title="点击选择颜色"
          />
          <div
            className="color-preview"
            style={{
              backgroundColor: `rgba(${Math.round(value[0] * 255)}, ${Math.round(value[1] * 255)}, ${Math.round(value[2] * 255)}, ${value[3]})`,
            }}
          />
        </div>

        {/* 数值输入 */}
        <div className="color-picker-values">
          <div className="color-channel">
            <label>R</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={value[0].toFixed(2)}
              onChange={(e) => handleChannelChange(0, e)}
              className="color-channel-input"
            />
          </div>
          <div className="color-channel">
            <label>G</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={value[1].toFixed(2)}
              onChange={(e) => handleChannelChange(1, e)}
              className="color-channel-input"
            />
          </div>
          <div className="color-channel">
            <label>B</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={value[2].toFixed(2)}
              onChange={(e) => handleChannelChange(2, e)}
              className="color-channel-input"
            />
          </div>
          {showAlpha && (
            <div className="color-channel">
              <label>A</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={value[3].toFixed(2)}
                onChange={handleAlphaChange}
                className="color-channel-input"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
