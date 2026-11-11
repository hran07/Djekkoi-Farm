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
  sellerId: string;
  productId: string;
  productName: string;
}

/**
 * Mengambil percakapan yang sudah ada berdasarkan ID deterministik,
 * atau membuat dokumen percakapan baru di Firestore jika belum pernah dibuat.
 */
export async function getOrCreateConversation(
  _params: GetOrCreateConversationParams
): Promise<Conversation> {
  // TODO(chat): Implementasikan pembuatan/pencarian dokumen di koleksi 'conversations'
  throw new Error('Not implemented');
}

/**
 * Mengirim pesan baru ke subkoleksi 'messages' di bawah dokumen percakapan tertentu,
 * serta memperbarui lastMessage dan lastMessageAt pada dokumen percakapan.
 */
export async function sendMessage(
  _conversationId: string,
  _text: string,
  _senderId: string
): Promise<ChatMessage> {
  // TODO(chat): Implementasikan penyimpanan pesan di subkoleksi 'messages'
  throw new Error('Not implemented');
}

/**
 * Berlangganan (realtime snapshot listener) ke daftar pesan dalam suatu percakapan,
 * diurutkan berdasarkan waktu pembuatan (createdAt ascending).
 */
export function subscribeMessages(
  _conversationId: string,
  _onChange: (messages: ChatMessage[]) => void
): () => void {
  // TODO(chat): Pasang onSnapshot ke subkoleksi 'messages'
  throw new Error('Not implemented');
}

/**
 * Berlangganan (realtime snapshot listener) ke semua percakapan yang melibatkan pengguna tertentu,
 * difilter menggunakan array-contains pada field 'participants'.
 */
export function subscribeConversations(
  _uid: string,
  _onChange: (conversations: Conversation[]) => void
): () => void {
  // TODO(chat): Pasang onSnapshot ke koleksi 'conversations' dengan query participants array-contains uid
  throw new Error('Not implemented');
}

