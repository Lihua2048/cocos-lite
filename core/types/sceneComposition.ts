export enum SceneCompositionMode {
  DEFAULT = 'default',      // 默认模式：单场景切换
  OVERLAY = 'overlay',      // 叠加模式：多场景叠加渲染
  MIXED = 'mixed'           // 混合模式：场景锁定功能
}

export interface SceneLockState {
  [sceneId: string]: boolean; // true表示锁定(🔒)，false表示解锁(🔓)
}

export interface SceneCompositionState {
  mode: SceneCompositionMode;
  selectedScenes: string[];    // 叠加模式下选中的场景
  lockedScenes: SceneLockState; // 混合模式下的锁定状态
}
