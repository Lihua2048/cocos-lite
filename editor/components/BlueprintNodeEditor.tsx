/**
 * 蓝图节点编辑器 - 基于demo-free-layout-simple实现
 * 提供节点拖拽、连线创建、缩放、自动布局、撤销/重做、Minimap等功能
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';

// 蓝图节点类型定义
export interface BlueprintNode {
  id: string;
  name: string;
  type: 'action' | 'event' | 'condition' | 'variable' | 'function';
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: NodePort[];
  outputs: NodePort[];
  properties: Record<string, any>;
  color: string;
}

export interface NodePort {
  id: string;
  name: string;
  type: 'exec' | 'data' | 'object';
  dataType?: 'string' | 'number' | 'boolean' | 'vector' | 'object';
  x: number;
  y: number;
}

export interface BlueprintConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  type: 'exec' | 'data';
  color: string;
}

export interface BlueprintProject {
  id: string;
  name: string;
  nodes: Map<string, BlueprintNode>;
  connections: Map<string, BlueprintConnection>;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  selectedNodes: Set<string>;
  history: {
    states: any[];
    currentIndex: number;
  };
}

interface BlueprintNodeEditorProps {
  project?: BlueprintProject;
  onProjectChange?: (project: BlueprintProject) => void;
  onNodeSelect?: (nodeIds: string[]) => void;
}

const GRID_SIZE = 20;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3.0;

// 默认节点模板
const NODE_TEMPLATES = {
  action: {
    type: 'action' as const,
    width: 150,
    height: 60,
    color: '#4a90e2',
    inputs: [{ id: 'exec_in', name: '', type: 'exec' as const, x: 0, y: 30 }],
    outputs: [{ id: 'exec_out', name: '', type: 'exec' as const, x: 150, y: 30 }]
  },
  event: {
    type: 'event' as const,
    width: 120,
    height: 50,
    color: '#e74c3c',
    inputs: [],
    outputs: [{ id: 'exec_out', name: '', type: 'exec' as const, x: 120, y: 25 }]
  },
  condition: {
    type: 'condition' as const,
    width: 130,
    height: 70,
    color: '#f39c12',
    inputs: [{ id: 'exec_in', name: '', type: 'exec' as const, x: 0, y: 35 }],
    outputs: [
      { id: 'true', name: 'True', type: 'exec' as const, x: 130, y: 20 },
      { id: 'false', name: 'False', type: 'exec' as const, x: 130, y: 50 }
    ]
  },
  variable: {
    type: 'variable' as const,
    width: 100,
    height: 40,
    color: '#9b59b6',
    inputs: [],
    outputs: [{ id: 'value', name: 'Value', type: 'data' as const, x: 100, y: 20 }]
  }
};

export default function BlueprintNodeEditor({ 
  project: initialProject, 
  onProjectChange,
  onNodeSelect 
}: BlueprintNodeEditorProps) {
  // 创建默认项目
  const createDefaultProject = (): BlueprintProject => ({
    id: 'default',
    name: 'Blueprint Project',
    nodes: new Map(),
    connections: new Map(),
    viewport: { x: 0, y: 0, scale: 1.0 },
    selectedNodes: new Set(),
    history: { states: [], currentIndex: -1 }
  });

  const [project, setProject] = useState<BlueprintProject>(
    initialProject || createDefaultProject()
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'none' | 'node' | 'viewport' | 'connection'>('none');
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    portId: string;
    x: number;
    y: number;
  } | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const canvasRef = useRef<ScrollView>(null);
  const screenSize = Dimensions.get('window');

  // Pan Responder for node dragging
  const createNodePanResponder = (nodeId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        setDraggedNode(nodeId);
        setIsDragging(true);
        setDragMode('node');
        
        // 选中被拖拽的节点
        const newProject = {
          ...project,
          selectedNodes: new Set([nodeId])
        };
        setProject(newProject);
        onProjectChange?.(newProject);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (dragMode !== 'node' || !draggedNode) return;
        
        const node = project.nodes.get(draggedNode);
        if (!node) return;
        
        const newX = node.x + gestureState.dx / project.viewport.scale;
        const newY = node.y + gestureState.dy / project.viewport.scale;
        
        const newNodes = new Map(project.nodes);
        newNodes.set(draggedNode, { ...node, x: newX, y: newY });
        
        const newProject = { ...project, nodes: newNodes };
        setProject(newProject);
      },
      
      onPanResponderRelease: () => {
        if (dragMode === 'node' && draggedNode) {
          // 保存到历史记录
          const newProject = saveToHistory(project);
          setProject(newProject);
          onProjectChange?.(newProject);
        }
        
        setIsDragging(false);
        setDragMode('none');
        setDraggedNode(null);
      }
    });
  };

  // 保存历史状态
  const saveToHistory = useCallback((newProject: BlueprintProject) => {
    const history = { ...newProject.history };
    history.states = history.states.slice(0, history.currentIndex + 1);
    history.states.push(JSON.parse(JSON.stringify(newProject)));
    history.currentIndex = history.states.length - 1;
    
    if (history.states.length > 50) {
      history.states.shift();
      history.currentIndex--;
    }
    
    return { ...newProject, history };
  }, []);

  // 撤销
  const undo = useCallback(() => {
    if (project.history.currentIndex > 0) {
      const newIndex = project.history.currentIndex - 1;
      const prevState = project.history.states[newIndex];
      const newProject = { ...prevState, history: { ...project.history, currentIndex: newIndex } };
      setProject(newProject);
      onProjectChange?.(newProject);
    }
  }, [project, onProjectChange]);

  // 重做
  const redo = useCallback(() => {
    if (project.history.currentIndex < project.history.states.length - 1) {
      const newIndex = project.history.currentIndex + 1;
      const nextState = project.history.states[newIndex];
      const newProject = { ...nextState, history: { ...project.history, currentIndex: newIndex } };
      setProject(newProject);
      onProjectChange?.(newProject);
    }
  }, [project, onProjectChange]);

  // 添加节点
  const addNode = useCallback((type: keyof typeof NODE_TEMPLATES, x: number, y: number) => {
    const template = NODE_TEMPLATES[type];
    const nodeId = `node_${Date.now()}`;
    
    const newNode: BlueprintNode = {
      id: nodeId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      type: template.type,
      x: x - template.width / 2,
      y: y - template.height / 2,
      width: template.width,
      height: template.height,
      inputs: template.inputs.map(port => ({ ...port, id: `${nodeId}_${port.id}` })),
      outputs: template.outputs.map(port => ({ ...port, id: `${nodeId}_${port.id}` })),
      properties: {},
      color: template.color
    };

    const newNodes = new Map(project.nodes);
    newNodes.set(nodeId, newNode);
    
    const newProject = saveToHistory({ ...project, nodes: newNodes });
    setProject(newProject);
    onProjectChange?.(newProject);
  }, [project, saveToHistory, onProjectChange]);

  // 删除选中节点
  const deleteSelectedNodes = useCallback(() => {
    if (project.selectedNodes.size === 0) return;

    const newNodes = new Map(project.nodes);
    const newConnections = new Map(project.connections);

    // 删除节点
    project.selectedNodes.forEach(nodeId => {
      newNodes.delete(nodeId);
    });

    // 删除相关连接
    newConnections.forEach((connection, connectionId) => {
      if (project.selectedNodes.has(connection.fromNodeId) || 
          project.selectedNodes.has(connection.toNodeId)) {
        newConnections.delete(connectionId);
      }
    });

    const newProject = saveToHistory({
      ...project,
      nodes: newNodes,
      connections: newConnections,
      selectedNodes: new Set()
    });
    
    setProject(newProject);
    onProjectChange?.(newProject);
  }, [project, saveToHistory, onProjectChange]);

  // 自动布局
  const autoLayout = useCallback(() => {
    const nodes = Array.from(project.nodes.values());
    if (nodes.length === 0) return;

    // 简单的网格布局
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 200;

    const newNodes = new Map(project.nodes);
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const updatedNode = {
        ...node,
        x: col * spacing + 100,
        y: row * spacing + 100
      };
      
      newNodes.set(node.id, updatedNode);
    });

    const newProject = saveToHistory({ ...project, nodes: newNodes });
    setProject(newProject);
    onProjectChange?.(newProject);
  }, [project, saveToHistory, onProjectChange]);

  // 缩放
  const zoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, project.viewport.scale + delta));
    
    let newX = project.viewport.x;
    let newY = project.viewport.y;
    
    if (centerX !== undefined && centerY !== undefined) {
      const scaleRatio = newScale / project.viewport.scale;
      newX = centerX - (centerX - project.viewport.x) * scaleRatio;
      newY = centerY - (centerY - project.viewport.y) * scaleRatio;
    }

    const newProject = {
      ...project,
      viewport: { x: newX, y: newY, scale: newScale }
    };
    
    setProject(newProject);
    onProjectChange?.(newProject);
  }, [project, onProjectChange]);

  // 处理端口点击（创建连接）
  const handlePortPress = useCallback((nodeId: string, portId: string, portType: 'input' | 'output') => {
    const node = project.nodes.get(nodeId);
    if (!node) return;

    const port = portType === 'input' 
      ? node.inputs.find(p => p.id === portId)
      : node.outputs.find(p => p.id === portId);
    
    if (!port) return;

    if (!connectionStart) {
      // 开始创建连接（只能从输出端口开始）
      if (portType === 'output') {
        setConnectionStart({
          nodeId,
          portId,
          x: node.x + port.x,
          y: node.y + port.y
        });
        setDragMode('connection');
      }
    } else {
      // 完成连接（只能连接到输入端口）
      if (portType === 'input' && connectionStart.nodeId !== nodeId) {
        const connectionId = `conn_${Date.now()}`;
        const newConnection: BlueprintConnection = {
          id: connectionId,
          fromNodeId: connectionStart.nodeId,
          fromPortId: connectionStart.portId,
          toNodeId: nodeId,
          toPortId: portId,
          type: port.type === 'exec' ? 'exec' : 'data',
          color: port.type === 'exec' ? '#fff' : '#007acc'
        };

        const newConnections = new Map(project.connections);
        newConnections.set(connectionId, newConnection);
        
        const newProject = saveToHistory({
          ...project,
          connections: newConnections
        });
        
        setProject(newProject);
        onProjectChange?.(newProject);
      }
      
      // 重置连接状态
      setConnectionStart(null);
      setDragMode('none');
    }
  }, [project, connectionStart, saveToHistory, onProjectChange]);

  // 渲染节点
  const renderNode = (node: BlueprintNode) => {
    const isSelected = project.selectedNodes.has(node.id);
    const panResponder = createNodePanResponder(node.id);
    
    return (
      <View
        key={node.id}
        {...panResponder.panHandlers}
        style={[
          styles.node,
          {
            left: node.x * project.viewport.scale + project.viewport.x,
            top: node.y * project.viewport.scale + project.viewport.y,
            width: node.width * project.viewport.scale,
            height: node.height * project.viewport.scale,
            backgroundColor: node.color,
            borderColor: isSelected ? '#fff' : 'transparent',
            borderWidth: isSelected ? 2 : 0,
            opacity: draggedNode === node.id ? 0.7 : 1
          }
        ]}
      >
        <Text style={[styles.nodeText, { fontSize: 12 * project.viewport.scale }]}>
          {node.name}
        </Text>
        
        {/* 输入端口 */}
        {node.inputs.map(port => (
          <TouchableOpacity
            key={port.id}
            style={[
              styles.port,
              styles.inputPort,
              {
                left: port.x * project.viewport.scale - 6,
                top: port.y * project.viewport.scale - 6,
                width: 12 * project.viewport.scale,
                height: 12 * project.viewport.scale
              }
            ]}
            onPress={() => handlePortPress(node.id, port.id, 'input')}
          />
        ))}
        
        {/* 输出端口 */}
        {node.outputs.map(port => (
          <TouchableOpacity
            key={port.id}
            style={[
              styles.port,
              styles.outputPort,
              {
                left: port.x * project.viewport.scale - 6,
                top: port.y * project.viewport.scale - 6,
                width: 12 * project.viewport.scale,
                height: 12 * project.viewport.scale
              }
            ]}
            onPress={() => handlePortPress(node.id, port.id, 'output')}
          />
        ))}
      </View>
    );
  };

  // 渲染连接线
  const renderConnections = () => {
    return Array.from(project.connections.values()).map(connection => {
      const fromNode = project.nodes.get(connection.fromNodeId);
      const toNode = project.nodes.get(connection.toNodeId);
      
      if (!fromNode || !toNode) return null;
      
      const fromPort = fromNode.outputs.find(p => p.id === connection.fromPortId);
      const toPort = toNode.inputs.find(p => p.id === connection.toPortId);
      
      if (!fromPort || !toPort) return null;
      
      const startX = (fromNode.x + fromPort.x) * project.viewport.scale + project.viewport.x;
      const startY = (fromNode.y + fromPort.y) * project.viewport.scale + project.viewport.y;
      const endX = (toNode.x + toPort.x) * project.viewport.scale + project.viewport.x;
      const endY = (toNode.y + toPort.y) * project.viewport.scale + project.viewport.y;
      
      return (
        <View
          key={connection.id}
          style={[
            styles.connection,
            {
              left: Math.min(startX, endX),
              top: Math.min(startY, endY),
              width: Math.abs(endX - startX),
              height: Math.abs(endY - startY)
            }
          ]}
        />
      );
    });
  };

  // 渲染工具栏
  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <TouchableOpacity style={styles.toolButton} onPress={() => addNode('event', 200, 200)}>
        <Text style={styles.toolButtonText}>Event</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.toolButton} onPress={() => addNode('action', 200, 200)}>
        <Text style={styles.toolButtonText}>Action</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.toolButton} onPress={() => addNode('condition', 200, 200)}>
        <Text style={styles.toolButtonText}>Condition</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.toolButton} onPress={() => addNode('variable', 200, 200)}>
        <Text style={styles.toolButtonText}>Variable</Text>
      </TouchableOpacity>
      
      <View style={styles.toolSeparator} />
      
      <TouchableOpacity 
        style={styles.toolButton} 
        onPress={undo}
        disabled={project.history.currentIndex <= 0}
      >
        <Text style={[styles.toolButtonText, { opacity: project.history.currentIndex <= 0 ? 0.5 : 1 }]}>
          Undo
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolButton} 
        onPress={redo}
        disabled={project.history.currentIndex >= project.history.states.length - 1}
      >
        <Text style={[styles.toolButtonText, { opacity: project.history.currentIndex >= project.history.states.length - 1 ? 0.5 : 1 }]}>
          Redo
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.toolButton} onPress={autoLayout}>
        <Text style={styles.toolButtonText}>Auto Layout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.toolButton} onPress={deleteSelectedNodes}>
        <Text style={styles.toolButtonText}>Delete</Text>
      </TouchableOpacity>
      
      <View style={styles.toolSeparator} />
      
      <TouchableOpacity style={styles.toolButton} onPress={() => zoom(0.1)}>
        <Text style={styles.toolButtonText}>Zoom In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.toolButton} onPress={() => zoom(-0.1)}>
        <Text style={styles.toolButtonText}>Zoom Out</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolButton} 
        onPress={() => setShowMinimap(!showMinimap)}
      >
        <Text style={styles.toolButtonText}>{showMinimap ? 'Hide' : 'Show'} Minimap</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染Minimap
  const renderMinimap = () => {
    if (!showMinimap) return null;
    
    const minimapScale = 0.1;
    const minimapWidth = 200;
    const minimapHeight = 150;
    
    return (
      <View style={[styles.minimap, { width: minimapWidth, height: minimapHeight }]}>
        <Text style={styles.minimapTitle}>Minimap</Text>
        <View style={styles.minimapCanvas}>
          {Array.from(project.nodes.values()).map(node => (
            <View
              key={`minimap_${node.id}`}
              style={[
                styles.minimapNode,
                {
                  left: node.x * minimapScale,
                  top: node.y * minimapScale,
                  width: node.width * minimapScale,
                  height: node.height * minimapScale,
                  backgroundColor: node.color
                }
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderToolbar()}
      
      <View style={styles.editorArea}>
        <ScrollView
          ref={canvasRef}
          style={styles.canvas}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          maximumZoomScale={MAX_SCALE}
          minimumZoomScale={MIN_SCALE}
          bounces={false}
        >
          <View style={styles.grid}>
            {/* 网格背景 */}
            <View style={styles.gridPattern} />
            
            {/* 连接线 */}
            {renderConnections()}
            
            {/* 节点 */}
            {Array.from(project.nodes.values()).map(renderNode)}
          </View>
        </ScrollView>
        
        {renderMinimap()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d2d30'
  },
  
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#3e3e42',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  
  toolButton: {
    backgroundColor: '#007acc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginVertical: 2
  },
  
  toolButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  
  toolSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#555',
    marginHorizontal: 8
  },
  
  editorArea: {
    flex: 1,
    position: 'relative'
  },
  
  canvas: {
    flex: 1,
    backgroundColor: '#1e1e1e'
  },
  
  grid: {
    width: 5000,
    height: 5000,
    position: 'relative'
  },
  
  gridPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent'
  },
  
  node: {
    position: 'absolute',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  
  nodeText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  
  port: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff'
  },
  
  inputPort: {
    backgroundColor: '#333'
  },
  
  outputPort: {
    backgroundColor: '#666'
  },
  
  connection: {
    position: 'absolute',
    borderTopWidth: 2,
    borderColor: '#007acc'
  },
  
  minimap: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 8
  },
  
  minimapTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center'
  },
  
  minimapCanvas: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 4,
    position: 'relative'
  },
  
  minimapNode: {
    position: 'absolute',
    borderRadius: 1
  }
});