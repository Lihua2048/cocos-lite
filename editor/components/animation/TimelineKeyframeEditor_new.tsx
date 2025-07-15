import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../core/types';
import { saveAnimation } from '../../../core/actions';
import './TimelineKeyframeEditor.css';

interface Keyframe {
  time: number;
  value: any;
  id: string;
}

interface AnimationTrack {
  property: string;
  keyframes: Keyframe[];
  color: string;
}

interface SavedAnimation {
  name: string;
  duration: number;
  frameStep: number;
  tracks: AnimationTrack[];
}

interface TimelineKeyframeEditorProps {
  entityId: string;
}

const TimelineKeyframeEditor: React.FC<TimelineKeyframeEditorProps> = ({
  entityId
}) => {
  const dispatch = useDispatch();
  const entity = useSelector((state: RootState) => state.editor.entities[entityId]);
  const savedAnimations = useSelector((state: RootState) => state.editor.animations || {});

  // 动画控制状态
  const [selectedAnimationName, setSelectedAnimationName] = useState('');
  const [duration, setDuration] = useState(10);
  const [frameStep, setFrameStep] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // 创建新动画状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAnimationName, setNewAnimationName] = useState('');
  const [newAnimationDuration, setNewAnimationDuration] = useState(10);
  const [newAnimationFrameStep, setNewAnimationFrameStep] = useState(0.5);

  // 编辑状态
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ trackIndex: number; keyframeIndex: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newKeyframeData, setNewKeyframeData] = useState<{ trackIndex: number; time: number; value: any } | null>(null);

  // UI设置
  const width = 700;
  const height = 180;
  const svgRef = useRef<SVGSVGElement>(null);

  // 获取当前实体的默认属性值
  const getEntityDefaultValues = () => {
    if (!entity) return {};
    return {
      'position.x': entity.position.x || 0,
      'position.y': entity.position.y || 0,
      'width': entity.properties.width || 100,
      'height': entity.properties.height || 50,
      'rotation': 0, // 默认值
      'color': entity.properties.color || [1, 1, 1, 1],
      'texture': entity.properties.texture || null
    };
  };

  // 初始化轨道（只有0秒的默认值）
  const initializeDefaultTracks = (): AnimationTrack[] => {
    const defaults = getEntityDefaultValues();
    return [
      {
        property: 'position.x',
        keyframes: [{ time: 0, value: defaults['position.x'], id: 'px_0' }],
        color: '#e74c3c'
      },
      {
        property: 'position.y',
        keyframes: [{ time: 0, value: defaults['position.y'], id: 'py_0' }],
        color: '#2ecc71'
      },
      {
        property: 'width',
        keyframes: [{ time: 0, value: defaults['width'], id: 'w_0' }],
        color: '#9b59b6'
      },
      {
        property: 'height',
        keyframes: [{ time: 0, value: defaults['height'], id: 'h_0' }],
        color: '#e67e22'
      },
      {
        property: 'rotation',
        keyframes: [{ time: 0, value: defaults['rotation'], id: 'r_0' }],
        color: '#f39c12'
      },
      {
        property: 'color',
        keyframes: [{ time: 0, value: defaults['color'], id: 'c_0' }],
        color: '#c0392b'
      },
      {
        property: 'texture',
        keyframes: [{ time: 0, value: defaults['texture'], id: 't_0' }],
        color: '#8e44ad'
      }
    ];
  };

  const [tracks, setTracks] = useState<AnimationTrack[]>(initializeDefaultTracks());

  // 计算时间轴的像素位置
  const timeToX = (time: number) => {
    return (time / duration) * (width - 140) + 90;
  };

  // 值轴位置计算
  const valueToY = (value: any, trackIndex: number) => {
    const lineHeight = 25;
    const lineY = trackIndex * lineHeight + 30;
    if (typeof value === 'number') {
      const normalizedValue = Math.max(-1, Math.min(1, value / 100));
      return lineY + normalizedValue * 8;
    }
    return lineY;
  };

  // 精确点击检测
  const findKeyframeAtTime = (trackIndex: number, clickTime: number) => {
    const track = tracks[trackIndex];
    return track.keyframes.findIndex(kf =>
      Math.abs(kf.time - clickTime) < frameStep / 2
    );
  };

  // 将时间对齐到步长网格
  const snapTimeToGrid = (time: number) => {
    return Math.round(time / frameStep) * frameStep;
  };

  // 处理关键帧点击
  const handleKeyframeClick = (trackIndex: number, keyframeIndex: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (selectedKeyframe?.trackIndex === trackIndex && selectedKeyframe?.keyframeIndex === keyframeIndex) {
      setIsEditing(!isEditing);
    } else {
      setSelectedKeyframe({ trackIndex, keyframeIndex });
      setIsEditing(true);
    }
  };

  // 处理轨道点击（创建新关键帧或选择现有）
  const handleTrackClick = (trackIndex: number, event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const clickTime = ((x - 90) / (width - 140)) * duration;
    const snappedTime = snapTimeToGrid(clickTime);

    // 检查是否点击到现有关键帧
    const existingIndex = findKeyframeAtTime(trackIndex, snappedTime);
    if (existingIndex !== -1) {
      handleKeyframeClick(trackIndex, existingIndex, event);
      return;
    }

    // 创建新关键帧
    setNewKeyframeData({ trackIndex, time: snappedTime, value: 0 });
    setIsCreatingNew(true);
    setIsEditing(false);
    setSelectedKeyframe(null);
  };

  // 确认创建新关键帧
  const confirmCreateKeyframe = () => {
    if (!newKeyframeData) return;

    const newTracks = [...tracks];
    const track = newTracks[newKeyframeData.trackIndex];

    const newKeyframe: Keyframe = {
      time: newKeyframeData.time,
      value: newKeyframeData.value,
      id: `${track.property}_${Date.now()}`
    };

    track.keyframes.push(newKeyframe);
    track.keyframes.sort((a, b) => a.time - b.time);
    setTracks(newTracks);

    setIsCreatingNew(false);
    setNewKeyframeData(null);
  };

  // 取消创建新关键帧
  const cancelCreateKeyframe = () => {
    setIsCreatingNew(false);
    setNewKeyframeData(null);
  };

  // 删除关键帧
  const deleteKeyframe = (trackIndex: number, keyframeIndex: number) => {
    const newTracks = [...tracks];
    // 防止删除0秒的默认关键帧
    if (newTracks[trackIndex].keyframes[keyframeIndex].time === 0) {
      alert('不能删除0秒的默认关键帧');
      return;
    }
    newTracks[trackIndex].keyframes.splice(keyframeIndex, 1);
    setTracks(newTracks);
    setSelectedKeyframe(null);
    setIsEditing(false);
  };

  // 更新关键帧值
  const updateKeyframeValue = (trackIndex: number, keyframeIndex: number, newValue: any) => {
    const newTracks = [...tracks];
    newTracks[trackIndex].keyframes[keyframeIndex].value = newValue;
    setTracks(newTracks);
  };

  // 重置动画（只保留0秒关键帧）
  const resetAnimation = () => {
    const resetTracks = tracks.map(track => ({
      ...track,
      keyframes: track.keyframes.filter(kf => kf.time === 0)
    }));
    setTracks(resetTracks);
    setSelectedKeyframe(null);
    setIsEditing(false);
  };

  // 创建新动画
  const createNewAnimation = () => {
    if (!newAnimationName.trim()) {
      alert('请输入动画名称');
      return;
    }

    setDuration(newAnimationDuration);
    setFrameStep(newAnimationFrameStep);
    setSelectedAnimationName(newAnimationName);

    // 重置轨道到默认状态
    setTracks(initializeDefaultTracks());

    setShowCreateDialog(false);
    setNewAnimationName('');
  };

  // 保存动画
  const saveCurrentAnimation = () => {
    if (!selectedAnimationName.trim()) {
      // 弹出对话框要求输入动画名称
      setShowCreateDialog(true);
      return;
    }

    // 多轨合一保存
    const keyframes: any[] = [];

    // 按时间点合并所有轨道的关键帧
    const timePoints = new Set<number>();
    tracks.forEach(track => {
      track.keyframes.forEach(kf => timePoints.add(kf.time));
    });

    Array.from(timePoints).sort((a: number, b: number) => a - b).forEach(time => {
      const frameData: any = { time };
      tracks.forEach(track => {
        const keyframe = track.keyframes.find(kf => kf.time === time);
        if (keyframe) {
          frameData[track.property] = keyframe.value;
        }
      });
      keyframes.push(frameData);
    });

    dispatch(saveAnimation(selectedAnimationName, 'multi-track', keyframes, duration));
    alert(`动画 "${selectedAnimationName}" 已保存成功！`);
  };

  // 播放/暂停动画
  const togglePlayAnimation = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // 开始播放动画逻辑
      console.log('开始播放动画:', selectedAnimationName);
    }
  };

  // 生成时间轴刻度
  const generateTimeMarks = (): JSX.Element[] => {
    const marks: JSX.Element[] = [];
    const stepCount = Math.floor(duration / frameStep);
    for (let i = 0; i <= stepCount; i++) {
      const time = i * frameStep;
      const x = timeToX(time);
      marks.push(
        <g key={i}>
          <line x1={x} y1={0} x2={x} y2={height} stroke="#e0e0e0" strokeWidth={1} />
          <text x={x} y={15} textAnchor="middle" fontSize="10" fill="#666">
            {time.toFixed(1)}s
          </text>
        </g>
      );
    }
    return marks;
  };

  return (
    <div className="timeline-keyframe-editor" style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '12px',
      backgroundColor: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 动画控制头部 */}
      <div className="animation-controls" style={{
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px'
      }}>
        {/* 动画选择下拉框 */}
        <select
          value={selectedAnimationName}
          onChange={(e) => setSelectedAnimationName(e.target.value)}
          style={{
            padding: '4px 6px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            fontSize: '11px',
            minWidth: '120px'
          }}
        >
          <option value="">选择动画</option>
          {Object.keys(savedAnimations).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {/* 新建动画按钮 */}
        <button
          onClick={() => setShowCreateDialog(true)}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          ➕
        </button>

        {/* 播放/暂停按钮 */}
        <button
          onClick={togglePlayAnimation}
          disabled={!selectedAnimationName}
          style={{
            backgroundColor: selectedAnimationName ? '#27ae60' : '#bdc3c7',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: selectedAnimationName ? 'pointer' : 'not-allowed'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* 保存按钮 */}
        <button
          onClick={saveCurrentAnimation}
          disabled={!selectedAnimationName}
          style={{
            backgroundColor: selectedAnimationName ? '#27ae60' : '#bdc3c7',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: selectedAnimationName ? 'pointer' : 'not-allowed'
          }}
        >
          💾
        </button>

        <div style={{ flex: 1 }} />

        <span style={{ color: '#666', fontSize: '10px' }}>
          时间: {currentTime.toFixed(2)}s / {duration}s
        </span>
      </div>

      {/* 循环播放和重置控制 */}
      <div className="playback-controls" style={{
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={isLooping}
            onChange={(e) => setIsLooping(e.target.checked)}
          />
          循环播放
        </label>

        <button
          onClick={resetAnimation}
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          🔄 重置
        </button>
      </div>

      {/* 时间轴和轨道 */}
      <div className="timeline-content" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          {/* 背景网格 */}
          {generateTimeMarks()}

          {/* 当前时间指示器 */}
          <line
            x1={timeToX(currentTime)}
            y1={0}
            x2={timeToX(currentTime)}
            y2={height}
            stroke="#ff6b35"
            strokeWidth={2}
          />

          {/* 轨道 */}
          {tracks.map((track, trackIndex) => {
            const trackY = trackIndex * 25 + 30;
            return (
              <g key={track.property}>
                {/* 轨道背景线 */}
                <line
                  x1={90}
                  y1={trackY}
                  x2={width - 50}
                  y2={trackY}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />

                {/* 轨道标签 */}
                <text
                  x={10}
                  y={trackY + 4}
                  fontSize="11"
                  fontWeight="500"
                  fill="#555"
                  fontFamily="monospace"
                >
                  {track.property}
                </text>

                {/* 关键帧点 */}
                {track.keyframes.map((keyframe, keyframeIndex) => {
                  const x = timeToX(keyframe.time);
                  const y = valueToY(keyframe.value, trackIndex);
                  const isSelected = selectedKeyframe?.trackIndex === trackIndex &&
                                   selectedKeyframe?.keyframeIndex === keyframeIndex;

                  return (
                    <g key={keyframe.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : 4}
                        fill={track.color}
                        stroke="white"
                        strokeWidth={2}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleKeyframeClick(trackIndex, keyframeIndex, e)}
                      />
                      <text
                        x={x}
                        y={y - 8}
                        fontSize="8"
                        fill="#666"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {keyframe.time.toFixed(1)}s
                      </text>
                    </g>
                  );
                })}

                {/* 点击区域 */}
                <rect
                  x={80}
                  y={trackY - 10}
                  width={width - 120}
                  height={20}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onClick={(e) => handleTrackClick(trackIndex, e)}
                />
              </g>
            );
          })}
        </svg>

        {/* 编辑现有关键帧面板 */}
        {isEditing && selectedKeyframe && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '180px',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '12px' }}>编辑关键帧</h4>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>
                属性: {tracks[selectedKeyframe.trackIndex].property}
              </label>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>时间:</label>
              <input
                type="number"
                min="0"
                max={duration}
                step={frameStep}
                value={tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].time}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  const newTracks = [...tracks];
                  newTracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].time = newTime;
                  setTracks(newTracks);
                }}
                style={{
                  width: '100%',
                  padding: '2px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  fontSize: '10px'
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>值:</label>
              {tracks[selectedKeyframe.trackIndex].property === 'color' ? (
                <input
                  type="color"
                  value={`#${Math.floor(tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].value[0] * 255).toString(16).padStart(2, '0')}${Math.floor(tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].value[1] * 255).toString(16).padStart(2, '0')}${Math.floor(tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].value[2] * 255).toString(16).padStart(2, '0')}`}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16) / 255;
                    const g = parseInt(hex.slice(3, 5), 16) / 255;
                    const b = parseInt(hex.slice(5, 7), 16) / 255;
                    updateKeyframeValue(selectedKeyframe.trackIndex, selectedKeyframe.keyframeIndex, [r, g, b, 1]);
                  }}
                  style={{ width: '100%', height: '20px' }}
                />
              ) : (
                <input
                  type="number"
                  step="0.1"
                  value={tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].value}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    updateKeyframeValue(selectedKeyframe.trackIndex, selectedKeyframe.keyframeIndex, newValue);
                  }}
                  style={{
                    width: '100%',
                    padding: '2px',
                    border: '1px solid #ddd',
                    borderRadius: '2px',
                    fontSize: '10px'
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  deleteKeyframe(selectedKeyframe.trackIndex, selectedKeyframe.keyframeIndex);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                删除
              </button>
            </div>
          </div>
        )}

        {/* 创建新关键帧面板 */}
        {isCreatingNew && newKeyframeData && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '180px',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '12px' }}>创建关键帧</h4>
              <button
                onClick={cancelCreateKeyframe}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>
                属性: {tracks[newKeyframeData.trackIndex].property}
              </label>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>时间:</label>
              <input
                type="number"
                min="0"
                max={duration}
                step={frameStep}
                value={newKeyframeData.time}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setNewKeyframeData({ ...newKeyframeData, time: newTime });
                }}
                style={{
                  width: '100%',
                  padding: '2px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  fontSize: '10px'
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px' }}>值:</label>
              <input
                type="number"
                step="0.1"
                value={newKeyframeData.value}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setNewKeyframeData({ ...newKeyframeData, value: newValue });
                }}
                style={{
                  width: '100%',
                  padding: '2px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  fontSize: '10px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={confirmCreateKeyframe}
                style={{
                  flex: 1,
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                保存
              </button>
              <button
                onClick={cancelCreateKeyframe}
                style={{
                  flex: 1,
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 创建新动画对话框 */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '6px',
            minWidth: '250px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>创建新动画</h3>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>动画名称:</label>
              <input
                type="text"
                value={newAnimationName}
                onChange={(e) => setNewAnimationName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>动画时长(秒):</label>
              <input
                type="number"
                value={newAnimationDuration}
                onChange={(e) => setNewAnimationDuration(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>帧步长(秒):</label>
              <input
                type="number"
                step="0.1"
                value={newAnimationFrameStep}
                onChange={(e) => setNewAnimationFrameStep(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={createNewAnimation}
                style={{
                  flex: 1,
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                创建
              </button>
              <button
                onClick={() => setShowCreateDialog(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
        • 点击轨道添加关键帧 • 点击关键帧编辑属性 • 帧步长: {frameStep}s
      </div>
    </div>
  );
};

export default TimelineKeyframeEditor;
