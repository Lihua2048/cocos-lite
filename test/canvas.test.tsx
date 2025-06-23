import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Canvas from '../editor/components/canvas/Canvas';

// 设置setImmediate polyfill
declare global {
  namespace NodeJS {
    interface Global {
      setImmediate: (callback: (...args: any[]) => void, ...args: any[]) => any;
    }
  }
}
(global as any).setImmediate = (callback: (...args: any[]) => void) => {
  return setTimeout(callback, 0) as unknown as number;
};

// 创建测试用的Redux store
const mockStore = createStore(() => ({
  entities: {},
  selectedEntityId: null
}));

// Mock dispatch函数
const mockDispatch = jest.fn();

test('Canvas组件渲染正常', () => {
  const { getByText } = render(
    <Provider store={mockStore}>
      <Canvas />
    </Provider>
  );
  expect(getByText('拖拽添加实体')).toBeTruthy();
});

test('拖拽事件触发添加实体', () => {
  // 创建mock store enhancer
  const mockEnhancer = (createStore: any) => (reducer: any, initialState: any) => {
    const store = createStore(reducer, initialState);
    return {
      ...store,
      dispatch: mockDispatch
    };
  };

  const { getByText } = render(
    <Provider store={createStore(() => ({
      entities: {},
      selectedEntityId: null
    }), mockEnhancer)}>
      <Canvas />
    </Provider>
  );

  const canvas = getByText('拖拽添加实体').parent;

  // 完整的responder事件序列
  fireEvent(canvas, 'onStartShouldSetResponder', {
    nativeEvent: { locationX: 100, locationY: 200 },
    persist: jest.fn()
  });
  fireEvent(canvas, 'onResponderGrant', {
    nativeEvent: { locationX: 100, locationY: 200 },
    persist: jest.fn()
  });
  fireEvent(canvas, 'onResponderMove', {
    nativeEvent: { locationX: 101, locationY: 201 },
    persist: jest.fn()
  });

  // 验证dispatch被调用，不验证具体参数
  expect(mockDispatch).toHaveBeenCalled();
});
