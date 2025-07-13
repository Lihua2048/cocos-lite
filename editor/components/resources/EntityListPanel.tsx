import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../core/types';

export default function EntityListPane() {
  const entitiesObject = useSelector((state: RootState) => state.editor.entities);
  const entities = useMemo(() => Object.values(entitiesObject || {}), [entitiesObject]);

  return (
    <View style={styles.container}>
      <Text>资源列表</Text>
      <FlatList
        data={entities}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <View style={styles.resourceItem}>
            <Text>{item.type} ({item.position.x}, {item.position.y})</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
  },
  resourceItem: {
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});
