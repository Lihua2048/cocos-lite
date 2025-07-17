import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/types';
import {
  addBlueprintNode,
  updateBlueprintNode,
  deleteBlueprintNode,
  connectBlueprintNodes,
  disconnectBlueprintNodes,
  setBlueprintZoom,
  setBlueprintPan,
  undoBlueprintAction,
  redoBlueprintAction,
  autoLayoutBlueprint
} from '../../../core/actions/blueprintActions';
import BlueprintMinimap from './BlueprintMinimap';
import BlueprintToolbar from './BlueprintToolbar';
import BlueprintNodeComponent from './BlueprintNode';
import BlueprintConnection from './BlueprintConnection';
import BlueprintGrid from './BlueprintGrid';
import { BlueprintNode, BlueprintConnection as BlueprintConnectionType } from '../../../core/types/blueprint';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Props {
  onClose?: () => void;
}

const BlueprintEditor: React.FC<Props> = ({ onClose }) => {
  const dispatch = useDispatch();
  const { nodes, connections, zoom, pan, canUndo, canRedo } = useSelector(
    (state: RootState) => state.blueprint
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const canvasRef = useRef<View>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });

  // 画布拖拽手势
  const canvasPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isDragging && !connectingFrom,
      onMoveShouldSetPanResponder: () => !isDragging && !connectingFrom,
      onPanResponderGrant: () => {
        lastPanRef.current = { ...pan };
      },
      onPanResponderMove: (evt, gestureState) => {
        dispatch(setBlueprintPan({
          x: lastPanRef.current.x + gestureState.dx,
          y: lastPanRef.current.y + gestureState.dy
        }));
      },
    })
  ).current;

  // 添加新节点
  const handleAddNode = useCallback((type: string, position?: { x: number; y: number }) => {
    const newNode: BlueprintNode = {
      id: `node_${Date.now()}`,
      type,
      label: `${type} Node`,
      position: position || { x: screenWidth / 2 - pan.x, y: screenHeight / 2 - pan.y },
      inputs: type === 'output' ? [] : ['input'],
      outputs: type === 'input' ? [] : ['output'],
      data: {},
      style: {
        backgroundColor: getNodeColor(type),
        width: 150,
        height: 80
      }
    };
    dispatch(addBlueprintNode(newNode));
  }, [dispatch, pan]);

  // 获取节点颜色
  const getNodeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      input: '#4CAF50',
      output: '#2196F3',
      process: '#FF9800',
      condition: '#9C27B0',
      loop: '#F44336',
      default: '#607D8B'
    };
    return colors[type] || colors.default;
  };

  // 处理节点拖拽
  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      dispatch(updateBlueprintNode({
        ...node,
        position: {
          x: node.position.x + deltaX / zoom,
          y: node.position.y + deltaY / zoom
        }
      }));
    }
  }, [nodes, dispatch, zoom]);

  // 开始连线
  const handleStartConnection = useCallback((nodeId: string, isInput: boolean) => {
    if (!isInput) {
      setConnectingFrom(nodeId);
    }
  }, []);

  // 完成连线
  const handleEndConnection = useCallback((nodeId: string, isInput: boolean) => {
    if (connectingFrom && isInput && connectingFrom !== nodeId) {
      const newConnection: BlueprintConnectionType = {
        id: `conn_${Date.now()}`,
        from: connectingFrom,
        to: nodeId,
        fromPort: 'output',
        toPort: 'input',
        style: {
          color: '#666',
          width: 2
        }
      };
      dispatch(connectBlueprintNodes(newConnection));
    }
    setConnectingFrom(null);
    setConnectionPreview(null);
  }, [connectingFrom, dispatch]);

  // 更新连线预览
  const handleConnectionPreview = useCallback((x: number, y: number) => {
    if (connectingFrom) {
      setConnectionPreview({ x, y });
    }
  }, [connectingFrom]);

  // 删除节点
  const handleDeleteNode = useCallback((nodeId: string) => {
    dispatch(deleteBlueprintNode(nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [dispatch, selectedNodeId]);

  // 删除连线
  const handleDeleteConnection = useCallback((connectionId: string) => {
    dispatch(disconnectBlueprintNodes(connectionId));
  }, [dispatch]);

  // 缩放处理
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
    dispatch(setBlueprintZoom(newZoom));
  }, [zoom, dispatch]);

  // 自动布局
  const handleAutoLayout = useCallback(() => {
    dispatch(autoLayoutBlueprint());
  }, [dispatch]);

  // 撤销/重做
  const handleUndo = useCallback(() => {
    dispatch(undoBlueprintAction());
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch(redoBlueprintAction());
  }, [dispatch]);

  // 渲染连线
  const renderConnections = () => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return null;

      return (
        <BlueprintConnection
          key={conn.id}
          connection={conn}
          fromNode={fromNode}
          toNode={toNode}
          zoom={zoom}
          pan={pan}
          onDelete={() => handleDeleteConnection(conn.id)}
        />
      );
    });
  };

  // 渲染连线预览
  const renderConnectionPreview = () => {
    if (!connectingFrom || !connectionPreview) return null;

    const fromNode = nodes.find(n => n.id === connectingFrom);
    if (!fromNode) return null;

    const fromX = (fromNode.position.x + fromNode.style.width) * zoom + pan.x;
    const fromY = (fromNode.position.y + fromNode.style.height / 2) * zoom + pan.y;

    return (
      <View
        style={[
          styles.connectionPreview,
          {
            position: 'absolute',
            left: Math.min(fromX, connectionPreview.x),
            top: Math.min(fromY, connectionPreview.y),
            width: Math.abs(connectionPreview.x - fromX),
            height: Math.abs(connectionPreview.y - fromY),
          }
        ]}
        pointerEvents="none"
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 工具栏 */}
      <BlueprintToolbar
        onAddNode={handleAddNode}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
        onAutoLayout={handleAutoLayout}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        onClose={onClose}
      />

      {/* 主画布 */}
      <View style={styles.canvasContainer}>
        <View
          ref={canvasRef}
          style={styles.canvas}
          {...canvasPanResponder.panHandlers}
          onTouchMove={(e) => {
            if (connectingFrom) {
              const touch = e.nativeEvent.touches[0];
              handleConnectionPreview(touch.pageX, touch.pageY);
            }
          }}
        >
          {/* 网格背景 */}
          <BlueprintGrid 
            width={screenWidth * 3} 
            height={screenHeight * 3} 
            zoom={zoom} 
          />

          {/* 连线层 */}
          <View style={styles.connectionsLayer}>
            {renderConnections()}
            {renderConnectionPreview()}
          </View>

          {/* 节点层 */}
          <View
            style={[
              styles.nodesLayer,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: zoom }
                ]
              }
            ]}
          >
            {nodes.map(node => (
              <BlueprintNodeComponent
                key={node.id}
                node={node}
                selected={selectedNodeId === node.id}
                onSelect={() => setSelectedNodeId(node.id)}
                onDrag={(dx, dy) => handleNodeDrag(node.id, dx, dy)}
                onDelete={() => handleDeleteNode(node.id)}
                onStartConnection={(isInput) => handleStartConnection(node.id, isInput)}
                onEndConnection={(isInput) => handleEndConnection(node.id, isInput)}
                onDragStart={() => {
                  setIsDragging(true);
                  setDraggedNodeId(node.id);
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  setDraggedNodeId(null);
                }}
              />
            ))}
          </View>
        </View>

        {/* 小地图 */}
        <BlueprintMinimap
          nodes={nodes}
          connections={connections}
          viewportWidth={screenWidth}
          viewportHeight={screenHeight - 100}
          zoom={zoom}
          pan={pan}
          onPanChange={(newPan) => dispatch(setBlueprintPan(newPan))}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#252525',
    opacity: 0.5,
  },
  connectionsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  nodesLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 5000,
    height: 5000,
  },
  connectionPreview: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
});

export default BlueprintEditor;