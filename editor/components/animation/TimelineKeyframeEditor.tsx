import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../core/types';
import './TimelineKeyframeEditor.css';

interface Keyframe {
  time: number; // 时间（秒）
  value: number; // 属性值
  id: string;
}

interface AnimationTrack {
  property: string; // 属性名称，如 'position.x', 'rotation', 'scale.x'
  keyframes: Keyframe[];
  color: string; // 轨道颜色
}

interface TimelineKeyframeEditorProps {
  entityId: string;
  duration?: number; // 动画总时长（秒）
  width?: number;
  height?: number;
}

const TimelineKeyframeEditor: React.FC<TimelineKeyframeEditorProps> = ({
  entityId,
  duration = 10,
  width = 600,
  height = 300
}) => {
  const dispatch = useDispatch();
  const entity = useSelector((state: RootState) => state.editor.entities[entityId]);

  const [tracks, setTracks] = useState<AnimationTrack[]>([
    {
      property: 'position.x',
      keyframes: [
        { time: 0, value: 0, id: 'px_0' },
        { time: 2, value: 100, id: 'px_1' },
        { time: 5, value: 200, id: 'px_2' }
      ],
      color: '#ff4444'
    },
    {
      property: 'position.y',
      keyframes: [
        { time: 0, value: 0, id: 'py_0' },
        { time: 3, value: 150, id: 'py_1' },
        { time: 6, value: 300, id: 'py_2' }
      ],
      color: '#44ff44'
    },
    {
      property: 'scale.x',
      keyframes: [
        { time: 0, value: 1, id: 'sx_0' },
        { time: 4, value: 1.5, id: 'sx_1' },
        { time: 8, value: 0.5, id: 'sx_2' }
      ],
      color: '#4444ff'
    }
  ]);

  const [selectedKeyframe, setSelectedKeyframe] = useState<{ trackIndex: number; keyframeIndex: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // 计算时间轴的像素位置
  const timeToX = (time: number) => {
    return (time / duration) * (width - 120) + 80; // 留出左侧标签空间
  };

  // 计算值轴的像素位置
  const valueToY = (value: number, trackIndex: number) => {
    const trackHeight = 60;
    const trackY = trackIndex * (trackHeight + 20) + 40;
    // 简单的值映射，实际应用中可能需要更复杂的缩放
    const normalizedValue = Math.max(0, Math.min(1, (value + 200) / 400)); // 假设值范围是-200到200
    return trackY + trackHeight - (normalizedValue * trackHeight);
  };

  // 处理关键帧点击
  const handleKeyframeClick = (trackIndex: number, keyframeIndex: number) => {
    setSelectedKeyframe({ trackIndex, keyframeIndex });
    setIsEditing(true);
  };

  // 处理关键帧拖拽
  const handleKeyframeDrag = (trackIndex: number, keyframeIndex: number, newTime: number) => {
    const newTracks = [...tracks];
    newTracks[trackIndex].keyframes[keyframeIndex].time = Math.max(0, Math.min(duration, newTime));
    setTracks(newTracks);
  };

  // 添加新关键帧
  const addKeyframe = (trackIndex: number, time: number) => {
    const newTracks = [...tracks];
    const track = newTracks[trackIndex];
    const newKeyframe: Keyframe = {
      time,
      value: 0, // 默认值，用户可编辑
      id: `${track.property}_${Date.now()}`
    };
    track.keyframes.push(newKeyframe);
    track.keyframes.sort((a, b) => a.time - b.time);
    setTracks(newTracks);
  };

  // 删除关键帧
  const deleteKeyframe = (trackIndex: number, keyframeIndex: number) => {
    const newTracks = [...tracks];
    newTracks[trackIndex].keyframes.splice(keyframeIndex, 1);
    setTracks(newTracks);
    setSelectedKeyframe(null);
    setIsEditing(false);
  };

  // 更新关键帧值
  const updateKeyframeValue = (trackIndex: number, keyframeIndex: number, newValue: number) => {
    const newTracks = [...tracks];
    newTracks[trackIndex].keyframes[keyframeIndex].value = newValue;
    setTracks(newTracks);
  };

  // 生成时间轴刻度
  const generateTimeMarks = () => {
    const marks = [];
    const stepCount = 10;
    const step = duration / stepCount;
    for (let i = 0; i <= stepCount; i++) {
      const time = i * step;
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

  // 生成轨道路径
  const generateTrackPath = (track: AnimationTrack, trackIndex: number) => {
    if (track.keyframes.length < 2) return '';

    const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time);
    let path = '';

    sortedKeyframes.forEach((keyframe, index) => {
      const x = timeToX(keyframe.time);
      const y = valueToY(keyframe.value, trackIndex);

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  return (
    <div className="timeline-keyframe-editor">
      <div className="timeline-header">
        <h3>帧动画编辑器 - 泳道视图</h3>
        <div className="timeline-controls">
          <button
            className="play-button"
            onClick={() => setCurrentTime(0)}
          >
            ⏮ 重置
          </button>
          <div className="time-display">
            时间: {currentTime.toFixed(2)}s / {duration}s
          </div>
        </div>
      </div>

      <div className="timeline-content">
        <svg ref={svgRef} width={width} height={height} className="timeline-svg">
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
            className="current-time-line"
          />

          {/* 轨道 */}
          {tracks.map((track, trackIndex) => {
            const trackY = trackIndex * 80 + 40;
            return (
              <g key={track.property}>
                {/* 轨道背景 */}
                <rect
                  x={0}
                  y={trackY - 10}
                  width={width}
                  height={60}
                  fill="#f8f9fa"
                  stroke="#e9ecef"
                  strokeWidth={1}
                  opacity={0.5}
                />

                {/* 轨道标签 */}
                <text
                  x={10}
                  y={trackY + 20}
                  fontSize="12"
                  fontWeight="bold"
                  fill="#333"
                >
                  {track.property}
                </text>

                {/* 轨道曲线 */}
                <path
                  d={generateTrackPath(track, trackIndex)}
                  stroke={track.color}
                  strokeWidth={2}
                  fill="none"
                  className="track-path"
                />

                {/* 关键帧点 */}
                {track.keyframes.map((keyframe, keyframeIndex) => {
                  const x = timeToX(keyframe.time);
                  const y = valueToY(keyframe.value, trackIndex);
                  const isSelected = selectedKeyframe?.trackIndex === trackIndex &&
                                   selectedKeyframe?.keyframeIndex === keyframeIndex;

                  return (
                    <circle
                      key={keyframe.id}
                      cx={x}
                      cy={y}
                      r={isSelected ? 8 : 6}
                      fill={track.color}
                      stroke="#fff"
                      strokeWidth={2}
                      className="keyframe-point"
                      onClick={() => handleKeyframeClick(trackIndex, keyframeIndex)}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}

                {/* 双击添加关键帧的响应区域 */}
                <rect
                  x={80}
                  y={trackY - 10}
                  width={width - 120}
                  height={60}
                  fill="transparent"
                  onDoubleClick={(e) => {
                    const rect = svgRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = e.clientX - rect.left;
                      const time = ((x - 80) / (width - 120)) * duration;
                      addKeyframe(trackIndex, time);
                    }
                  }}
                  style={{ cursor: 'crosshair' }}
                />
              </g>
            );
          })}
        </svg>

        {/* 关键帧编辑面板 */}
        {isEditing && selectedKeyframe && (
          <div className="keyframe-editor-panel">
            <h4>编辑关键帧</h4>
            <div className="editor-controls">
              <div className="control-group">
                <label>时间:</label>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].time}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    handleKeyframeDrag(selectedKeyframe.trackIndex, selectedKeyframe.keyframeIndex, newTime);
                  }}
                />
              </div>
              <div className="control-group">
                <label>值:</label>
                <input
                  type="number"
                  step="0.1"
                  value={tracks[selectedKeyframe.trackIndex].keyframes[selectedKeyframe.keyframeIndex].value}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    updateKeyframeValue(selectedKeyframe.trackIndex, selectedKeyframe.keyframeIndex, newValue);
                  }}
                />
              </div>
              <div className="control-group">
                <button
                  className="delete-button"
                  onClick={() => deleteKeyframe(selectedKeyframe.trackIndex, selectedKeyframe.keyframeIndex)}
                >
                  删除
                </button>
                <button
                  className="close-button"
                  onClick={() => setIsEditing(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="timeline-instructions">
        <p>• 双击轨道添加关键帧 • 点击关键帧编辑属性 • 拖拽调整时间位置</p>
      </div>
    </div>
  );
};

export default TimelineKeyframeEditor;
