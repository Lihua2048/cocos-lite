import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';

interface Props {
  onAddNode: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onClose?: () => void;
}

const BlueprintToolbar: React.FC<Props> = ({
  onAddNode,
  onZoomIn,
  onZoomOut,
  onAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onClose
}) => {
  const [showNodeMenu, setShowNodeMenu] = useState(false);

  const nodeTypes = [
    { type: 'input', label: '输入节点', icon: '→' },
    { type: 'output', label: '输出节点', icon: '←' },
    { type: 'process', label: '处理节点', icon: '⚙' },
    { type: 'condition', label: '条件节点', icon: '?' },
    { type: 'loop', label: '循环节点', icon: '↻' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {/* 添加节点按钮 */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowNodeMenu(!showNodeMenu)}
        >
          <Text style={styles.buttonText}>+ 添加节点</Text>
        </TouchableOpacity>

        {/* 节点类型菜单 */}
        {showNodeMenu && (
          <View style={styles.nodeMenu}>
            {nodeTypes.map(({ type, label, icon }) => (
              <TouchableOpacity
                key={type}
                style={styles.nodeMenuItem}
                onPress={() => {
                  onAddNode(type);
                  setShowNodeMenu(false);
                }}
              >
                <Text style={styles.nodeMenuIcon}>{icon}</Text>
                <Text style={styles.nodeMenuText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 分隔线 */}
        <View style={styles.separator} />

        {/* 撤销/重做 */}
        <TouchableOpacity
          style={[styles.button, !canUndo && styles.buttonDisabled]}
          onPress={onUndo}
          disabled={!canUndo}
        >
          <Text style={[styles.buttonText, !canUndo && styles.buttonTextDisabled]}>↶ 撤销</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canRedo && styles.buttonDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
        >
          <Text style={[styles.buttonText, !canRedo && styles.buttonTextDisabled]}>↷ 重做</Text>
        </TouchableOpacity>

        {/* 分隔线 */}
        <View style={styles.separator} />

        {/* 自动布局 */}
        <TouchableOpacity style={styles.button} onPress={onAutoLayout}>
          <Text style={styles.buttonText}>⊞ 自动布局</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        {/* 缩放控制 */}
        <View style={styles.zoomControl}>
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* 关闭按钮 */}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e42',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#3e3e42',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  buttonTextDisabled: {
    color: '#666',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#3e3e42',
    marginHorizontal: 8,
  },
  nodeMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: '#2d2d30',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3e3e42',
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nodeMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nodeMenuIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  nodeMenuText: {
    color: '#fff',
    fontSize: 14,
  },
  zoomControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e3e42',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginRight: 12,
  },
  zoomButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoomText: {
    color: '#fff',
    fontSize: 12,
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#3e3e42',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default BlueprintToolbar;