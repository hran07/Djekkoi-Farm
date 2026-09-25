import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Paths, File } from 'expo-file-system';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';

interface PhotoFieldProps {
  label: string;
  photoUri: string | null;
  onPhotoSelected: (uri: string | null) => void;
  placeholder?: string;
}

export const PhotoField: React.FC<PhotoFieldProps> = ({
  label,
  photoUri,
  onPhotoSelected,
  placeholder = 'Ketuk untuk ambil atau pilih foto',
}) => {
  const theme = useTheme();
  const { showToast } = useStore();
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const processAndSaveImage = async (sourceUri: string, origWidth?: number, origHeight?: number) => {
    try {
      const maxSide = 720;
      const width = origWidth || 720;
      const height = origHeight || 720;
      let targetW = width;
      let targetH = height;

      if (Math.max(width, height) > maxSide) {
        if (width >= height) {
          targetW = maxSide;
          targetH = Math.round((maxSide * height) / width);
        } else {
          targetH = maxSide;
          targetW = Math.round((maxSide * width) / height);
        }
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ resize: { width: targetW, height: targetH } }],
        { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
      const sourceFile = new File(manipulated.uri);
      const destFile = new File(Paths.document, fileName);

      await sourceFile.copy(destFile);

      onPhotoSelected(destFile.uri);
    } catch (e) {
      console.error('Failed to process image:', e);
      showToast('Foto tidak bisa dibaca');
    }
  };

  const handleCamera = async () => {
    setPickerModalVisible(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Izin Kamera',
        'Aplikasi membutuhkan izin kamera untuk mengambil foto ikan atau bukti transaksi.'
      );
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!res.canceled && res.assets && res.assets[0]) {
      const asset = res.assets[0];
      await processAndSaveImage(asset.uri, asset.width, asset.height);
    }
  };

  const handleGallery = async () => {
    setPickerModalVisible(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Izin Galeri',
        'Aplikasi membutuhkan izin akses foto untuk memilih gambar dari galeri.'
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!res.canceled && res.assets && res.assets[0]) {
      const asset = res.assets[0];
      await processAndSaveImage(asset.uri, asset.width, asset.height);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.dashedBox,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
        ]}
        onPress={() => setPickerModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {photoUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity
              style={[styles.removeBadge, { backgroundColor: theme.bad }]}
              onPress={() => onPhotoSelected(null)}
              accessibilityRole="button"
              accessibilityLabel="Hapus foto"
            >
              <Text style={styles.removeText}>✕ Hapus</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2} strokeLinecap="round">
              <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <Path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </Svg>
            <Text style={[styles.placeholderText, { color: theme.muted }]}>{placeholder}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={pickerModalVisible} transparent animationType="fade" onRequestClose={() => setPickerModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setPickerModalVisible(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <Text style={[styles.modalTitle, { color: theme.ink }]}>Pilih Sumber Foto</Text>

                <TouchableOpacity style={[styles.optionRow, { borderBottomColor: theme.line }]} onPress={handleCamera}>
                  <Text style={[styles.optionText, { color: theme.ink }]}>📷 Ambil Foto Kamera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={handleGallery}>
                  <Text style={[styles.optionText, { color: theme.ink }]}>🖼️ Pilih dari Galeri</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.surface2 }]} onPress={() => setPickerModalVisible(false)}>
                  <Text style={[styles.cancelText, { color: theme.ink }]}>Batal</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 13,
    marginBottom: 4,
  },
  dashedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    minHeight: 96,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  placeholderText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeText: {
    fontFamily: FontNames.sansBold,
    fontSize: 12,
    color: '#ffffff',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 14, 20, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontFamily: FontNames.serifBold,
    fontSize: 18,
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  optionText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FontNames.sansBold,
    fontSize: 14,
  },
});
