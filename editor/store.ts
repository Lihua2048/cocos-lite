import { configureStore } from '@reduxjs/toolkit';
import { editorReducer } from '../core/reducer';

const initialState  = {
  entities: {},
  selectedEntityId: null,
  textures: [],
  animations: {},
  physicsRunning: true,
};

export const store = configureStore({
  reducer: editorReducer,
  preloadedState: initialState,
});
