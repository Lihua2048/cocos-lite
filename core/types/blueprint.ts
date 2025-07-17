// 蓝图节点类型定义
export interface BlueprintNode {
  id: string;
  type: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  inputs: string[];
  outputs: string[];
  data: Record<string, any>;
  style: {
    backgroundColor: string;
    width: number;
    height: number;
  };
}

// 蓝图连接类型定义
export interface BlueprintConnection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
  style: {
    color: string;
    width: number;
  };
}

// 蓝图状态类型定义
export interface BlueprintState {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
  history: {
    past: BlueprintHistoryEntry[];
    future: BlueprintHistoryEntry[];
  };
  canUndo: boolean;
  canRedo: boolean;
}

// 历史记录条目
export interface BlueprintHistoryEntry {
  nodes: BlueprintNode[];
  connections: BlueprintConnection[];
}

// 自动布局配置
export interface AutoLayoutConfig {
  nodeSpacing: number;
  rankSpacing: number;
  direction: 'TB' | 'BT' | 'LR' | 'RL';
}