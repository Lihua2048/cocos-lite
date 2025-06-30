import React from 'react';
import { View, TextInput as NativeTextInput, StyleSheet } from 'react-native';

export default function TextInput({
  label,
  value,
  onChangeText
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void
}) {
  return (
    <View style={styles.container}>
      <div>{label}</div>
      <NativeTextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  input: {
    height: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 8
  }
});
