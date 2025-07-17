# 蓝图节点编辑器实现文档

## 概述

基于 `demo-free-layout-simple` 目录的参考实现，在当前项目的 `editor/components` 目录下实现了完整的蓝图节点编辑器功能。该编辑器具备节点拖拽、连线创建、缩放、自动布局、撤销/重做、Minimap小地图导航等核心功能，并与当前项目的 Redux store、类型系统、action 系统完全集成。

## 主要功能特性

### 1. 节点拖拽与添加功能
- **节点模板系统**: 支持 Event、Action、Condition、Variable 四种基础节点类型
- **拖拽操作**: 实现了基于 PanResponder 的流畅节点拖拽体验
- **节点添加**: 通过工具栏按钮可快速添加不同类型的节点
- **节点选择**: 支持单选和多选节点操作

### 2. 连线创建功能
- **端口连接**: 输出端口到输入端口的连接创建
- **连接类型**: 支持执行连接(exec)和数据连接(data)两种类型
- **连接验证**: 确保连接的有效性和类型匹配
- **可视化反馈**: 不同类型的连接显示不同颜色

### 3. 缩放与视图控制
- **缩放功能**: 支持 0.1x 到 3.0x 的缩放范围
- **视口控制**: 平移和缩放的流畅交互
- **缩放中心**: 基于鼠标位置的智能缩放中心计算

### 4. 自动布局
- **网格布局**: 智能的网格式自动布局算法
- **间距控制**: 可配置的节点间距设置
- **布局优化**: 自动优化节点位置减少重叠

### 5. 撤销/重做系统
- **历史记录**: 完整的操作历史记录管理
- **状态快照**: 每次操作自动保存状态快照
- **限制管理**: 最多保存50个历史状态，防止内存溢出
- **操作恢复**: 支持撤销和重做操作

### 6. Minimap小地图导航
- **缩略图显示**: 实时显示所有节点的缩略图
- **导航功能**: 可通过小地图快速定位和导航
- **可控制显示**: 支持显示/隐藏小地图
- **同步更新**: 与主画布实时同步

## 文件结构

```
editor/components/
├── BlueprintNodeEditor.tsx     # 主要的蓝图编辑器组件
├── EditorModeToggle.tsx        # 三段式模式切换器
└── ...

core/
├── types.ts                    # 添加了蓝图相关类型定义
├── actions.ts                  # 添加了蓝图相关Actions
├── reducer.ts                  # 添加了蓝图状态管理
└── ...

App.tsx                         # 集成了模式切换和条件渲染
```

## 类型定义

### 核心类型

```typescript
// 蓝图节点
interface BlueprintNode {
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

// 节点端口
interface NodePort {
  id: string;
  name: string;
  type: 'exec' | 'data' | 'object';
  dataType?: 'string' | 'number' | 'boolean' | 'vector' | 'object';
  x: number;
  y: number;
}

// 蓝图连接
interface BlueprintConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  type: 'exec' | 'data';
  color: string;
}
```

## Redux 集成

### Actions

```typescript
// 编辑器模式切换
SET_EDITOR_MODE: 'canvas' | 'blueprint'

// 蓝图项目管理
SET_BLUEPRINT_PROJECT
ADD_BLUEPRINT_NODE
UPDATE_BLUEPRINT_NODE
DELETE_BLUEPRINT_NODE

// 连接管理
ADD_BLUEPRINT_CONNECTION
DELETE_BLUEPRINT_CONNECTION

// 选择和视图
SELECT_BLUEPRINT_NODES
SET_BLUEPRINT_VIEWPORT
```

### State 集成

蓝图编辑器状态已完全集成到主 EditorState 中：

```typescript
interface EditorState {
  // ... 现有字段
  blueprintEditor: BlueprintEditorState;
  editorMode: 'canvas' | 'blueprint';
}
```

## 使用方式

### 1. 模式切换

在应用顶部使用三段式开关：
- **第一个按钮**: 切换到蓝图节点编辑器
- **第二个按钮**: 切换到当前的画布编辑器
- **第三个按钮**: 预留模式（暂未实现）

### 2. 节点操作

- **添加节点**: 点击工具栏的节点类型按钮
- **拖拽节点**: 直接拖拽节点进行移动
- **选择节点**: 点击节点进行选择
- **删除节点**: 选中节点后点击 Delete 按钮

### 3. 连接操作

- **创建连接**: 点击输出端口，然后点击目标输入端口
- **删除连接**: 选择连接后使用删除功能（可扩展）

### 4. 视图控制

- **缩放**: 使用 Zoom In/Zoom Out 按钮
- **自动布局**: 点击 Auto Layout 按钮
- **撤销/重做**: 使用 Undo/Redo 按钮
- **小地图**: 使用 Show/Hide Minimap 切换

## 技术特点

### 1. 性能优化
- 使用 Map 数据结构优化节点和连接的查找性能
- 基于 React.memo 和 useCallback 优化渲染性能
- 智能的状态更新，避免不必要的重渲染

### 2. 交互体验
- 流畅的拖拽体验，支持实时预览
- 直观的端口连接操作
- 响应式的缩放和平移操作
- 清晰的视觉反馈和状态指示

### 3. 扩展性设计
- 插件化的节点类型系统
- 可配置的连接规则
- 灵活的布局算法
- 模块化的组件架构

## 集成说明

### 1. 在 App.tsx 中的集成

```typescript
// 条件渲染蓝图编辑器或画布编辑器
{editorMode === 'blueprint' ? (
  <BlueprintNodeEditor 
    project={blueprintEditor.currentProject || undefined}
    onProjectChange={(project) => {
      dispatch({ type: 'SET_BLUEPRINT_PROJECT', payload: project });
    }}
    onNodeSelect={(nodeIds) => {
      dispatch({ type: 'SELECT_BLUEPRINT_NODES', payload: { nodeIds } });
    }}
  />
) : (
  // 原有的画布编辑器布局
  <CanvasEditorLayout />
)}
```

### 2. 顶部工具栏集成

在 `managerSection` 中添加了 `EditorModeToggle` 组件，提供便捷的模式切换功能。

## 后续扩展建议

### 1. 高级功能
- **节点分组**: 支持节点的分组和折叠
- **子图系统**: 支持嵌套的子蓝图编辑
- **节点搜索**: 快速查找和定位节点
- **连接管理**: 批量连接操作和连接优化

### 2. 性能优化
- **虚拟化渲染**: 大型蓝图的虚拟化渲染
- **增量更新**: 更精细的状态更新策略
- **内存管理**: 优化大型项目的内存使用

### 3. 用户体验
- **快捷键支持**: 常用操作的键盘快捷键
- **主题系统**: 可自定义的编辑器主题
- **工具提示**: 详细的操作指导和帮助信息

## 总结

本实现完全基于项目需求，参考了 demo-free-layout-simple 的设计理念，实现了一个功能完整、性能优秀、易于扩展的蓝图节点编辑器。该编辑器与现有项目架构完美集成，提供了与当前画布编辑器并列的编辑体验，为用户提供了更加灵活和强大的可视化编程工具。