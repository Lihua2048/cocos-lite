
import React, { useState, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../core/types';
import { updateEntityProperty } from '../../../core/actions';


export default function AnimationControls({ entityId }: { entityId: string }) {
  const animations = useSelector((state: RootState) => state.animations) || {};
  const [selectedAnim, setSelectedAnim] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [playTime, setPlayTime] = useState(0);
  const [loop, setLoop] = useState(false);
  const rafRef = useRef<number | null>(null);
  const dispatch = useDispatch();

  const handlePlay = () => {
    if (!selectedAnim || !animations[selectedAnim] || !entityId) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    setPlayTime(0);
    // 只派发播放动画动作，动画插值和 position.x 更新交给 Canvas 渲染主循环
    dispatch({ type: 'PLAY_ANIMATION', payload: { entityId, name: selectedAnim } });
  };

  // 线性插值
  function interpolateKeyframes(frames: { time: number; value: number }[], t: number): number {
    if (frames.length === 0) return 0;
    if (frames.length === 1) return frames[0].value;
    if (t <= frames[0].time) return frames[0].value;
    if (t >= frames[frames.length - 1].time) return frames[frames.length - 1].value;
    for (let i = 0; i < frames.length - 1; i++) {
      const a = frames[i];
      const b = frames[i + 1];
      if (t >= a.time && t <= b.time) {
        const ratio = (t - a.time) / (b.time - a.time);
        // 帧内输出由主循环控制
        return a.value + (b.value - a.value) * ratio;
      }
    }
    return 0;
  }

  // 移除本地动画主循环，全部交由 Canvas 渲染主循环推进

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setPlayTime(0);
    // 派发暂停动画动作
    dispatch({ type: 'PAUSE_ANIMATION', payload: { entityId } });
  };

  return (
    <View style={{ padding: 10 }}>
      <Text>动画控制</Text>
      <Picker
        selectedValue={selectedAnim}
        onValueChange={(itemValue) => setSelectedAnim(itemValue)}
      >
        <Picker.Item label="请选择动画" value="" />
        {Object.keys(animations).map(anim => (
          <Picker.Item key={anim} label={anim} value={anim} />
        ))}
      </Picker>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
        <Text>循环播放</Text>
        <Button
          title={loop ? '开' : '关'}
          onPress={() => setLoop(l => !l)}
          color={loop ? 'green' : 'gray'}
        />
      </View>
      <Button title={isPlaying ? "播放中..." : "播放"} onPress={handlePlay} disabled={isPlaying || !selectedAnim} />
      <Button title="停止" onPress={handleStop} disabled={!isPlaying} />
      {isPlaying && <Text>当前时间: {playTime.toFixed(2)}s</Text>}
    </View>
  );
}
