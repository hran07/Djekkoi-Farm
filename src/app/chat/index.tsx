import { Button } from "@/components/Button";
import { FontNames } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { subscribeConversations } from "@/lib/chat";
import { Conversation } from "@/lib/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

function formatRelativeTime(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays}h lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function ChatInboxScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(user));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeConversations(
      user.uid,
      (convs) => {
        setConversations(convs);
        setIsLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        console.warn("[ChatInbox] subscribe error:", err?.message || err);
        setErrorMsg("Gagal memuat daftar percakapan.");
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleOpenConversation = (item: Conversation) => {
    const otherUid = item.participants.find((uid) => uid !== user?.uid);
    const otherName =
      (otherUid && item.participantNames?.[otherUid]) || "Peternak Djekkoi";

    router.push({
      pathname: "/chat/[conversationId]",
      params: {
        conversationId: item.id,
        sellerId: otherUid || "",
        sellerName: otherName,
        productId: item.productId,
        productName: item.productName,
      },
    });
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherUid = item.participants.find((uid) => uid !== user?.uid);
    const otherName =
      (otherUid && item.participantNames?.[otherUid]) || "Peternak Djekkoi";
    const timeStr = formatRelativeTime(item.lastMessageAt);

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
          },
        ]}
        onPress={() => handleOpenConversation(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Percakapan dengan ${otherName}`}
      >
        <View
          style={[styles.avatarCircle, { backgroundColor: theme.accentSoft }]}
        >
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {otherName[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.itemHeaderRow}>
            <Text
              style={[styles.partnerName, { color: theme.ink }]}
              numberOfLines={1}
            >
              {otherName}
            </Text>
            {Boolean(timeStr) && (
              <Text style={[styles.timeLabel, { color: theme.muted }]}>
                {timeStr}
              </Text>
            )}
          </View>

          <View style={styles.productBadge}>
            <Text
              style={[styles.productName, { color: theme.accent }]}
              numberOfLines={1}
            >
              {item.productName}
            </Text>
          </View>

          <Text
            style={[styles.lastMessage, { color: theme.muted }]}
            numberOfLines={1}
          >
            {item.lastMessage || "Belum ada pesan"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
      {/* ── Header ────────────────────────────────────────── */}
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

        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Pesan Masuk
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            Percakapan Marketplace
          </Text>
        </View>
      </View>

      {/* ── Konten ─────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Memuat percakapan...
          </Text>
        </View>
      ) : errorMsg && conversations.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={[styles.errorText, { color: theme.red }]}>
            {errorMsg}
          </Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerBox}>
          <View
            style={[
              styles.emptyIconCircle,
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
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>
            Belum ada percakapan
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.muted }]}>
            Mulai chat dari halaman produk di Marketplace untuk berdiskusi
            dengan penjual.
          </Text>
          <Button
            variant="pri"
            style={{ marginTop: 16 }}
            onPress={() => router.push("/(tabs)/marketplace")}
          >
            Buka Marketplace
          </Button>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 17,
  },
  headerSubtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partnerName: {
    fontFamily: FontNames.sansBold,
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    fontFamily: FontNames.sansRegular,
    fontSize: 11.5,
  },
  productBadge: {
    alignSelf: "flex-start",
  },
  productName: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12,
  },
  lastMessage: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13,
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    marginTop: 12,
  },
  errorText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    textAlign: "center",
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 290,
  },
});
