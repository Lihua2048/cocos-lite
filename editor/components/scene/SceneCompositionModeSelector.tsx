import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, SceneCompositionMode } from '../../../core/types';
import { setSceneCompositionMode } from '../../../core/actions';

export default function SceneCompositionModeSelector() {
  const dispatch = useDispatch();
  const { mode } = useSelector((state: RootState) => ({
    mode: state.editor.sceneComposition.mode
  }));

  const handleModeChange = (newMode: SceneCompositionMode) => {
    dispatch(setSceneCompositionMode(newMode));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>组合模式</Text>
      <Picker
        selectedValue={mode}
        onValueChange={handleModeChange}
        style={styles.picker}
      >
        <Picker.Item label="默认模式" value={SceneCompositionMode.DEFAULT} />
        <Picker.Item label="叠加模式" value={SceneCompositionMode.OVERLAY} />
        <Picker.Item label="混合模式" value={SceneCompositionMode.MIXED} />
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 20,
    position: 'relative',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  picker: {
    minWidth: 100,
    height: 32,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
});
