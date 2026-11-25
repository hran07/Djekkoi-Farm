import {
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Conversation, ChatMessage } from './types';

/**
 * Menghasilkan ID percakapan deterministik dari dua UID pengguna dan ID produk.
 * UID diurutkan secara alfabetis agar percakapan antara dua pengguna untuk produk yang sama
 * selalu menghasilkan ID yang identik tanpa memandang siapa yang memulai percakapan.
 */
export function getConversationId(
  uidA: string,
  uidB: string,
  productId: string
): string {
  const sortedUids = [uidA, uidB].sort();
  return `${sortedUids[0]}_${sortedUids[1]}_${productId}`;
}

export interface GetOrCreateConversationParams {
  currentUserId: string;
  currentUserName?: string;
  sellerId: string;
  sellerName?: string;
  productId: string;
  productName: string;
}

/**
 * Mengonversi Firestore Timestamp atau nilai tanggal lainnya ke string ISO.
 */
function timestampToISO(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Mengambil percakapan yang sudah ada berdasarkan ID deterministik,
 * atau membuat dokumen percakapan baru di Firestore jika belum pernah dibuat.
 */
export async function getOrCreateConversation(
  params: GetOrCreateConversationParams
): Promise<Conversation> {
  const {
    currentUserId,
    currentUserName,
    sellerId,
    sellerName,
    productId,
    productName,
  } = params;

  if (!currentUserId || !sellerId || currentUserId === sellerId) {
    throw new Error('Tidak dapat membuat percakapan dengan diri sendiri atau penjual tidak valid');
  }

  if (!productId) {
    throw new Error('ID produk wajib diisi');
  }

  const conversationId = getConversationId(currentUserId, sellerId, productId);
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);

  if (convSnap.exists()) {
    const data = convSnap.data({ serverTimestamps: 'estimate' });
    return {
      id: convSnap.id,
      participants: (data.participants || [currentUserId, sellerId]) as [string, string],
      participantNames: (data.participantNames || {}) as Record<string, string>,
      productId: data.productId || productId,
      productName: data.productName || productName || 'Ikan Koi',
      lastMessage: data.lastMessage || undefined,
      lastMessageAt: data.lastMessageAt ? timestampToISO(data.lastMessageAt) : undefined,
      lastSenderId: data.lastSenderId || undefined,
      createdAt: timestampToISO(data.createdAt),
    };
  }

  // Percakapan baru
  const participants = [currentUserId, sellerId].sort() as [string, string];
  const participantNames: Record<string, string> = {
    [currentUserId]: currentUserName?.trim() || 'Pembeli',
    [sellerId]: sellerName?.trim() || 'Penjual',
  };

  const initialData = {
    participants,
    participantNames,
    productId,
    productName: productName || 'Ikan Koi',
    lastMessage: '',
    lastSenderId: '',
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  };

  await setDoc(convRef, initialData);

  const nowISO = new Date().toISOString();
  return {
    id: conversationId,
    participants,
    participantNames,
    productId,
    productName: productName || 'Ikan Koi',
    lastMessage: '',
    lastSenderId: '',
    createdAt: nowISO,
    lastMessageAt: nowISO,
  };
}

/**
 * Mengirim pesan baru ke subkoleksi 'messages' di bawah dokumen percakapan tertentu,
 * serta memperbarui lastMessage, lastMessageAt, dan lastSenderId pada dokumen percakapan secara atomik.
 */
export async function sendMessage(
  conversationId: string,
  text: string,
  senderId: string
): Promise<ChatMessage> {
  const trimmedText = text ? text.trim() : '';

  if (!trimmedText) {
    throw new Error('Pesan tidak boleh kosong');
  }

  if (trimmedText.length > 1000) {
    throw new Error('Pesan melebihi batas maksimal 1000 karakter');
  }

  if (!conversationId) {
    throw new Error('ID Percakapan tidak valid');
  }

  if (!senderId) {
    throw new Error('Sender ID tidak valid');
  }

  const batch = writeBatch(db);
  const messagesCol = collection(db, 'conversations', conversationId, 'messages');
  const newMsgRef = doc(messagesCol);
  const convRef = doc(db, 'conversations', conversationId);

  batch.set(newMsgRef, {
    senderId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  batch.update(convRef, {
    lastMessage: trimmedText,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
  });

  await batch.commit();

  return {
    id: newMsgRef.id,
    senderId,
    text: trimmedText,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Berlangganan (realtime snapshot listener) ke daftar pesan dalam suatu percakapan,
 * diurutkan berdasarkan waktu pembuatan (createdAt ascending).
 */
export function subscribeMessages(
  conversationId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!conversationId) {
    onChange([]);
    return () => {};
  }

  const messagesCol = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return {
          id: d.id,
          senderId: data.senderId || '',
          text: data.text || '',
          createdAt: timestampToISO(data.createdAt),
        };
      });
      onChange(messages);
    },
    (error) => {
      console.warn('[chat] subscribeMessages error:', error?.message || error);
      if (onError) onError(error);
    }
  );
}

/**
 * Berlangganan (realtime snapshot listener) ke semua percakapan yang melibatkan pengguna tertentu,
 * difilter menggunakan array-contains pada field 'participants'.
 * Urutkan di sisi client berdasarkan lastMessageAt descending dan saring percakapan yang belum punya lastMessage.
 */
export function subscribeConversations(
  uid: string,
  onChange: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!uid) {
    onChange([]);
    return () => {};
  }

  const convCol = collection(db, 'conversations');
  const q = query(convCol, where('participants', 'array-contains', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations: Conversation[] = snapshot.docs
        .map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            participants: (data.participants || []) as [string, string],
            participantNames: (data.participantNames || {}) as Record<string, string>,
            productId: data.productId || '',
            productName: data.productName || 'Ikan Koi',
            lastMessage: data.lastMessage || undefined,
            lastMessageAt: data.lastMessageAt ? timestampToISO(data.lastMessageAt) : undefined,
            lastSenderId: data.lastSenderId || undefined,
            createdAt: timestampToISO(data.createdAt),
          };
        })
        .filter((c) => Boolean(c.lastMessage && c.lastMessage.trim().length > 0))
        .sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });

      onChange(conversations);
    },
    (error) => {
      console.warn('[chat] subscribeConversations error:', error?.message || error);
      if (onError) onError(error);
    }
  );
}
