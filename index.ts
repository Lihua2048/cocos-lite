import { AppRegistry, Platform } from 'react-native';
import type { AppRegistry as AppRegistryType } from 'react-native';
import App from './App';

interface AppProps {
  platform: 'web' | 'android' | 'ios';
}

const appName: string = 'ademo';

// 注册应用组件
AppRegistry.registerComponent(appName, () => App);

// Web平台特定逻辑
if (Platform.OS === 'web') {
  const rootTag: HTMLElement | null = document.getElementById('root');

  if (rootTag) {
    const initialProps: AppProps = {
      platform: 'web'
    };

    AppRegistry.runApplication(appName, {
      rootTag,
      initialProps
    });
  }
}