import { Button } from "@/components/Button";
import { FontNames } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import {
    getOrCreateConversation,
    sendMessage,
    subscribeMessages,
} from "@/lib/chat";
import { ChatMessage, Conversation } from "@/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

function formatMessageTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  } catch {
    return "";
  }
}

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();

  const {
    conversationId,
    sellerId,
    sellerName,
    currentUserName,
    productId,
    productName,
  } = useLocalSearchParams<{
    conversationId: string;
    sellerId?: string;
    sellerName?: string;
    currentUserName?: string;
    productId?: string;
    productName?: string;
  }>();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const initChat = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      // Pastikan percakapan dibuat atau diambil dari Firestore
      const targetSellerId = sellerId || "";
      const targetProductId = productId || "";
      const targetProductName = productName || "Ikan Koi";
      const myName =
        currentUserName || profile?.name || user.displayName || "Pembeli";
      const sName = sellerName || "Penjual";

      if (targetSellerId && targetProductId) {
        const conv = await getOrCreateConversation({
          currentUserId: user.uid,
          currentUserName: myName,
          sellerId: targetSellerId,
          sellerName: sName,
          productId: targetProductId,
          productName: targetProductName,
        });
        setConversation(conv);
      }
    } catch (err: any) {
      console.warn("[ChatScreen] initChat warning:", err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    conversationId,
    sellerId,
    sellerName,
    currentUserName,
    productId,
    productName,
    profile,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!user || !conversationId) return;

    const run = async () => {
      try {
        const targetSellerId = sellerId || '';
        const targetProductId = productId || '';
        const targetProductName = productName || 'Ikan Koi';
        const myName = currentUserName || profile?.name || user.displayName || 'Pembeli';
        const sName = sellerName || 'Penjual';

        if (targetSellerId && targetProductId) {
          const conv = await getOrCreateConversation({
            currentUserId: user.uid,
            currentUserName: myName,
            sellerId: targetSellerId,
            sellerName: sName,
            productId: targetProductId,
            productName: targetProductName,
          });
          if (!cancelled) {
            setConversation(conv);
          }
        }
      } catch (err: any) {
        console.warn('[ChatScreen] initChat warning:', err?.message || err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user, conversationId, sellerId, sellerName, currentUserName, productId, productName, profile]);

  // Berlangganan pesan secara realtime
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeMessages(
      conversationId,
      (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        console.warn("[ChatScreen] subscribe error:", err?.message || err);
        setErrorMsg("Gagal memuat pesan. Periksa koneksi internet Anda.");
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !user || !conversationId) return;

    try {
      setIsSending(true);
      setInputText("");
      await sendMessage(conversationId, trimmed, user.uid);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch (err: any) {
      console.warn("[ChatScreen] Gagal mengirim pesan:", err?.message || err);
      setInputText(trimmed);
      setErrorMsg("Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setIsSending(false);
    }
  };

  // Menentukan nama lawan bicara
  const otherUid = conversation?.participants.find((uid) => uid !== user?.uid);
  const otherName =
    (otherUid && conversation?.participantNames[otherUid]) ||
    sellerName ||
    "Peternak Djekkoi";
  const displayProduct = conversation?.productName || productName || "Ikan Koi";

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderId === user?.uid;
    const timeStr = formatMessageTime(item.createdAt);

    return (
      <View
        style={[
          styles.bubbleRow,
          isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOwn
              ? [styles.bubbleOwn, { backgroundColor: theme.accent }]
              : [
                  styles.bubbleOther,
                  { backgroundColor: theme.surface, borderColor: theme.line },
                ],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwn ? "#ffffff" : theme.ink },
            ]}
          >
            {item.text}
          </Text>
          {Boolean(timeStr) && (
            <Text
              style={[
                styles.timeText,
                { color: isOwn ? "rgba(255, 255, 255, 0.7)" : theme.muted },
              ]}
            >
              {timeStr}
            </Text>
          )}
        </View>
      </View>
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

        <View style={styles.headerInfo}>
          <Text
            style={[styles.headerTitle, { color: theme.ink }]}
            numberOfLines={1}
          >
            {otherName}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: theme.accent }]}
            numberOfLines={1}
          >
            Produk: {displayProduct}
          </Text>
        </View>
      </View>

      {/* ── Konten Chat & Keyboard ─────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>
              Memuat percakapan...
            </Text>
          </View>
        ) : errorMsg && messages.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={[styles.errorText, { color: theme.red }]}>
              {errorMsg}
            </Text>
            <Button
              variant="default"
              onPress={initChat}
              style={{ marginTop: 12 }}
            >
              Coba Lagi
            </Button>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerBox}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.accentSoft },
              ]}
            >
              <Svg
                width={32}
                height={32}
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
              Belum ada pesan
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.muted }]}>
              Mulai percakapan dengan {otherName} mengenai {displayProduct}.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* ── Input Bar ──────────────────────────────────────── */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.line,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.bg,
                borderColor: theme.line,
                color: theme.ink,
              },
            ]}
            placeholder="Ketik pesan..."
            placeholderTextColor={theme.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            accessibilityLabel="Input teks pesan"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  inputText.trim().length > 0 && !isSending
                    ? theme.accent
                    : theme.surface2,
              },
            ]}
            onPress={handleSend}
            disabled={inputText.trim().length === 0 || isSending}
            accessibilityRole="button"
            accessibilityLabel="Kirim pesan"
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke={inputText.trim().length > 0 ? "#ffffff" : theme.muted}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M22 2L11 13" />
                <Path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: "row",
    marginVertical: 3,
  },
  bubbleRowOwn: {
    justifyContent: "flex-end",
  },
  bubbleRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleOwn: {
    borderColor: "transparent",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 14.5,
    lineHeight: 20,
  },
  timeText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 10.5,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 17,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: FontNames.sansRegular,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
});
