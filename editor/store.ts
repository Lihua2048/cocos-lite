import { createStore } from 'redux';
import { editorReducer } from '../core/reducer';
import { EditorState} from '../core/types';
import { EditorAction } from '../core/actions';

const initialState  = {
  entities: {},
  selectedEntityId: null,
  textures: [],
  animations: {},
};

export const store = createStore(editorReducer, initialState);
