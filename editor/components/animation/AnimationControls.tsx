import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { playAnimation as playAnimationAction, pauseAnimation as pauseAnimationAction } from '../../../core/animation/AnimationActions'
interface AnimationControlProps {
  entityId: string;
  availableAnimations: string[];
}

export default function AnimationControls({
  entityId,
  availableAnimations
}: AnimationControlProps) {
  const [selectedAnim, setSelectedAnim] = useState('');
  const dispatch = useDispatch();

  const handlePlay = () => {
    if (selectedAnim && entityId) {
      dispatch(playAnimationAction(entityId, selectedAnim)); // 使用正确的action
      console.log('播放动画', selectedAnim, entityId);
    }
  };

  const handlePause = () => {
    if (entityId) {
      dispatch(pauseAnimationAction(entityId)); // 使用正确的action
    }
  };

  return (
    <View style={{ padding: 10 }}>
      <Text>动画控制</Text>
      <select
        value={selectedAnim}
        onChange={(e) => setSelectedAnim(e.target.value)}
      >
        {availableAnimations.map(anim => (
          <option key={anim} value={anim}>{anim}</option>
        ))}
      </select>
      <Button title="播放" onPress={handlePlay} />
      <Button title="暂停" onPress={handlePause} /> {/* 使用正确的处理函数 */}
    </View>
  );
}
