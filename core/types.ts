export interface EditorState {
  entities: Record<string, Entity>;
  selectedEntityId: string | null;
  textures: TextureResource[];
  animations: Record<string, Animation>;
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
  animation?: EntityAnimation;
}

export type EntityProperty =
  | keyof Pick<Entity['properties'], 'width' | 'height' | 'color' | 'texture'>
  | keyof Entity['position']

  // 新增资源类型
export type TextureResource = string | {
  id: string;
  name: string;
  url: string;
};

// 添加动画相关action类型

export type EditorActionType =
  | "ADD_ENTITY"
  | "SELECT_ENTITY"
  | "UPDATE_ENTITY"
  | "REMOVE_ENTITY"
  | "ADD_TEXTURE"
  | "UPDATE_ENTITY_TEXTURE"
  | "PLAY_ANIMATION"
  | "PAUSE_ANIMATION"
  | "STOP_ANIMATION"
  | "SAVE_ANIMATION";

export interface Animation {
  propertyName: string;
  keyframes: { time: number; value: number }[];
}

export interface EntityAnimation {
  playing: boolean;
  currentAnimation?: string;
  currentTime: number;
  loop?: boolean;
}

// 添加默认动画状态
export function createDefaultEntity(id: string, type: string): Entity {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    properties: {
      width: 100,
      height: 100,
      color: [1, 0, 0, 1],
    },
    components: [],
    animation: {
      playing: false,
      currentAnimation: '',
      currentTime: 0
    }
  };
}




