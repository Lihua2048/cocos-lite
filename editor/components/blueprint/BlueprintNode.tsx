import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated
} from 'react-native';
import { BlueprintNode } from '../../../core/types/blueprint';

interface Props {
  node: BlueprintNode;
  selected: boolean;
  onSelect: () => void;
  onDrag: (deltaX: number, deltaY: number) => void;
  onDelete: () => void;
  onStartConnection: (isInput: boolean) => void;
  onEndConnection: (isInput: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const BlueprintNodeComponent: React.FC<Props> = ({
  node,
  selected,
  onSelect,
  onDrag,
  onDelete,
  onStartConnection,
  onEndConnection,
  onDragStart,
  onDragEnd
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const lastPosition = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
        onDragStart();
        lastPosition.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaX = gestureState.dx - lastPosition.current.x;
        const deltaY = gestureState.dy - lastPosition.current.y;
        lastPosition.current = { x: gestureState.dx, y: gestureState.dy };
        onDrag(deltaX, deltaY);
      },
      onPanResponderRelease: () => {
        onDragEnd();
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  const renderPort = (type: 'input' | 'output', index: number) => {
    const isInput = type === 'input';
    return (
      <TouchableOpacity
        key={`${type}-${index}`}
        style={[
          styles.port,
          isInput ? styles.inputPort : styles.outputPort,
          { top: 30 + index * 20 }
        ]}
        onPressIn={() => onStartConnection(isInput)}
        onPressOut={() => onEndConnection(isInput)}
      >
        <View style={styles.portInner} />
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: node.position.x,
          top: node.position.y,
          width: node.style.width,
          height: node.style.height,
          backgroundColor: node.style.backgroundColor,
          borderColor: selected ? '#4CAF50' : '#333',
          transform: [{ translateX: pan.x }, { translateY: pan.y }]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* 删除按钮 */}
      {selected && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      )}

      {/* 节点标签 */}
      <Text style={styles.label}>{node.label}</Text>

      {/* 输入端口 */}
      {node.inputs.map((input, index) => renderPort('input', index))}

      {/* 输出端口 */}
      {node.outputs.map((output, index) => renderPort('output', index))}

      {/* 节点类型图标 */}
      <View style={styles.typeIcon}>
        <Text style={styles.typeIconText}>
          {getNodeIcon(node.type)}
        </Text>
      </View>
    </Animated.View>
  );
};

const getNodeIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    input: '→',
    output: '←',
    process: '⚙',
    condition: '?',
    loop: '↻',
    default: '□'
  };
  return icons[type] || icons.default;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  port: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  inputPort: {
    left: -8,
  },
  outputPort: {
    right: -8,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeIcon: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconText: {
    fontSize: 16,
  },
});

export default BlueprintNodeComponent;