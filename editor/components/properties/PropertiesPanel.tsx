import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

// 定义完整的根状态类型
interface RootState {
  selectedEntityId: string | null;
  entities: Record<string, EntityState>;
}

interface EntityState {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  properties: {
    width: number;
    height: number;
    color: [number, number, number, number];
  };
}

export default function PropertiesPanel() {
  // 使用正确的类型
  const selectedEntityId = useSelector((state: RootState) => state.selectedEntityId);
  const entities = useSelector((state: RootState) => state.entities);

  const selectedEntity = selectedEntityId ? entities[selectedEntityId] : null;

  return (
    <View style={styles.container}>
      {selectedEntity ? (
        <>
          <Text style={styles.title}>选中实体属性</Text>
          <Text style={styles.property}>ID: {selectedEntity.id}</Text>
          <Text style={styles.property}>类型: {selectedEntity.type}</Text>
          <Text style={styles.property}>
            位置: X: {Math.round(selectedEntity.position.x)} Y: {Math.round(selectedEntity.position.y)}
          </Text>
          <Text style={styles.property}>
            尺寸: 宽: {selectedEntity.properties.width} 高: {selectedEntity.properties.height}
          </Text>
          <Text style={styles.property}>
            颜色: R: {selectedEntity.properties.color[0].toFixed(2)} G: {selectedEntity.properties.color[1].toFixed(2)} B: {selectedEntity.properties.color[2].toFixed(2)}
          </Text>
        </>
      ) : (
        <Text style={styles.noSelection}>未选择实体</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginLeft: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  property: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    paddingVertical: 4,
  },
  noSelection: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
