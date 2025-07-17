import { BlueprintState, BlueprintNode, BlueprintConnection } from '../types/blueprint';
import {
  BlueprintAction,
  ADD_BLUEPRINT_NODE,
  UPDATE_BLUEPRINT_NODE,
  DELETE_BLUEPRINT_NODE,
  CONNECT_BLUEPRINT_NODES,
  DISCONNECT_BLUEPRINT_NODES,
  SET_BLUEPRINT_ZOOM,
  SET_BLUEPRINT_PAN,
  UNDO_BLUEPRINT_ACTION,
  REDO_BLUEPRINT_ACTION,
  AUTO_LAYOUT_BLUEPRINT,
  CLEAR_BLUEPRINT
} from '../actions/blueprintActions';

const initialState: BlueprintState = {
  nodes: [],
  connections: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: {
    past: [],
    future: []
  },
  canUndo: false,
  canRedo: false
};

// 保存当前状态到历史记录
const saveToHistory = (state: BlueprintState): BlueprintState => {
  const historyEntry = {
    nodes: [...state.nodes],
    connections: [...state.connections]
  };
  
  return {
    ...state,
    history: {
      past: [...state.history.past, historyEntry],
      future: []
    },
    canUndo: true,
    canRedo: false
  };
};

// 自动布局算法
const autoLayout = (nodes: BlueprintNode[]): BlueprintNode[] => {
  if (nodes.length === 0) return nodes;

  // 简单的分层布局算法
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();
  const layers: string[][] = [];
  
  // 找出所有没有输入的节点作为第一层
  const firstLayer = nodes.filter(node => {
    // 检查是否有其他节点连接到这个节点
    const hasInput = node.inputs.length > 0;
    return !hasInput;
  }).map(n => n.id);
  
  if (firstLayer.length > 0) {
    layers.push(firstLayer);
    firstLayer.forEach(id => visited.add(id));
  } else {
    // 如果没有明确的起始节点，选择第一个节点
    layers.push([nodes[0].id]);
    visited.add(nodes[0].id);
  }

  // 按层组织节点
  while (visited.size < nodes.length) {
    const currentLayer: string[] = [];
    
    for (const nodeId of layers[layers.length - 1]) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      
      // 找出所有连接到当前节点的节点
      nodes.forEach(n => {
        if (!visited.has(n.id) && node.outputs.length > 0) {
          currentLayer.push(n.id);
          visited.add(n.id);
        }
      });
    }
    
    if (currentLayer.length === 0) {
      // 添加剩余未访问的节点
      nodes.forEach(n => {
        if (!visited.has(n.id)) {
          currentLayer.push(n.id);
          visited.add(n.id);
        }
      });
    }
    
    if (currentLayer.length > 0) {
      layers.push(currentLayer);
    }
  }

  // 计算位置
  const horizontalSpacing = 200;
  const verticalSpacing = 120;
  
  return nodes.map(node => {
    let layerIndex = 0;
    let positionInLayer = 0;
    
    layers.forEach((layer, i) => {
      const index = layer.indexOf(node.id);
      if (index !== -1) {
        layerIndex = i;
        positionInLayer = index;
      }
    });
    
    const layerSize = layers[layerIndex].length;
    const layerWidth = layerSize * horizontalSpacing;
    const startX = -layerWidth / 2 + horizontalSpacing / 2;
    
    return {
      ...node,
      position: {
        x: startX + positionInLayer * horizontalSpacing + 400,
        y: layerIndex * verticalSpacing + 100
      }
    };
  });
};

export default function blueprintReducer(
  state = initialState,
  action: BlueprintAction
): BlueprintState {
  switch (action.type) {
    case ADD_BLUEPRINT_NODE:
      return {
        ...saveToHistory(state),
        nodes: [...state.nodes, action.payload]
      };

    case UPDATE_BLUEPRINT_NODE:
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id ? action.payload : node
        )
      };

    case DELETE_BLUEPRINT_NODE:
      return {
        ...saveToHistory(state),
        nodes: state.nodes.filter(node => node.id !== action.payload),
        connections: state.connections.filter(
          conn => conn.from !== action.payload && conn.to !== action.payload
        )
      };

    case CONNECT_BLUEPRINT_NODES:
      return {
        ...saveToHistory(state),
        connections: [...state.connections, action.payload]
      };

    case DISCONNECT_BLUEPRINT_NODES:
      return {
        ...saveToHistory(state),
        connections: state.connections.filter(conn => conn.id !== action.payload)
      };

    case SET_BLUEPRINT_ZOOM:
      return {
        ...state,
        zoom: action.payload
      };

    case SET_BLUEPRINT_PAN:
      return {
        ...state,
        pan: action.payload
      };

    case UNDO_BLUEPRINT_ACTION:
      if (state.history.past.length === 0) return state;
      
      const previousState = state.history.past[state.history.past.length - 1];
      const currentState = {
        nodes: state.nodes,
        connections: state.connections
      };
      
      return {
        ...state,
        nodes: previousState.nodes,
        connections: previousState.connections,
        history: {
          past: state.history.past.slice(0, -1),
          future: [currentState, ...state.history.future]
        },
        canUndo: state.history.past.length > 1,
        canRedo: true
      };

    case REDO_BLUEPRINT_ACTION:
      if (state.history.future.length === 0) return state;
      
      const nextState = state.history.future[0];
      const currentStateForHistory = {
        nodes: state.nodes,
        connections: state.connections
      };
      
      return {
        ...state,
        nodes: nextState.nodes,
        connections: nextState.connections,
        history: {
          past: [...state.history.past, currentStateForHistory],
          future: state.history.future.slice(1)
        },
        canUndo: true,
        canRedo: state.history.future.length > 1
      };

    case AUTO_LAYOUT_BLUEPRINT:
      return {
        ...saveToHistory(state),
        nodes: autoLayout(state.nodes)
      };

    case CLEAR_BLUEPRINT:
      return {
        ...saveToHistory(state),
        nodes: [],
        connections: []
      };

    default:
      return state;
  }
}