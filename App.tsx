import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { store } from "./editor/store";

import Canvas from "./editor/components/canvas/Canvas";
import PropertiesPanel from "./editor/components/properties/PropertiesPanel";
import EntityListPane from "./editor/components/resources/EntityListPanel";
import ResourceManager from "./core/resources/ResourceManager";
import ResourceManagerPanel from "./editor/components/resources/ResourceManagerPanel";

export default function App() {
  const resourceManager = useRef(new ResourceManager());

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Text style={styles.title}>简易Cocos Creator</Text>
        <View style={styles.editorLayout}>
          <View style={styles.leftPanel}>
            <EntityListPane />
            <ResourceManagerPanel resourceManager={resourceManager.current} />
          </View>
          <View style={styles.centerPanel}>
            <Canvas resourceManager={resourceManager.current} />
          </View>
          <View style={styles.rightPanel}>
            <PropertiesPanel />
          </View>
        </View>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  editorLayout: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: 200,
    backgroundColor: "#eee",
    paddingRight: 8,
  },
  centerPanel: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 8,
  },
  rightPanel: {
    width: 320,
    backgroundColor: "#fafafa",
    paddingLeft: 8,
  },
});
