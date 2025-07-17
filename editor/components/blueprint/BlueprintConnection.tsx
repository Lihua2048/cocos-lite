import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { BlueprintNode, BlueprintConnection } from '../../../core/types/blueprint';

interface Props {
  connection: BlueprintConnection;
  fromNode: BlueprintNode;
  toNode: BlueprintNode;
  zoom: number;
  pan: { x: number; y: number };
  onDelete: () => void;
}

const BlueprintConnectionComponent: React.FC<Props> = ({
  connection,
  fromNode,
  toNode,
  zoom,
  pan,
  onDelete
}) => {
  // 计算连接点位置
  const fromX = (fromNode.position.x + fromNode.style.width) * zoom + pan.x;
  const fromY = (fromNode.position.y + fromNode.style.height / 2) * zoom + pan.y;
  const toX = toNode.position.x * zoom + pan.x;
  const toY = (toNode.position.y + toNode.style.height / 2) * zoom + pan.y;

  // 计算贝塞尔曲线控制点
  const controlPointOffset = Math.abs(toX - fromX) * 0.5;
  const path = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;

  // 计算中点位置（用于删除按钮）
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Path
          d={path}
          stroke={connection.style.color}
          strokeWidth={connection.style.width * zoom}
          fill="none"
        />
        {/* 箭头 */}
        <Circle
          cx={toX}
          cy={toY}
          r={4 * zoom}
          fill={connection.style.color}
        />
      </Svg>
      
      {/* 删除按钮 */}
      <TouchableOpacity
        style={[
          styles.deleteButton,
          {
            left: midX - 10,
            top: midY - 10,
            transform: [{ scale: zoom }]
          }
        ]}
        onPress={onDelete}
      >
        <View style={styles.deleteButtonInner} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  deleteButton: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deleteButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f44336',
    opacity: 0.8,
  },
});

export default BlueprintConnectionComponent;