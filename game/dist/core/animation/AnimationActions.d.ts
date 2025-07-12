import { EditorActionType } from '../types';
export declare const playAnimation: (entityId: string, animationName: string) => {
    type: EditorActionType;
    payload: {
        entityId: string;
        animationName: string;
    };
};
export declare const pauseAnimation: (entityId: string) => {
    type: EditorActionType;
    payload: {
        entityId: string;
    };
};
export declare const stopAnimation: (entityId: string) => {
    type: string;
    payload: {
        entityId: string;
    };
};
