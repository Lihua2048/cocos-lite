import { createStore } from 'redux';
import { editorReducer } from '../core/reducer';
import { EditorState, EditorAction } from '../core/types';

const initialState: EditorState = {
  entities: {},
  selectedEntityId: null
};

// 使用类型参数明确指定类型
export const store = createStore<EditorState, EditorAction, {}, {}>(
  editorReducer,
  initialState
);
