import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, G } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
  gridSize?: number;
  zoom: number;
}

const BlueprintGrid: React.FC<Props> = ({ 
  width, 
  height, 
  gridSize = 20,
  zoom 
}) => {
  const effectiveGridSize = gridSize * zoom;
  const majorGridSize = effectiveGridSize * 5;

  // 计算需要绘制的线条数量
  const horizontalLines = Math.ceil(height / effectiveGridSize) + 1;
  const verticalLines = Math.ceil(width / effectiveGridSize) + 1;
  const majorHorizontalLines = Math.ceil(height / majorGridSize) + 1;
  const majorVerticalLines = Math.ceil(width / majorGridSize) + 1;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <G>
          {/* 细网格线 */}
          {Array.from({ length: horizontalLines }, (_, i) => (
            <Line
              key={`h-${i}`}
              x1={0}
              y1={i * effectiveGridSize}
              x2={width}
              y2={i * effectiveGridSize}
              stroke="#2a2a2a"
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
          {Array.from({ length: verticalLines }, (_, i) => (
            <Line
              key={`v-${i}`}
              x1={i * effectiveGridSize}
              y1={0}
              x2={i * effectiveGridSize}
              y2={height}
              stroke="#2a2a2a"
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
          
          {/* 粗网格线 */}
          {Array.from({ length: majorHorizontalLines }, (_, i) => (
            <Line
              key={`mh-${i}`}
              x1={0}
              y1={i * majorGridSize}
              x2={width}
              y2={i * majorGridSize}
              stroke="#2a2a2a"
              strokeWidth={2}
              opacity={0.5}
            />
          ))}
          {Array.from({ length: majorVerticalLines }, (_, i) => (
            <Line
              key={`mv-${i}`}
              x1={i * majorGridSize}
              y1={0}
              x2={i * majorGridSize}
              y2={height}
              stroke="#2a2a2a"
              strokeWidth={2}
              opacity={0.5}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
};

export default BlueprintGrid;