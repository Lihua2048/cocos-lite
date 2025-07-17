import { BlueprintNode, BlueprintConnection } from '../types/blueprint';

// Action类型定义
export const ADD_BLUEPRINT_NODE = 'ADD_BLUEPRINT_NODE';
export const UPDATE_BLUEPRINT_NODE = 'UPDATE_BLUEPRINT_NODE';
export const DELETE_BLUEPRINT_NODE = 'DELETE_BLUEPRINT_NODE';
export const CONNECT_BLUEPRINT_NODES = 'CONNECT_BLUEPRINT_NODES';
export const DISCONNECT_BLUEPRINT_NODES = 'DISCONNECT_BLUEPRINT_NODES';
export const SET_BLUEPRINT_ZOOM = 'SET_BLUEPRINT_ZOOM';
export const SET_BLUEPRINT_PAN = 'SET_BLUEPRINT_PAN';
export const UNDO_BLUEPRINT_ACTION = 'UNDO_BLUEPRINT_ACTION';
export const REDO_BLUEPRINT_ACTION = 'REDO_BLUEPRINT_ACTION';
export const AUTO_LAYOUT_BLUEPRINT = 'AUTO_LAYOUT_BLUEPRINT';
export const CLEAR_BLUEPRINT = 'CLEAR_BLUEPRINT';

// Action接口定义
export interface AddBlueprintNodeAction {
  type: typeof ADD_BLUEPRINT_NODE;
  payload: BlueprintNode;
}

export interface UpdateBlueprintNodeAction {
  type: typeof UPDATE_BLUEPRINT_NODE;
  payload: BlueprintNode;
}

export interface DeleteBlueprintNodeAction {
  type: typeof DELETE_BLUEPRINT_NODE;
  payload: string; // nodeId
}

export interface ConnectBlueprintNodesAction {
  type: typeof CONNECT_BLUEPRINT_NODES;
  payload: BlueprintConnection;
}

export interface DisconnectBlueprintNodesAction {
  type: typeof DISCONNECT_BLUEPRINT_NODES;
  payload: string; // connectionId
}

export interface SetBlueprintZoomAction {
  type: typeof SET_BLUEPRINT_ZOOM;
  payload: number;
}

export interface SetBlueprintPanAction {
  type: typeof SET_BLUEPRINT_PAN;
  payload: { x: number; y: number };
}

export interface UndoBlueprintAction {
  type: typeof UNDO_BLUEPRINT_ACTION;
}

export interface RedoBlueprintAction {
  type: typeof REDO_BLUEPRINT_ACTION;
}

export interface AutoLayoutBlueprintAction {
  type: typeof AUTO_LAYOUT_BLUEPRINT;
}

export interface ClearBlueprintAction {
  type: typeof CLEAR_BLUEPRINT;
}

export type BlueprintAction =
  | AddBlueprintNodeAction
  | UpdateBlueprintNodeAction
  | DeleteBlueprintNodeAction
  | ConnectBlueprintNodesAction
  | DisconnectBlueprintNodesAction
  | SetBlueprintZoomAction
  | SetBlueprintPanAction
  | UndoBlueprintAction
  | RedoBlueprintAction
  | AutoLayoutBlueprintAction
  | ClearBlueprintAction;

// Action创建函数
export const addBlueprintNode = (node: BlueprintNode): AddBlueprintNodeAction => ({
  type: ADD_BLUEPRINT_NODE,
  payload: node
});

export const updateBlueprintNode = (node: BlueprintNode): UpdateBlueprintNodeAction => ({
  type: UPDATE_BLUEPRINT_NODE,
  payload: node
});

export const deleteBlueprintNode = (nodeId: string): DeleteBlueprintNodeAction => ({
  type: DELETE_BLUEPRINT_NODE,
  payload: nodeId
});

export const connectBlueprintNodes = (connection: BlueprintConnection): ConnectBlueprintNodesAction => ({
  type: CONNECT_BLUEPRINT_NODES,
  payload: connection
});

export const disconnectBlueprintNodes = (connectionId: string): DisconnectBlueprintNodesAction => ({
  type: DISCONNECT_BLUEPRINT_NODES,
  payload: connectionId
});

export const setBlueprintZoom = (zoom: number): SetBlueprintZoomAction => ({
  type: SET_BLUEPRINT_ZOOM,
  payload: zoom
});

export const setBlueprintPan = (pan: { x: number; y: number }): SetBlueprintPanAction => ({
  type: SET_BLUEPRINT_PAN,
  payload: pan
});

export const undoBlueprintAction = (): UndoBlueprintAction => ({
  type: UNDO_BLUEPRINT_ACTION
});

export const redoBlueprintAction = (): RedoBlueprintAction => ({
  type: REDO_BLUEPRINT_ACTION
});

export const autoLayoutBlueprint = (): AutoLayoutBlueprintAction => ({
  type: AUTO_LAYOUT_BLUEPRINT
});

export const clearBlueprint = (): ClearBlueprintAction => ({
  type: CLEAR_BLUEPRINT
});