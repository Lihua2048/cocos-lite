import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './editor/store';
import Canvas from './editor/components/canvas/Canvas';
import PropertiesPanel from './editor/components/properties/PropertiesPanel';
import EntityListPane from './editor/components/resources/EntityListPanel';
import Button from './ui/Button';

export default function App() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Text style={styles.title}>简易Cocos Creator</Text>
        <View style={styles.editorLayout}>
          <Canvas />
          <PropertiesPanel />
        </View>
        <EntityListPane />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  editorLayout: {
    flex: 1,
    flexDirection: 'row',
  },
});
