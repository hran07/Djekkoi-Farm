import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ProofImageSheetProps {
  imageUri: string;
}

export const ProofImageSheet: React.FC<ProofImageSheetProps> = ({ imageUri }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.imageWrap, { backgroundColor: theme.surface2 }]}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  imageWrap: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
