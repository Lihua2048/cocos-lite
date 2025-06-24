export interface EditorState {
  entities: Record<string, Entity>;
  selectedEntityId: string | null;
}

export type RootState = EditorState;

// 组件基础类型
export interface Component {
  type: string;
}

export interface Entity {
  id: string;
  type: string;
  position: { x: number; y: number };
  properties: {
    width: number;
    height: number;
    color: [number, number, number, number];
  };
  components: Component[];
}

export type EntityProperty =
  | keyof Pick<Entity['properties'], 'width' | 'height' | 'color'>
  | keyof Entity['position'];


