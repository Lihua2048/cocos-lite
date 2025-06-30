

import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { saveAnimation } from '../../../core/actions';
import { RootState, TextureResource, Entity } from '../../../core/types';
import { Picker } from '@react-native-picker/picker';

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
  // 获取全局 textures、entities、selectedEntityId
  const textures = useSelector((state: RootState) => state.textures);
  const entities = useSelector((state: RootState) => state.entities);
  const selectedEntityId = useSelector((state: RootState) => state.selectedEntityId);
  const selectedEntity: Entity | undefined = selectedEntityId ? entities[selectedEntityId] : undefined;

  // 关键帧初始值：如实体有纹理则用实体纹理，否则空
  const getDefaultTexture = () => selectedEntity?.properties.texture || '';
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    {
      time: 0,
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
      color: [1, 0, 0, 1],
      texture: getDefaultTexture()
    },
    {
      time: 1,
      position: { x: 100, y: 100 },
      width: 100,
      height: 100,
      color: [1, 0, 0, 1],
      texture: getDefaultTexture()
    }
  ]);
  const [animationName, setAnimationName] = useState('');
  const dispatch = useDispatch();

  // 保存动画到全局，自动排序和过滤非法帧
  const handleSave = () => {
    if (keyframes.length < 2) return;
    // 动画名自动补全 test+数字
    let name = animationName;
    // 获取所有动画名，找 test+数字 最大值
    let allNames: string[] = [];
    if ((window as any).store?.getState) {
      allNames = Object.keys((window as any).store.getState().animations || {});
    } else {
      // 兼容 redux hooks
      try {
        // @ts-ignore
        const reduxState = require('react-redux').useStore?.()?.getState?.();
        if (reduxState && reduxState.animations) {
          allNames = Object.keys(reduxState.animations);
        }
      } catch {}
    }
    let maxNum = 0;
    allNames.forEach(n => {
      const m = n.match(/^test(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
    });
    if (!name) {
      name = `test${maxNum + 1}`;
    } else if (/^test\d+$/.test(name)) {
      // 如果当前输入名也是 test+数字，自动递进
      const curNum = parseInt(name.replace('test', ''));
      if (curNum <= maxNum) {
        name = `test${maxNum + 1}`;
      }
    }
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
    dispatch(saveAnimation(name, propertyName, sorted));
    setAnimationName('');
  };

  const addKeyframe = () => {
    // 新关键帧的 time 默认等于最后一帧 time + 1，其他属性复制上一帧，texture优先实体纹理
    const last = keyframes.length > 0 ? keyframes[keyframes.length - 1] : undefined;
    setKeyframes([
      ...keyframes,
      last
        ? {
            ...last,
            time: last.time + 1,
            texture: last.texture || getDefaultTexture()
          }
        : {
            time: 0,
            position: { x: 0, y: 0 },
            width: 100,
            height: 100,
            color: [1, 0, 0, 1],
            texture: getDefaultTexture()
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
          <Picker
            selectedValue={frame.texture}
            style={{ width: 100, marginHorizontal: 2 }}
            onValueChange={value => updateKeyframe(index, 'texture', value)}
          >
            <Picker.Item label="无纹理" value="" />
            {textures.map((texture: TextureResource) =>
              typeof texture === 'string' ? (
                <Picker.Item key={texture} label={texture} value={texture} />
              ) : (
                <Picker.Item key={texture.id} label={texture.name} value={texture.id} />
              )
            )}
          </Picker>
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
