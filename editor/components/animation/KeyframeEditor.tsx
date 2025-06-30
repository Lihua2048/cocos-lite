import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

interface Keyframe {
  time: number;
  value: number;
}

export default function KeyframeEditor({
  entityId,
  propertyName
}: {
  entityId: string;
  propertyName: string
}) {
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    { time: 0, value: 0 },
    { time: 1, value: 100 }
  ]);

  const addKeyframe = () => {
    setKeyframes([...keyframes, {
      time: keyframes.length * 0.5,
      value: 0
    }]);
  };

  const updateKeyframe = (index: number, field: keyof Keyframe, value: number) => {
    const updated = [...keyframes];
    updated[index][field] = value;
    setKeyframes(updated);
  };

  return (
    <View style={{ padding: 10 }}>
      <Text>{propertyName} 动画编辑</Text>
      {keyframes.map((frame, index) => (
        <View key={index} style={{ flexDirection: 'row' }}>
          <TextInput
            value={frame.time.toString()}
            onChangeText={(text) => updateKeyframe(index, 'time', parseFloat(text))}
          />
          <TextInput
            value={frame.value.toString()}
            onChangeText={(text) => updateKeyframe(index, 'value', parseFloat(text))}
          />
        </View>
      ))}
      <Button title="添加关键帧" onPress={addKeyframe} />
    </View>
  );
}
