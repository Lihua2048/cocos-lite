import { PLAY_ANIMATION, PAUSE_ANIMATION, STOP_ANIMATION } from "../actions";
import { EditorActionType } from '../types';

export const playAnimation = (entityId: string, animationName: string) => ({
  type: "PLAY_ANIMATION" as EditorActionType,
  payload: { entityId, animationName }
});
export const pauseAnimation = (entityId: string) => ({
  type: "PAUSE_ANIMATION" as EditorActionType,
  payload: { entityId }
});

export const stopAnimation = (entityId: string) => ({
  type: STOP_ANIMATION,
  payload: { entityId }
});
