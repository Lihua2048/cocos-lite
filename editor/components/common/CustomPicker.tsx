import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';

interface DropdownItem {
  id: string;
  label: string;
  value: string;
}

interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  onDelete?: (value: string) => void;
  items: DropdownItem[];
  placeholder?: string;
  style?: any;
  canDelete?: boolean;
}

export default function CustomPicker({
  selectedValue,
  onValueChange,
  onDelete,
  items,
  placeholder = "请选择",
  style,
  canDelete = false
}: CustomPickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);

  const handleDelete = (item: DropdownItem) => {
    if (!onDelete || !canDelete) return;

    Alert.alert(
      '确认删除',
      `确定要删除 "${item.label}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            onDelete(item.value);
            setIsVisible(false);
          },
        },
      ]
    );
  };

  const handleSelect = (item: DropdownItem) => {
    onValueChange(item.value);
    setIsVisible(false);
  };

  const renderItem = ({ item }: { item: DropdownItem }) => (
    <View style={styles.dropdownItem}>
      <TouchableOpacity
        style={styles.itemButton}
        onPress={() => handleSelect(item)}
      >
        <Text style={styles.itemText}>{item.label}</Text>
      </TouchableOpacity>
      {canDelete && onDelete && items.length > 1 && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.picker, style]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.pickerText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    height: 32,
    minWidth: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  arrow: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 6,
    minWidth: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  list: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
    color: '#ff4444',
  },
});
