export interface EditorState {
  entities: Record<string, Entity>;
  selectedEntityId: string | null;
  textures: TextureResource[];
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
    texture?: string;
  };
  components: Component[];
}

export type EntityProperty =
  | keyof Pick<Entity['properties'], 'width' | 'height' | 'color' | 'texture'>
  | keyof Entity['position']
  | 'texture';  // 明确添加 'texture' 类型

  // 新增资源类型
export interface TextureResource {
  id: string;
  name: string;
  url: string;
}


