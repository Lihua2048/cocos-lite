export const ADD_ENTITY = 'ADD_ENTITY';
export const REMOVE_ENTITY = 'REMOVE_ENTITY';
export const SELECT_ENTITY = 'SELECT_ENTITY';
export const UPDATE_ENTITY = 'UPDATE_ENTITY';


// 组件基础类型
export interface Component {
  type: string;
  // 其他通用组件属性
}

// 定义核心类型
export interface Entity {
  id: string;
  type: string; // 添加type属性
  position: { x: number; y: number }; // 添加position属性
  properties: { // 添加properties属性
    width: number;
    height: number;
    color: [number, number, number, number];
  };
  components: Component[];
}


export interface EditorState {
  entities: Record<string, Entity>;
  selectedEntityId: string | null;
}

// 定义 action 类型
export type EditorAction =
  | { type: 'ADD_ENTITY'; payload: Entity }
  | { type: 'SELECT_ENTITY'; payload: string | null }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; updates: Partial<Entity> } }
  | { type: 'REMOVE_ENTITY'; payload: { id: string } };

export type RootState = EditorState;

export type EntityProperty =
  | keyof Pick<Entity['properties'], 'width' | 'height' | 'color'>
  | keyof Entity['position'];
