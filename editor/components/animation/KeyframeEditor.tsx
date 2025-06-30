

import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { saveAnimation } from '../../../core/actions';

interface Keyframe {
  time: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  color: [number, number, number, number];
  texture: string;
}

export default function KeyframeEditor({
  propertyName
}: {
  propertyName: string
}) {

  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    {
      time: 0,
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
      color: [1, 0, 0, 1],
      texture: ''
    },
    {
      time: 1,
      position: { x: 100, y: 100 },
      width: 100,
      height: 100,
      color: [1, 0, 0, 1],
      texture: ''
    }
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
    // 新关键帧的 time 默认等于最后一帧 time + 1，其他属性复制上一帧
    const last = keyframes.length > 0 ? keyframes[keyframes.length - 1] : undefined;
    setKeyframes([
      ...keyframes,
      last
        ? {
            ...last,
            time: last.time + 1
          }
        : {
            time: 0,
            position: { x: 0, y: 0 },
            width: 100,
            height: 100,
            color: [1, 0, 0, 1],
            texture: ''
          }
    ]);
  };

  // 支持嵌套属性的更新
  const updateKeyframe = (index: number, field: keyof Keyframe | string, value: any) => {
    const updated = [...keyframes];
    if (field.startsWith('position.')) {
      const axis = field.split('.')[1];
      updated[index].position = { ...updated[index].position, [axis]: value };
    } else if (field === 'color') {
      updated[index].color = value;
    } else {
      (updated[index] as any)[field] = value;
    }
    setKeyframes(updated);
  };

  return (
    <View style={{ padding: 10 }}>
      <Text>{propertyName} 动画关键帧编辑</Text>
      {keyframes.map((frame, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
          <Text>时间:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 50, marginHorizontal: 4 }}
            value={frame.time.toString()}
            onChangeText={(text) => updateKeyframe(index, 'time', parseFloat(text))}
            keyboardType="numeric"
          />
          <Text> x:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 40, marginHorizontal: 2 }}
            value={frame.position.x.toString()}
            onChangeText={text => updateKeyframe(index, 'position.x', parseFloat(text))}
            keyboardType="numeric"
          />
          <Text> y:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 40, marginHorizontal: 2 }}
            value={frame.position.y.toString()}
            onChangeText={text => updateKeyframe(index, 'position.y', parseFloat(text))}
            keyboardType="numeric"
          />
          <Text> width:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 40, marginHorizontal: 2 }}
            value={frame.width.toString()}
            onChangeText={text => updateKeyframe(index, 'width', parseFloat(text))}
            keyboardType="numeric"
          />
          <Text> height:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 40, marginHorizontal: 2 }}
            value={frame.height.toString()}
            onChangeText={text => updateKeyframe(index, 'height', parseFloat(text))}
            keyboardType="numeric"
          />
          <Text> color:</Text>
          {frame.color.map((c, ci) => (
            <TextInput
              key={ci}
              style={{ borderWidth: 1, width: 30, marginHorizontal: 1 }}
              value={c.toString()}
              onChangeText={text => {
                const newColor = [...frame.color] as [number, number, number, number];
                newColor[ci] = parseFloat(text);
                updateKeyframe(index, 'color', newColor);
              }}
              keyboardType="numeric"
            />
          ))}
          <Text> texture:</Text>
          <TextInput
            style={{ borderWidth: 1, width: 60, marginHorizontal: 2 }}
            value={frame.texture}
            onChangeText={text => updateKeyframe(index, 'texture', text)}
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
