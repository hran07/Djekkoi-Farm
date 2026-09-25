import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Toast } from './Toast';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  onClose,
  children,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const maxSheetHeight = Math.floor(windowHeight * 0.92);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop overlay for closing modal on outside tap */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropOverlay} />
        </TouchableWithoutFeedback>

        {/* Sheet card (Not wrapped in TouchableWithoutFeedback so ScrollView gets all touch gestures) */}
        <View
          style={[
            styles.sheet,
            {
              maxHeight: maxSheetHeight,
              backgroundColor: theme.bg,
              paddingBottom: Math.max(insets.bottom, 18),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.ink }]} numberOfLines={1}>
              {title}
            </Text>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Tutup"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth={2.5} strokeLinecap="round">
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Content with Keyboard Avoiding */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        <Toast inModal />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 14, 20, 0.55)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 22,
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 40,
  },
});
