import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Button,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { addTexture } from "../../../core/actions";
import { TextureResource } from "../../../core/types";
import ResourceManager  from "../../../core/resources/ResourceManager";
interface ResourceManagerPanelProps {
  resourceManager: ResourceManager;
}

export default function ResourceManagerPanel({
  resourceManager
}: ResourceManagerPanelProps) {
  const dispatch = useDispatch();
  const textures = useSelector((state: any) => state.textures);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewTexture, setPreviewTexture] = useState<TextureResource | null>(
    null
  ); // 添加预览状态

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const id = `texture-${Date.now()}`;
        const name = file.name;
        const url = e.target?.result as string;

        // 添加到资源管理器
        const image = new window.Image();
        image.src = url;
        resourceManager.addTexture(id, image);

        dispatch(addTexture({ id, name, url }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 添加预览处理函数
  const handlePreview = (texture: TextureResource) => {
    setPreviewTexture(texture);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewTexture(null);
  };

  return (
    <View style={styles.container}>
      <Text>资源管理</Text>
      <Button title="上传图片" onPress={handleUpload} />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

      <FlatList
        data={textures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePreview(item)}>
            {/* 添加点击事件 */}
            <View style={styles.textureItem}>
              <Image source={{ uri: item.url }} style={styles.textureImage} />
              <Text>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {/* 预览模态框 */}
      <Modal
        visible={!!previewTexture}
        transparent={true}
        onRequestClose={closePreview}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closePreview}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
          {previewTexture && (
            <Image
              source={{ uri: typeof previewTexture === 'string' ? previewTexture : previewTexture.url }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 10,
  },
  textureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  textureImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "black",
  },
  previewImage: {
    width: "80%",
    height: "80%",
  },
});
