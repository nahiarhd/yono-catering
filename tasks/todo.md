# Task List: Telegram Reminder Bot & Dynamic App URL

- [x] Task 1: Update Environment Template & Database Schema
  - Acceptance: Kolom `telegramChatId String?` ada di model `User` dan `.env.example` memiliki key `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, dan `NEXT_PUBLIC_APP_URL`. `prisma db push` berhasil dijalankan.
  - Verify: `npm run db:push` berhasil tanpa error.
  - Files: `prisma/schema.prisma`, `.env.example`

- [x] Task 2: Create Telegram Service & Formatters
  - Acceptance: `src/lib/telegram.ts` menyediakan helper `sendTelegramMessage`, `getAppUrl`, `formatMenuBroadcastMessage`, dan `formatReminderMessage`.
  - Verify: Unit test `src/lib/__tests__/telegram.test.ts` berhasil dijalankan.
  - Files: `src/lib/telegram.ts`, `src/lib/__tests__/telegram.test.ts`, `package.json`

- [x] Task 3: Integrate Telegram Chat ID in User Management
  - Acceptance: Form Tambah Pengguna dan Tabel Pengguna di `/users` mendukung input dan edit `telegramChatId`. Server actions `addMemberAction` dan `updateTelegramIdAction` menangani penyimpanan ke database.
  - Verify: `npm run build` dan `npm run lint` lulus.
  - Files: `src/app/users/actions.ts`, `src/app/users/users-table.tsx`, `src/lib/id.ts`

- [x] Task 4: Integrate Telegram Broadcast on Menu Post
  - Acceptance: Saat menu baru diposting di `postMenuAction`, bot mengirimkan pesan Telegram ke semua anggota yang memiliki `telegramChatId`.
  - Verify: `npm run build` dan `npm run test:unit` berhasil.
  - Files: `src/app/yono/actions.ts`

- [x] Task 5: Add Manual Ping Feature in Kitchen View
  - Acceptance: Halaman Dapur (`/yono`) memiliki tombol "Kirim Pengingat Telegram" di samping daftar *Belum Memilih* yang memanggil action `pingTelegramRemindersAction`.
  - Verify: `npm run build` berhasil dan UI responsif sesuai neo-brutalist & antislop guidelines.
  - Files: `src/app/yono/actions.ts`, `src/app/yono/page.tsx`, `src/components/telegram-ping-button.tsx`, `src/lib/id.ts`

- [x] Task 6: Update Cron Reminder & Add Webhook Helper
  - Acceptance: Route `/api/cron/reminder` mengirim pengingat Telegram ke anggota yang belum memilih. Route `/api/telegram/webhook` membalas pesan `/start` dengan Chat ID pengguna.
  - Verify: `npm run build` dan `npm run lint` berhasil.
  - Files: `src/app/api/cron/reminder/route.ts`, `src/app/api/telegram/webhook/route.ts`

- [x] Task 7: Final Verification & Knowledge Graph Update
  - Acceptance: `npm run lint`, `npm run test:unit`, `npm run build` lulus 100%. `graphify update .` dijalankan.
  - Verify: Semua perintah lulus tanpa error.
