// 模拟React Native NativeModules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class {
    addListener = jest.fn();
    removeListener = jest.fn();
  };
});

// 模拟CanvasRenderingContext2D
const canvasMock = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
  })),
};

document.createElement = jest.fn(() => canvasMock as any);
