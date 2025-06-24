import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Button } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addTexture } from '../../../core/actions';

export default function ResourceManagerPanel() {
  const dispatch = useDispatch();
  const textures = useSelector((state: any) => state.textures);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        dispatch(addTexture({ id, name, url }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <View style={styles.container}>
      <Text>资源管理</Text>
      <Button title="上传图片" onPress={handleUpload} />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      <FlatList
        data={textures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.textureItem}>
            <Image source={{ uri: item.url }} style={styles.textureImage} />
            <Text>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
  },
  textureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  textureImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
});
