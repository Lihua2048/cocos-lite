export interface Keyframe {
  time: number;
  value: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface AnimationClip {
  duration: number;
  loops: boolean;
  keyframes: {
    position?: Keyframe[];
    scale?: Keyframe[];
    rotation?: Keyframe[];
  };
}
