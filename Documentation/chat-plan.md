# Rencana & Arsitektur Fitur Chat (Djekkoi Farm)

Dokumen ini menjelaskan rancangan arsitektur, skema basis data Firestore, rekomendasi security rules, pertimbangan indeks komposit, serta keputusan desain terbuka untuk implementasi fitur obrolan (chat) antara calon pembeli dan peternak/penjual ikan.

---

## 1. Skema & Struktur Koleksi Firestore

Percakapan diatur dengan struktur **root collection** `conversations` yang memiliki **subkoleksi** `messages` di bawah masing-masing dokumen percakapan.

### A. Root Koleksi: `conversations/{conversationId}`

- **ID Dokumen (`conversationId`)**: Dihasilkan secara deterministik via fungsi `getConversationId(uidA, uidB, productId)` di `src/lib/chat.ts`.
  - Format: `<uidKecil>_<uidBesar>_<productId>`
  - Manfaat: Mencegah duplikasi dokumen percakapan jika pembeli atau penjual membuka halaman chat berulang kali untuk produk yang sama.
- **Fields Dokumen `conversations/{conversationId}`**:
  - `id`: `string` — ID percakapan (sama dengan ID dokumen).
  - `participants`: `[string, string]` — Array berisi 2 UID pengguna yang terlibat (pembeli dan penjual).
  - `productId`: `string` — ID ikan/produk marketplace yang menjadi topik bahasan.
  - `productName`: `string` — Varietas atau nama ikan saat percakapan dimulai.
  - `lastMessage`: `string` (opsional) — Cuplikan teks pesan terakhir untuk preview di daftar inbox.
  - `lastMessageAt`: `string` (ISO timestamp) atau `Timestamp` — Waktu pesan terakhir dikirim, digunakan untuk pengurutan inbox terbaru.
  - `createdAt`: `string` (ISO timestamp) — Waktu percakapan pertama kali dibuat.

> **Catatan Penting**: Jangan menyimpan foto, avatar, atau string Base64 di dalam dokumen percakapan ini agar ukuran dokumen tetap ringan dan hemat kuota baca/tulis.

### B. Subkoleksi: `conversations/{conversationId}/messages/{messageId}`

- **ID Dokumen (`messageId`)**: Auto-generated UID oleh Firestore atau `uid()`.
- **Fields Dokumen Pesan**:
  - `id`: `string` — ID dokumen pesan.
  - `senderId`: `string` — UID pengguna pengirim pesan (`request.auth.uid`).
  - `text`: `string` — Isi pesan obrolan teks (sanitized, tanpa raw HTML).
  - `createdAt`: `string` (ISO timestamp) atau `serverTimestamp()` — Waktu pesan dikirim.

---

## 2. Rekomendasi Firestore Security Rules

*(Rekomendasi ini didokumentasikan di sini dan belum dimasukkan ke file `firestore.rules` aktif sampai implementasi fitur chat siap diluncurkan)*

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: cek apakah user login adalah peserta percakapan
    function isParticipant(conversationData) {
      return request.auth != null && 
        (request.auth.uid in conversationData.participants);
    }

    match /conversations/{conversationId} {
      // 1. Membaca dokumen percakapan: hanya peserta
      allow read: if isParticipant(resource.data);

      // 2. Membuat percakapan baru:
      // - Harus terautentikasi
      // - request.auth.uid harus ada di dalam daftar participants
      // - participants harus tepat berjumlah 2 user
      allow create: if request.auth != null 
        && request.auth.uid in request.resource.data.participants
        && request.resource.data.participants.size() == 2;

      // 3. Memperbarui dokumen percakapan (mis. update lastMessage & lastMessageAt):
      // - Hanya boleh diperbarui oleh peserta percakapan
      // - Field 'participants' dan 'productId' bersifat immutable (tidak boleh diubah)
      allow update: if isParticipant(resource.data)
        && request.resource.data.participants == resource.data.participants
        && request.resource.data.productId == resource.data.productId;

      // 4. Menghapus percakapan: dilarang secara default (atau hanya oleh admin)
      allow delete: if false;

      // Subkoleksi messages di bawah percakapan
      match /messages/{messageId} {
        // Hanya peserta percakapan induk yang boleh membaca pesan
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;

        // Mengirim pesan:
        // - Harus peserta percakapan induk
        // - senderId harus identik dengan request.auth.uid
        // - Teks tidak boleh kosong (text.size() > 0 && text.size() <= 2000)
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.text is string
          && request.resource.data.text.trim().size() > 0;

        // Pesan tidak boleh diedit atau dihapus oleh klien biasa
        allow update, delete: if false;
      }
    }
  }
}
```

---

## 3. Pertimbangan Indeks Komposit (Composite Indexes)

Untuk mendukung fitur inbox dan riwayat pesan secara efisien:

1. **Daftar Pesan dalam Percakapan**:
   - Query: `query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'))`
   - *Indeks*: Cukup menggunakan single-field index bawaan Firestore pada `createdAt`. Tidak memerlukan composite index.

2. **Daftar Inbox Percakapan User**:
   - Query: `query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid), orderBy('lastMessageAt', 'desc'))`
   - *Indeks*: **Memerlukan Composite Index**:
     - Collection: `conversations`
     - Fields:
       1. `participants` (Arrays)
       2. `lastMessageAt` (Descending)
   - *Catatan*: Jika indeks ini belum dibuat di Firebase Console, query Firestore akan melempar error `failed-precondition` dengan link langsung untuk membuat composite index secara otomatis.

---

## 4. Keputusan Desain Terbuka (Open Design Decisions)

Berikut adalah beberapa hal yang perlu disepakati saat implementasi UI/UX penuh dimulai oleh tim:

1. **Push Notifications (Expo Notifications / FCM)**:
   - Apakah perlu mengirimkan push notification saat penjual menerima pesan ketika aplikasi sedang ditutup / di latar belakang?
   - *Rekomendasi*: Gunakan Cloud Functions for Firebase yang mendengarkan event `onCreate` pada subkoleksi `messages`, lalu memicu Expo Push API menggunakan Push Token yang tersimpan di dokumen profil pengguna (`users/{uid}`).

2. **Status Pesan & Read Receipts (Belum Terbaca / Terbaca)**:
   - Apakah butuh tanda centang dua / badge unread count per percakapan?
   - *Rekomendasi*: Simpan map `unreadCounts: { [uid]: number }` atau field `lastReadAt: { [uid]: string }` pada dokumen `conversations/{id}`. Saat user membuka ruang obrolan, perbarui `unreadCounts[user.uid] = 0`.

3. **Status Ikan Terjual Saat Chat Berlangsung**:
   - Jika ikan terjual atau dihapus oleh penjual saat obrolan sedang berlangsung, apakah ruang obrolan perlu menampilkan banner "Ikan ini sudah tidak tersedia di Marketplace"?
   - *Rekomendasi*: Simpan referensi `productId`, dan saat membuka chat, ambil status ikan secara realtime atau tampilkan banner informatif jika produk tidak lagi aktif (`display === false`).

4. **Lampiran Foto / Media dalam Chat**:
   - Apakah calon pembeli boleh mengirim foto tambahan (mis. foto kolam atau bukti transfer)?
   - *Rekomendasi*: Unggah foto ke Firebase Storage di path `chat_media/{conversationId}/{fileId}` dan hanya simpan URL hasil unduh (bukan Base64) di dokumen pesan `messages/{messageId}`.

