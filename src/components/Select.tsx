import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  options: (string | SelectOption)[];
  onValueChange: (val: string) => void;
  placeholder?: string;
  title?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  options,
  onValueChange,
  placeholder = 'Pilih...',
  title = 'Pilihan',
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="combobox"
        accessibilityLabel={displayLabel}
      >
        <Text style={[styles.selectText, { color: value ? theme.ink : theme.muted }]}>
          {displayLabel}
        </Text>

        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2} strokeLinecap="round">
          <Path d="M6 9l6 6 6-6" />
        </Svg>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.line }]}>
                  <Text style={[styles.modalTitle, { color: theme.ink }]}>{title}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
                    <Text style={[styles.closeText, { color: theme.accent }]}>Selesai</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={normalizedOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          {
                            backgroundColor: isSelected ? theme.accentSoft : 'transparent',
                            borderBottomColor: theme.line,
                          },
                        ]}
                        onPress={() => {
                          onValueChange(item.value);
                          setModalVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: isSelected ? theme.accent : theme.ink,
                              fontFamily: isSelected ? FontNames.sansBold : FontNames.sansMedium,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && (
                          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2.5} strokeLinecap="round">
                            <Path d="M20 6L9 17l-5-5" />
                          </Svg>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14.5,
    flex: 1,
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
    maxHeight: 380,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: FontNames.serifBold,
    fontSize: 17,
  },
  closeText: {
    fontFamily: FontNames.sansBold,
    fontSize: 14.5,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 14.5,
  },
});
