export declare const store: import("@reduxjs/toolkit").EnhancedStore<import("../core/types").EditorState, import("../core/actions").EditorAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<import("../core/types").EditorState, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
