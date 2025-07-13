/**
 * 场景组合可视化编辑器 - 第二期核心功能
 * 提供直观的场景组合编辑界面，支持拖拽、层级管理、实时预览等
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Dimensions
} from 'react-native';

export interface SceneCompositionNode {
  id: string;
  name: string;
  type: 'scene' | 'group' | 'effect';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
  opacity: number;
  blendMode: string;
  children: string[];
  parent?: string;
  metadata: {
    renderMode: string;
    compositionModes: string[];
    color: string;
    icon: string;
  };
}

export interface SceneConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'hierarchy' | 'reference' | 'data';
  style: {
    color: string;
    width: number;
    dashPattern?: number[];
  };
}

export interface CompositionProject {
  id: string;
  name: string;
  nodes: Map<string, SceneCompositionNode>;
  connections: Map<string, SceneConnection>;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  selectedNodes: Set<string>;
  settings: {
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    autoLayout: boolean;
  };
}

interface SceneCompositionEditorProps {
  project: CompositionProject;
  onProjectChange: (project: CompositionProject) => void;
  onNodeSelect: (nodeIds: string[]) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<SceneCompositionNode>) => void;
}

export function SceneCompositionEditor({
  project,
  onProjectChange,
  onNodeSelect,
  onNodeUpdate
}: SceneCompositionEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [connectionMode, setConnectionMode] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    fromNodeId: string;
    x: number;
    y: number;
  } | null>(null);

  const canvasRef = useRef<ScrollView>(null);

  // 处理节点拖拽
  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    const node = project.nodes.get(nodeId);
    if (!node) return;

    const newX = node.x + deltaX;
    const newY = node.y + deltaY;

    // 网格对齐
    const finalX = project.settings.snapToGrid
      ? Math.round(newX / project.settings.gridSize) * project.settings.gridSize
      : newX;
    const finalY = project.settings.snapToGrid
      ? Math.round(newY / project.settings.gridSize) * project.settings.gridSize
      : newY;

    onNodeUpdate(nodeId, { x: finalX, y: finalY });
  }, [project, onNodeUpdate]);

  // 处理节点选择
  const handleNodeSelect = useCallback((nodeId: string, multiSelect: boolean = false) => {
    const newSelection = new Set(selectedNodes);

    if (multiSelect) {
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId);
      } else {
        newSelection.add(nodeId);
      }
    } else {
      newSelection.clear();
      newSelection.add(nodeId);
    }

    setSelectedNodes(newSelection);
    onNodeSelect(Array.from(newSelection));
  }, [selectedNodes, onNodeSelect]);

  // 处理连接创建
  const handleConnectionStart = useCallback((nodeId: string, x: number, y: number) => {
    setConnectionMode(true);
    setPendingConnection({ fromNodeId: nodeId, x, y });
  }, []);

  const handleConnectionEnd = useCallback((toNodeId: string) => {
    if (pendingConnection && pendingConnection.fromNodeId !== toNodeId) {
      const connectionId = `conn_${Date.now()}`;
      const newConnection: SceneConnection = {
        id: connectionId,
        fromNodeId: pendingConnection.fromNodeId,
        toNodeId,
        type: 'hierarchy',
        style: {
          color: '#007bff',
          width: 2
        }
      };

      const updatedProject = { ...project };
      updatedProject.connections.set(connectionId, newConnection);
      onProjectChange(updatedProject);
    }

    setConnectionMode(false);
    setPendingConnection(null);
  }, [pendingConnection, project, onProjectChange]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>场景组合编辑器</Text>
        <View style={styles.toolbar}>
          <ToolbarButton
            title="添加场景"
            onPress={() => console.log('Add scene')}
          />
          <ToolbarButton
            title="添加组"
            onPress={() => console.log('Add group')}
          />
          <ToolbarButton
            title="自动布局"
            onPress={() => console.log('Auto layout')}
          />
          <ToolbarButton
            title={project.settings.showGrid ? '隐藏网格' : '显示网格'}
            onPress={() => {
              const updatedProject = { ...project };
              updatedProject.settings.showGrid = !updatedProject.settings.showGrid;
              onProjectChange(updatedProject);
            }}
          />
        </View>
      </View>

      <View style={styles.editorArea}>
        {/* 左侧面板 - 节点库 */}
        <View style={styles.leftPanel}>
          <NodePalette
            onNodeCreate={(type: string) => console.log('Create node:', type)}
          />
        </View>

        {/* 中央画布 */}
        <View style={styles.canvasArea}>
          <CompositionCanvas
            project={project}
            selectedNodes={selectedNodes}
            connectionMode={connectionMode}
            pendingConnection={pendingConnection}
            onNodeDrag={handleNodeDrag}
            onNodeSelect={handleNodeSelect}
            onConnectionStart={handleConnectionStart}
            onConnectionEnd={handleConnectionEnd}
            onProjectChange={onProjectChange}
          />
        </View>

        {/* 右侧面板 - 属性编辑 */}
        <View style={styles.rightPanel}>
          <NodePropertiesPanel
            selectedNodes={Array.from(selectedNodes)}
            project={project}
            onNodeUpdate={onNodeUpdate}
          />
        </View>
      </View>

      {/* 底部状态栏 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          节点: {project.nodes.size} | 连接: {project.connections.size} |
          缩放: {Math.round(project.viewport.scale * 100)}%
        </Text>
      </View>
    </View>
  );
}

interface ToolbarButtonProps {
  title: string;
  onPress: () => void;
}

function ToolbarButton({ title, onPress }: ToolbarButtonProps) {
  return (
    <TouchableOpacity style={styles.toolbarButton} onPress={onPress}>
      <Text style={styles.toolbarButtonText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

interface NodePaletteProps {
  onNodeCreate: (type: string) => void;
}

function NodePalette({ onNodeCreate }: NodePaletteProps) {
  const nodeTypes = [
    { type: 'scene', name: '场景节点', icon: '🎬', color: '#007bff' },
    { type: 'group', name: '组节点', icon: '📁', color: '#28a745' },
    { type: 'effect', name: '效果节点', icon: '✨', color: '#ffc107' },
  ];

  return (
    <View style={styles.palette}>
      <Text style={styles.paletteTitle}>节点库</Text>
      <ScrollView style={styles.paletteContent}>
        {nodeTypes.map(nodeType => (
          <PaletteItem
            key={nodeType.type}
            nodeType={nodeType}
            onSelect={() => onNodeCreate(nodeType.type)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface PaletteItemProps {
  nodeType: {
    type: string;
    name: string;
    icon: string;
    color: string;
  };
  onSelect: () => void;
}

function PaletteItem({ nodeType, onSelect }: PaletteItemProps) {
  return (
    <TouchableOpacity
      style={[styles.paletteItem, { borderLeftColor: nodeType.color }]}
      onPress={onSelect}
    >
      <Text style={styles.paletteIcon}>{nodeType.icon}</Text>
      <Text style={styles.paletteItemText}>
        {nodeType.name}
      </Text>
    </TouchableOpacity>
  );
}

interface CompositionCanvasProps {
  project: CompositionProject;
  selectedNodes: Set<string>;
  connectionMode: boolean;
  pendingConnection: { fromNodeId: string; x: number; y: number } | null;
  onNodeDrag: (nodeId: string, deltaX: number, deltaY: number) => void;
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onConnectionStart: (nodeId: string, x: number, y: number) => void;
  onConnectionEnd: (nodeId: string) => void;
  onProjectChange: (project: CompositionProject) => void;
}

function CompositionCanvas({
  project,
  selectedNodes,
  connectionMode,
  pendingConnection,
  onNodeDrag,
  onNodeSelect,
  onConnectionStart,
  onConnectionEnd,
  onProjectChange
}: CompositionCanvasProps) {
  return (
    <ScrollView
      style={styles.canvas}
      contentContainerStyle={styles.canvasContent}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {/* 网格背景 */}
      {project.settings.showGrid && (
        <GridBackground
          gridSize={project.settings.gridSize}
          viewport={project.viewport}
        />
      )}

      {/* 连接线 */}
      <ConnectionLayer
        connections={Array.from(project.connections.values())}
        nodes={project.nodes}
        pendingConnection={pendingConnection}
      />

      {/* 节点 */}
      <NodeLayer
        nodes={Array.from(project.nodes.values())}
        selectedNodes={selectedNodes}
        connectionMode={connectionMode}
        onNodeDrag={onNodeDrag}
        onNodeSelect={onNodeSelect}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
      />
    </ScrollView>
  );
}

interface GridBackgroundProps {
  gridSize: number;
  viewport: { x: number; y: number; scale: number };
}

function GridBackground({ gridSize, viewport }: GridBackgroundProps) {
  return (
    <View style={styles.gridBackground}>
      {/* 网格线实现 */}
    </View>
  );
}

interface ConnectionLayerProps {
  connections: SceneConnection[];
  nodes: Map<string, SceneCompositionNode>;
  pendingConnection: { fromNodeId: string; x: number; y: number } | null;
}

function ConnectionLayer({ connections, nodes, pendingConnection }: ConnectionLayerProps) {
  return (
    <View style={styles.connectionLayer}>
      {connections.map(connection => {
        const fromNode = nodes.get(connection.fromNodeId);
        const toNode = nodes.get(connection.toNodeId);

        if (!fromNode || !toNode) return null;

        return (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            fromNode={fromNode}
            toNode={toNode}
          />
        );
      })}

      {/* 正在拖拽的连接线 */}
      {pendingConnection && (
        <PendingConnectionLine
          fromNode={nodes.get(pendingConnection.fromNodeId)}
          toX={pendingConnection.x}
          toY={pendingConnection.y}
        />
      )}
    </View>
  );
}

interface ConnectionLineProps {
  connection: SceneConnection;
  fromNode: SceneCompositionNode;
  toNode: SceneCompositionNode;
}

function ConnectionLine({ connection, fromNode, toNode }: ConnectionLineProps) {
  // 计算连接线路径
  const fromX = fromNode.x + fromNode.width / 2;
  const fromY = fromNode.y + fromNode.height / 2;
  const toX = toNode.x + toNode.width / 2;
  const toY = toNode.y + toNode.height / 2;

  return (
    <View
      style={[
        styles.connectionLine,
        {
          position: 'absolute',
          left: Math.min(fromX, toX),
          top: Math.min(fromY, toY),
          width: Math.abs(toX - fromX),
          height: Math.abs(toY - fromY),
          borderColor: connection.style.color,
          borderWidth: connection.style.width
        }
      ]}
    />
  );
}

interface PendingConnectionLineProps {
  fromNode?: SceneCompositionNode;
  toX: number;
  toY: number;
}

function PendingConnectionLine({ fromNode, toX, toY }: PendingConnectionLineProps) {
  if (!fromNode) return null;

  const fromX = fromNode.x + fromNode.width / 2;
  const fromY = fromNode.y + fromNode.height / 2;

  return (
    <View
      style={[
        styles.pendingConnectionLine,
        {
          position: 'absolute',
          left: Math.min(fromX, toX),
          top: Math.min(fromY, toY),
          width: Math.abs(toX - fromX),
          height: Math.abs(toY - fromY)
        }
      ]}
    />
  );
}

interface NodeLayerProps {
  nodes: SceneCompositionNode[];
  selectedNodes: Set<string>;
  connectionMode: boolean;
  onNodeDrag: (nodeId: string, deltaX: number, deltaY: number) => void;
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onConnectionStart: (nodeId: string, x: number, y: number) => void;
  onConnectionEnd: (nodeId: string) => void;
}

function NodeLayer({
  nodes,
  selectedNodes,
  connectionMode,
  onNodeDrag,
  onNodeSelect,
  onConnectionStart,
  onConnectionEnd
}: NodeLayerProps) {
  return (
    <View style={styles.nodeLayer}>
      {nodes.map(node => (
        <CompositionNode
          key={node.id}
          node={node}
          selected={selectedNodes.has(node.id)}
          connectionMode={connectionMode}
          onDrag={(deltaX, deltaY) => onNodeDrag(node.id, deltaX, deltaY)}
          onSelect={(multiSelect) => onNodeSelect(node.id, multiSelect)}
          onConnectionStart={(x, y) => onConnectionStart(node.id, x, y)}
          onConnectionEnd={() => onConnectionEnd(node.id)}
        />
      ))}
    </View>
  );
}

interface CompositionNodeProps {
  node: SceneCompositionNode;
  selected: boolean;
  connectionMode: boolean;
  onDrag: (deltaX: number, deltaY: number) => void;
  onSelect: (multiSelect: boolean) => void;
  onConnectionStart: (x: number, y: number) => void;
  onConnectionEnd: () => void;
}

function CompositionNode({
  node,
  selected,
  connectionMode,
  onDrag,
  onSelect,
  onConnectionStart,
  onConnectionEnd
}: CompositionNodeProps) {
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const startPosition = useRef({ x: 0, y: 0 });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      startPosition.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
      setDragPosition({ x: 0, y: 0 });
    },

    onPanResponderMove: (evt, gestureState) => {
      setDragPosition({
        x: gestureState.dx,
        y: gestureState.dy
      });
    },

    onPanResponderRelease: (evt, gestureState) => {
      onDrag(gestureState.dx, gestureState.dy);
      setDragPosition({ x: 0, y: 0 });
    },
  });

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.compositionNode,
        {
          left: node.x + dragPosition.x,
          top: node.y + dragPosition.y,
          width: node.width,
          height: node.height,
          backgroundColor: node.metadata.color,
          borderColor: selected ? '#007bff' : '#ddd',
          borderWidth: selected ? 3 : 1,
          opacity: node.opacity,
          zIndex: node.zIndex
        }
      ]}
    >
      <TouchableOpacity
        style={styles.nodeHeader}
        onPress={() => onSelect(false)}
      >
        <Text style={styles.nodeIcon}>{node.metadata.icon}</Text>
        <Text style={styles.nodeTitle}>{node.name}</Text>
      </TouchableOpacity>

      <View style={styles.nodeContent}>
        <Text style={styles.nodeType}>{node.type}</Text>
        <Text style={styles.nodeInfo}>
          {node.metadata.renderMode}
        </Text>
      </View>

      {/* 连接点 */}
      <View style={styles.connectionPoints}>
        <TouchableOpacity
          style={[styles.connectionPoint, styles.inputPoint]}
          onPress={() => {
            if (connectionMode) {
              onConnectionEnd();
            }
          }}
        />
        <TouchableOpacity
          style={[styles.connectionPoint, styles.outputPoint]}
          onPressIn={(event) => {
            const { pageX, pageY } = event.nativeEvent;
            onConnectionStart(pageX, pageY);
          }}
        />
      </View>
    </View>
  );
}

interface NodePropertiesPanelProps {
  selectedNodes: string[];
  project: CompositionProject;
  onNodeUpdate: (nodeId: string, updates: Partial<SceneCompositionNode>) => void;
}

function NodePropertiesPanel({ selectedNodes, project, onNodeUpdate }: NodePropertiesPanelProps) {
  if (selectedNodes.length === 0) {
    return (
      <View style={styles.propertiesPanel}>
        <Text style={styles.propertiesTitle}>属性面板</Text>
        <Text style={styles.noSelection}>请选择一个节点</Text>
      </View>
    );
  }

  const node = project.nodes.get(selectedNodes[0]);
  if (!node) return null;

  return (
    <View style={styles.propertiesPanel}>
      <Text style={styles.propertiesTitle}>节点属性</Text>
      <ScrollView style={styles.propertiesContent}>
        <PropertySection title="基本信息">
          <PropertyItem label="名称" value={node.name} />
          <PropertyItem label="类型" value={node.type} />
          <PropertyItem label="ID" value={node.id} />
        </PropertySection>

        <PropertySection title="变换">
          <PropertyItem label="X" value={node.x.toString()} />
          <PropertyItem label="Y" value={node.y.toString()} />
          <PropertyItem label="宽度" value={node.width.toString()} />
          <PropertyItem label="高度" value={node.height.toString()} />
        </PropertySection>

        <PropertySection title="渲染">
          <PropertyItem label="可见性" value={node.visible ? '是' : '否'} />
          <PropertyItem label="透明度" value={node.opacity.toString()} />
          <PropertyItem label="混合模式" value={node.blendMode} />
          <PropertyItem label="层级" value={node.zIndex.toString()} />
        </PropertySection>

        <PropertySection title="组合模式">
          {node.metadata.compositionModes.map((mode, index) => (
            <PropertyItem key={index} label={`模式 ${index + 1}`} value={mode} />
          ))}
        </PropertySection>
      </ScrollView>
    </View>
  );
}

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
}

function PropertySection({ title, children }: PropertySectionProps) {
  return (
    <View style={styles.propertySection}>
      <Text style={styles.propertySectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface PropertyItemProps {
  label: string;
  value: string;
}

function PropertyItem({ label, value }: PropertyItemProps) {
  return (
    <View style={styles.propertyItem}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={styles.propertyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  toolbar: {
    flexDirection: 'row',
    gap: 8,
  },

  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },

  toolbarButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },

  editorArea: {
    flex: 1,
    flexDirection: 'row',
  },

  leftPanel: {
    width: 240,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },

  rightPanel: {
    width: 280,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },

  canvasArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },

  canvas: {
    flex: 1,
  },

  canvasContent: {
    minWidth: 2000,
    minHeight: 2000,
  },

  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  connectionLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  nodeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  connectionLine: {
    borderStyle: 'solid',
  },

  pendingConnectionLine: {
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
  },

  compositionNode: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  nodeIcon: {
    fontSize: 16,
    marginRight: 6,
  },

  nodeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },

  nodeContent: {
    padding: 8,
  },

  nodeType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  nodeInfo: {
    fontSize: 11,
    color: '#999',
  },

  connectionPoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  connectionPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  inputPoint: {
    left: -6,
    top: '50%',
    marginTop: -6,
  },

  outputPoint: {
    right: -6,
    top: '50%',
    marginTop: -6,
  },

  palette: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  paletteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  paletteContent: {
    flex: 1,
  },

  paletteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderLeftWidth: 3,
  },

  paletteIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  paletteItemText: {
    fontSize: 13,
    color: '#333',
  },

  propertiesPanel: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  propertiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  propertiesContent: {
    flex: 1,
  },

  noSelection: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },

  propertySection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  propertySectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 8,
  },

  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },

  propertyLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },

  propertyValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },

  statusBar: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },

  statusText: {
    fontSize: 11,
    color: '#666',
  },
});

export default SceneCompositionEditor;
