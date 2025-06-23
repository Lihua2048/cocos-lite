import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import PropertiesPanel from '../editor/components/properties/PropertiesPanel';

// 设置类型安全的setImmediate polyfill
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
  selectedEntityId: null,
  entities: {}
}));

test('PropertiesPanel组件渲染正常', () => {
  const { getByText } = render(
    <Provider store={mockStore}>
      <PropertiesPanel />
    </Provider>
  );
  expect(getByText('未选择实体')).toBeTruthy();
});
