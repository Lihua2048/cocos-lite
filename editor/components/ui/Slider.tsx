import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Slider({
  min,
  max,
  value,
  onChange
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void
}) {
  return (
    <View style={styles.container}>
      <Text>{value}</Text>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { margin: 10 }
});
