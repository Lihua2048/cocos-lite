import React, { useState, useEffect } from "react";
import PhysicsPanel from '../physics/PhysicsPanel';
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker"; // 修复Picker导入问题
import { useSelector, useDispatch } from "react-redux";
import {
  updateEntityProperty,
  updateEntityTexture,
  addPhysicsComponent,
  setPhysicsRunning
} from "../../../core/actions";
import { RootState, TextureResource } from "../../../core/types"; // 导入TextureResource类型
import { EntityProperty } from "../../../core/types";
import KeyframeEditor from "../animation/KeyframeEditor";
import AnimationControls from "../animation/AnimationControls";

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const selectedEntityId = useSelector((state: RootState) => state.selectedEntityId);
  const entities = useSelector((state: RootState) => state.entities);
  const textures = useSelector((state: RootState) => state.textures); // 添加textures选择器
  const physicsRunning = useSelector((state: RootState) => state.physicsRunning);
  const selectedEntity =
    selectedEntityId && entities[selectedEntityId]
      ? entities[selectedEntityId]
      : null;

  // 本地状态管理编辑中的属性
  const [editableProps, setEditableProps] = useState({
    position: { x: 0, y: 0 },
    width: 0,
    height: 0,
    color: [0, 0, 0, 1] as [number, number, number, number],
  });

  // 当选中实体变化时更新本地状态
  useEffect(() => {
    if (selectedEntity) {
      const colorArray = selectedEntity.properties.color;
      const colorTuple: [number, number, number, number] = [
        colorArray[0] || 0,
        colorArray[1] || 0,
        colorArray[2] || 0,
        colorArray[3] !== undefined ? colorArray[3] : 1,
      ];
      setEditableProps({
        position: { ...selectedEntity.position },
        width: selectedEntity.properties.width,
        height: selectedEntity.properties.height,
        color: colorTuple,
      });
    }
  }, [selectedEntity]);

  // 处理输入变化
  const handleInputChange = (field: string, value: string, index?: number) => {
    const numValue = parseFloat(value) || 0;

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      // 更新本地状态
      setEditableProps((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: numValue,
        },
      }));
      // 更新Redux状态
      dispatch(
        updateEntityProperty(
          selectedEntityId!,
          child as EntityProperty,
          numValue
        )
      );
    } else if (index !== undefined) {
      // 对于颜色，更新整个数组
      setEditableProps((prev) => {
        const newColor = [...prev.color] as [number, number, number, number];
        newColor[index] = numValue;
        return { ...prev, color: newColor };
      });
      // 更新Redux状态
      const newColor = [...editableProps.color] as [
        number,
        number,
        number,
        number
      ];
      newColor[index] = numValue;
      dispatch(updateEntityProperty(selectedEntityId!, "color", newColor));
    } else {
      // 更新本地状态
      setEditableProps((prev) => ({
        ...prev,
        [field]: numValue,
      }));
      // 更新Redux状态
      dispatch(
        updateEntityProperty(
          selectedEntityId!,
          field as EntityProperty,
          numValue
        )
      );
    }
  };

  if (!selectedEntity) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSelection}>未选择实体</Text>
      </View>
    );
  }

  // 检查是否有物理组件
  let physicsComponent: import('../../../core/types').PhysicsComponent | null = null;
  let hasPhysicsComponent = false;
  if (selectedEntity) {
    const found = selectedEntity.components.find(c => c.type === 'physics');
    if (found) {
      physicsComponent = found as import('../../../core/types').PhysicsComponent;
      hasPhysicsComponent = true;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.propertyGroup}>
        <Text style={styles.title}>实体属性</Text>
        <Text>纹理:</Text>
        <Picker
          selectedValue={selectedEntity.properties.texture || ""}
          onValueChange={(value: string) => {
            dispatch(updateEntityTexture(selectedEntity.id, value));
          }}
        >
          <Picker.Item label="无纹理" value="" />
          {textures.map((texture: TextureResource) =>
            typeof texture === "string" ? (
              <Picker.Item key={texture} label={texture} value={texture} />
            ) : (
              <Picker.Item
                key={texture.id}
                label={texture.name}
                value={texture.id}
              />
            )
          )}
        </Picker>
      </View>

      {/* 物理属性面板/添加按钮 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
        {hasPhysicsComponent ? (
          <PhysicsPanel entityId={selectedEntity.id} component={physicsComponent!} />
        ) : (
          <button
            style={{ marginRight: 12, padding: '6px 12px', background: '#eee', border: '1px solid #aaa', borderRadius: 4 }}
            onClick={() => {
              dispatch(addPhysicsComponent(selectedEntity.id, {
                type: 'physics',
                bodyType: 'dynamic',
                density: 1,
                friction: 0.5,
                restitution: 0.2,
                fixedRotation: false
              }));
            }}
          >
            添加物理组件
          </button>
        )}
        {/* 物理运行/暂停按钮 */}
        <button
          style={{ padding: '6px 12px', background: physicsRunning ? '#d4f7d4' : '#f7d4d4', border: '1px solid #aaa', borderRadius: 4 }}
          onClick={() => dispatch(setPhysicsRunning(!physicsRunning))}
        >
          {physicsRunning ? '暂停物理' : '运行物理'}
        </button>
      </View>

      <View style={styles.propertyGroup}>
        <KeyframeEditor propertyName="position.x" />
      </View>

      <View style={styles.propertyGroup}>
        <AnimationControls entityId={selectedEntity.id} />
      </View>
      {selectedEntity.animation && (
        <Text>当前动画: {selectedEntity.animation.currentAnimation}</Text>
      )}

      <View style={styles.propertyGroup}>
        <Text style={styles.subtitle}>位置</Text>
        <View style={styles.inputRow}>
          <Text style={styles.label}>X:</Text>
          <TextInput
            style={styles.input}
            value={editableProps.position.x.toString()}
            onChangeText={(v) => handleInputChange("position.x", v)}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Y:</Text>
          <TextInput
            style={styles.input}
            value={editableProps.position.y.toString()}
            onChangeText={(v) => handleInputChange("position.y", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.propertyGroup}>
        <Text style={styles.subtitle}>尺寸</Text>
        <View style={styles.inputRow}>
          <Text style={styles.label}>宽:</Text>
          <TextInput
            style={styles.input}
            value={editableProps.width.toString()}
            onChangeText={(v) => handleInputChange("width", v)}
            keyboardType="numeric"
          />
          <Text style={styles.label}>高:</Text>
          <TextInput
            style={styles.input}
            value={editableProps.height.toString()}
            onChangeText={(v) => handleInputChange("height", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.propertyGroup}>
        <Text style={styles.subtitle}>颜色 (RGBA)</Text>
        <View style={styles.inputRow}>
          {["R", "G", "B", "A"].map((channel, index) => (
            <View key={index} style={styles.colorInput}>
              <Text style={styles.label}>{channel}:</Text>
              <TextInput
                style={styles.input}
                value={editableProps.color[index].toString()}
                onChangeText={(v) => handleInputChange("color", v, index)}
                keyboardType="numeric"
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    marginLeft: 10,
    maxHeight: 800,     // 使用数字像素值代替百分比
    overflow: "scroll"  // 使用React Native支持的overflow属性
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  propertyGroup: {
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
  },
  inputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorInput: {
    width: "48%",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: "#555",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  noSelection: {
    color: "#999",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});
