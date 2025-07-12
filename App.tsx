import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { store } from "./editor/store";

import Canvas from "./editor/components/canvas/Canvas";
import PropertiesPanel from "./editor/components/properties/PropertiesPanel";
import EntityListPane from "./editor/components/resources/EntityListPanel";
import ResourceManager from "./core/resources/ResourceManager";
import ResourceManagerPanel from "./editor/components/resources/ResourceManagerPanel";
import SceneManagerPanel from "./editor/components/scene/SceneManagerPanel";
import BuildManagerPanel from "./build/BuildManagerPanel";

export default function App() {
  const resourceManager = useRef(new ResourceManager());

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Text style={styles.title}>简易Cocos Creator</Text>
        <View style={styles.editorLayout}>
          {/* 顶部场景管理栏 */}
          <SceneManagerPanel />
          {/* 构建管理面板 */}
          <BuildManagerPanel />
          {/* 三栏布局：最左侧为组件栏 */}
          <View style={{ flexDirection: "row", height: "100%" }}>
            {/* 组件栏 */}
            <View
              style={{
                width: 120,
                backgroundColor: "#f5f5f5",
                borderRightWidth: 1,
                borderRightColor: "#ddd",
              }}
            >
              {require("./editor/components/ComponentPalette").default()}
            </View>
            {/* 中间主区：画布+底部资源区 */}
            <View style={{ flex: 1, flexDirection: "column", minWidth: 0 }}>
              <View style={styles.centerPanel}>
                <Canvas resourceManager={resourceManager.current} />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                  backgroundColor: "#f8f8f8",
                  borderTopWidth: 1,
                  borderTopColor: "#ddd",
                  minHeight: 120,
                }}
              >
                <View style={{ flex: 1 }}>
                  <EntityListPane />
                </View>
                <View style={{ flex: 1 }}>
                  <ResourceManagerPanel
                    resourceManager={resourceManager.current}
                  />
                </View>
              </View>
            </View>
            <View style={styles.rightPanel}>
              <PropertiesPanel />
            </View>
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
    width: 300,
    backgroundColor: "#eee",
    paddingRight: 8,
  },
  centerPanel: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 8,
    width: 1000,
  },
  rightPanel: {
    width: 320,
    backgroundColor: "#fafafa",
    paddingLeft: 8,
  },
});
