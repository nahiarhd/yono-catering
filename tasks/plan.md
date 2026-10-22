# Implementation Plan: Menu Pengumuman (Announcement) Admin & Broadcast Telegram

## 1. Overview
Fitur ini menambahkan 1 menu baru khusus Admin bernama **Pengumuman** (`/announcements`) yang memungkinkan Admin membuat dan menyiarkan pengumuman katering (misal: pengumuman libur, perubahan jadwal, info menu khusus, dsb) langsung ke akun Telegram semua anggota aktif yang terhubung, sekaligus menyimpan riwayat pengumuman di database.

## 2. Architecture & Data Flow
1. **Database (`prisma/schema.prisma`)**:
   - Model `Announcement`: `id`, `title`, `message`, `sentCount`, `failedCount`, `authorId`, `author` (relation to `User`), `createdAt`.
   - Update model `User`: tambah relasi `announcements Announcement[]`.
2. **Telegram Library (`src/lib/telegram.ts`)**:
   - `formatAnnouncementMessage({ title, message, appUrl })`: formatting HTML bersih untuk Telegram, bebas karakter rusak/injeksi HTML.
   - Pemanfaatan `sendTelegramBroadcast` dan `recordTelegramDelivery` yang sudah teruji.
3. **Server Actions (`src/app/announcements/actions.ts`)**:
   - `sendAnnouncementAction({ title, message })`:
     - Proteksi `requireStrictAdmin()`.
     - Validasi input pesan.
     - Broadcast ke seluruh anggota aktif ber-`telegramChatId`.
     - Catat delivery status via `recordTelegramDelivery`.
     - Simpan log pengumuman ke database via `db.announcement.create`.
     - Revalidate path `/announcements`.
4. **UI & Routing**:
   - `src/components/nav.tsx`: Link `/announcements` untuk admin.
   - `src/lib/id.ts`: Penambahan teks UI Bahasa Indonesia.
   - `src/app/announcements/page.tsx`: Server component untuk render form pengumuman dan riwayat sebelumnya.
   - `src/app/announcements/announcement-form.tsx`: Form Client Component bergaya neo-brutalist dengan counter karakter, live recipient info, dan state loading pengiriman.

## 3. Tasks Breakdown
- **Task 1: Prisma Schema & Database Migration**
  - Tambah model `Announcement` & relasi `User.announcements` di `prisma/schema.prisma`.
  - Jalankan `npm run db:push`.
- **Task 2: Telegram Formatter Helper & Unit Test**
  - Tambah `formatAnnouncementMessage` di `src/lib/telegram.ts`.
  - Tambah unit test di `src/lib/__tests__/telegram.test.ts`.
  - Jalankan `npm run test:unit`.
- **Task 3: Localization & Navigation**
  - Tambah label `nav.announcements` dan `id.announcements` di `src/lib/id.ts`.
  - Tambah `NavLink` di `src/components/nav.tsx` untuk role `admin`.
- **Task 4: Server Action & Announcement Page Component**
  - Buat `src/app/announcements/actions.ts`.
  - Buat `src/app/announcements/announcement-form.tsx`.
  - Buat `src/app/announcements/page.tsx`.
- **Task 5: Verification & Antislop Quality Check**
  - Jalankan `npm run test:unit`.
  - Jalankan `npx tsc --noEmit`.
  - Jalankan `npm run lint`.
  - Update knowledge graph via `graphify update .`.
