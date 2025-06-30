

import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { saveAnimation } from '../../../core/actions';

interface Keyframe {
  time: number;
  value: number;
}

export default function KeyframeEditor({
  propertyName
}: {
  propertyName: string
}) {

  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    { time: 0, value: 0 },
    { time: 1, value: 100 }
  ]);
  const [animationName, setAnimationName] = useState('');
  const dispatch = useDispatch();

  // 保存动画到全局，自动排序和过滤非法帧
  const handleSave = () => {
    if (!animationName || keyframes.length < 2) return;
    // 排序并过滤非法帧，并自动修正 time 非递增问题
    let sorted = keyframes
      .filter(f => typeof f.time === 'number' && !isNaN(f.time))
      .sort((a, b) => a.time - b.time);
    // 自动修正 time 非递增
    sorted = sorted.map((f, i, arr) => {
      if (i === 0) return f;
      if (f.time <= arr[i - 1].time) {
        return { ...f, time: arr[i - 1].time + 1 };
      }
      return f;
    });
    dispatch(saveAnimation(animationName, propertyName, sorted));
    setAnimationName('');
  };

  const addKeyframe = () => {
    // 新关键帧的 time 默认等于最后一帧 time + 1
    const lastTime = keyframes.length > 0 ? keyframes[keyframes.length - 1].time : 0;
    setKeyframes([
      ...keyframes,
      {
        time: lastTime + 1,
        value: 0
      }
    ]);
  };

  const updateKeyframe = (index: number, field: keyof Keyframe, value: number) => {
    const updated = [...keyframes];
    updated[index][field] = value;
    setKeyframes(updated);
  };

  return (
    <View style={{ padding: 10 }}>
      <Text>{propertyName} 动画关键帧编辑</Text>
      {keyframes.map((frame, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text>时间:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 50, marginHorizontal: 4 }}
            value={frame.time.toString()}
            onChangeText={(text) => updateKeyframe(index, 'time', parseFloat(text))}
            keyboardType="numeric"
          />
          <Text>值:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 50, marginHorizontal: 4 }}
            value={frame.value.toString()}
            onChangeText={(text) => updateKeyframe(index, 'value', parseFloat(text))}
            keyboardType="numeric"
          />
        </View>
      ))}
      <Button title="添加关键帧" onPress={addKeyframe} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text>动画名称：</Text>
        <TextInput
          style={{ borderWidth: 1, width: 100, marginHorizontal: 4 }}
          value={animationName}
          onChangeText={setAnimationName}
        />
        <Button title="保存动画" onPress={handleSave} />
      </View>
    </View>
  );
}
