import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  PanResponder
} from 'react-native';
import { BlueprintNode, BlueprintConnection } from '../../../core/types/blueprint';

interface Props {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
}

const BlueprintMinimap: React.FC<Props> = ({
  nodes,
  connections,
  viewportWidth,
  viewportHeight,
  zoom,
  pan,
  onPanChange
}) => {
  const minimapWidth = 200;
  const minimapHeight = 150;
  
  // 计算所有节点的边界
  const bounds = nodes.reduce((acc, node) => {
    return {
      minX: Math.min(acc.minX, node.position.x),
      minY: Math.min(acc.minY, node.position.y),
      maxX: Math.max(acc.maxX, node.position.x + node.style.width),
      maxY: Math.max(acc.maxY, node.position.y + node.style.height)
    };
  }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  const worldWidth = bounds.maxX - bounds.minX || 1000;
  const worldHeight = bounds.maxY - bounds.minY || 1000;
  const scale = Math.min(minimapWidth / worldWidth, minimapHeight / worldHeight) * 0.8;

  // 计算视口在小地图中的位置和大小
  const viewportRect = {
    x: (-pan.x / zoom - bounds.minX) * scale,
    y: (-pan.y / zoom - bounds.minY) * scale,
    width: (viewportWidth / zoom) * scale,
    height: (viewportHeight / zoom) * scale
  };

  // 处理视口拖拽
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const newX = -(gestureState.moveX / scale + bounds.minX) * zoom;
        const newY = -(gestureState.moveY / scale + bounds.minY) * zoom;
        onPanChange({ x: newX, y: newY });
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.minimap}>
        {/* 渲染节点 */}
        {nodes.map(node => (
          <View
            key={node.id}
            style={[
              styles.minimapNode,
              {
                left: (node.position.x - bounds.minX) * scale,
                top: (node.position.y - bounds.minY) * scale,
                width: node.style.width * scale,
                height: node.style.height * scale,
                backgroundColor: node.style.backgroundColor,
              }
            ]}
          />
        ))}

        {/* 渲染视口 */}
        <View
          style={[
            styles.viewport,
            {
              left: viewportRect.x,
              top: viewportRect.y,
              width: viewportRect.width,
              height: viewportRect.height,
            }
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 200,
    height: 150,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3e3e42',
    overflow: 'hidden',
  },
  minimap: {
    flex: 1,
    position: 'relative',
  },
  minimapNode: {
    position: 'absolute',
    opacity: 0.6,
    borderRadius: 2,
  },
  viewport: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
});

export default BlueprintMinimap;