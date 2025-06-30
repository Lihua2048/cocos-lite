import { editorReducer } from '../core/reducer';
import { addEntity, playAnimation } from '../core/actions';
import { Entity, EditorState } from '../core/types';

test('should handle ADD_ENTITY with animation', () => {
  const entity: Entity = {
    id: 'test',
    type: 'sprite',
    position: { x: 0, y: 0 },
    properties: {
      width: 1,
      height: 1,
      color: [1, 1, 1, 1] as [number, number, number, number], // 明确元组类型
      texture: 'test.png'
    },
    components: [],
    animation: {
      playing: false,
      currentAnimation: '',
      currentTime: 0
    }
  };

  const result = editorReducer(undefined, addEntity(entity));
  expect(result.entities[entity.id]).toMatchObject(entity);
});

test('should handle animation actions', () => {
  const entityId = 'test';
  const initialState: EditorState = {
    entities: {
      [entityId]: {
        id: entityId,
        type: 'sprite',
        position: { x: 0, y: 0 },
        properties: {
          width: 100,
          height: 100,
          color: [1, 1, 1, 1] as [number, number, number, number] // 明确元组类型
        },
        components: [],
        animation: {
          playing: false,
          currentAnimation: '',
          currentTime: 0
        }
      }
    },
    selectedEntityId: entityId,
    textures: [],
    animations: {}
  };

  // 测试播放动画
  const playState = editorReducer(initialState, playAnimation(entityId, 'walk'));

  // 添加安全检查避免 undefined 错误
  const entity = playState.entities[entityId];
  expect(entity).toBeDefined();
  expect(entity?.animation?.playing).toBe(true);
});
