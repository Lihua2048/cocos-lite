import { STOP_ANIMATION } from "../actions";
export const playAnimation = (entityId, animationName) => ({
    type: "PLAY_ANIMATION",
    payload: { entityId, animationName }
});
export const pauseAnimation = (entityId) => ({
    type: "PAUSE_ANIMATION",
    payload: { entityId }
});
export const stopAnimation = (entityId) => ({
    type: STOP_ANIMATION,
    payload: { entityId }
});
//# sourceMappingURL=AnimationActions.js.map