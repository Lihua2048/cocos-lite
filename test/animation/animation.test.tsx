import React from 'react';
import { render } from '@testing-library/react-native';
import { AnimationSystem } from '../../animation/AnimationSystem';
import { Animation } from '../../animation/Animation';
import { AnimationCurve } from '../../animation/AnimationCurve';

describe('AnimationSystem', () => {
  let system: AnimationSystem;
  let animation: Animation;

  beforeEach(() => {
    system = new AnimationSystem();
    animation = new Animation();
    animation.duration = 1.0;
    animation.curves = [
      {
        startTime: 0,
        endTime: 1,
        easing: t => t,
        evaluate: jest.fn()
      }
    ];
    system.registerAnimation('test', animation);
  });

  test('should play animation', () => {
    system.play('test');
    const state = system.getAnimationState('test');
    expect(state).toBeDefined();
  });

  test('should update animation state', () => {
    system.play('test');
    const state = system.getAnimationState('test');
    if (state) {
      state.update(0.5);
      expect(animation.curves[0].evaluate).toHaveBeenCalled();
    }
  });
});
