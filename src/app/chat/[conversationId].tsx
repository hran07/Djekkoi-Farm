import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Button } from '@/components/Button';

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    conversationId,
    sellerName,
    productName,
    productId,
  } = useLocalSearchParams<{
    conversationId: string;
    sellerId?: string;
    sellerName?: string;
    productId?: string;
    productName?: string;
  }>();

  const displayName = sellerName || 'Peternak Djekkoi';
  const displayProduct = productName || 'Ikan Koi';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.line,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: theme.surface2, borderColor: theme.line },
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.ink }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: theme.accent }]}
            numberOfLines={1}
          >
            Produk: {displayProduct}
          </Text>
        </View>
      </View>

      {/* Body / Placeholder Content */}
      <View style={styles.content}>
        <View
          style={[
            styles.placeholderCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Svg
              width={36}
              height={36}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.accent}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
          </View>

          <Text style={[styles.title, { color: theme.ink }]}>
            Fitur Chat Segera Hadir
          </Text>

          <Text style={[styles.desc, { color: theme.muted }]}>
            Anda akan dapat berdiskusi langsung dengan penjual{' '}
            <Text style={{ fontFamily: FontNames.sansBold, color: theme.ink }}>
              {displayName}
            </Text>{' '}
            mengenai ketersediaan dan negosiasi untuk{' '}
            <Text style={{ fontFamily: FontNames.sansBold, color: theme.accent }}>
              {displayProduct}
            </Text>
            .
          </Text>

          {Boolean(conversationId) && (
            <View
              style={[
                styles.convIdBadge,
                { backgroundColor: theme.surface2, borderColor: theme.line },
              ]}
            >
              <Text style={[styles.convIdLabel, { color: theme.muted }]}>
                ID Percakapan:
              </Text>
              <Text
                style={[styles.convIdValue, { color: theme.ink }]}
                numberOfLines={1}
              >
                {conversationId}
              </Text>
            </View>
          )}

          <Button
            variant="pri"
            wide
            style={{ marginTop: 8 }}
            onPress={() => router.back()}
          >
            Kembali ke Marketplace
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 16,
  },
  headerSubtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
    marginTop: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: FontNames.sansBold,
    fontSize: 19,
    textAlign: 'center',
  },
  desc: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
  },
  convIdBadge: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  convIdLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 11,
    marginBottom: 2,
  },
  convIdValue: {
    fontFamily: FontNames.sansRegular,
    fontSize: 11.5,
  },
});
