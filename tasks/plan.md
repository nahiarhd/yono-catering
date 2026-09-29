# Technical Implementation Plan: Telegram Reminder Bot & Dynamic App URL

## Overview
Menghubungkan aplikasi Yono Catering dengan bot Telegram `@yonocateringbot` untuk mengirimkan notifikasi menu baru, pengingat anggota yang belum mengisi pilihan makan siang, serta fitur ping manual dari dapur. URL website dan kredensial bot dapat dikonfigurasi secara fleksibel melalui `.env`.

## Architecture & Data Flow
1. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL` / `APP_URL`: URL publik aplikasi (misal `http://localhost:3000` atau `https://katering.kantor.com`), digunakan dalam tautan pesan Telegram.
   - `TELEGRAM_BOT_TOKEN`: Token bot dari @BotFather.
   - `TELEGRAM_BOT_USERNAME`: `yonocateringbot` (digunakan untuk link deep-link ke bot).
2. **Database Layer (Prisma)**:
   - Tambah kolom `telegramChatId String?` pada model `User`.
   - Update database schema via `prisma db push`.
3. **Telegram Service (`src/lib/telegram.ts`)**:
   - Fungsi `getAppUrl()`: Mengambil URL aplikasi dari env `APP_URL` / `NEXT_PUBLIC_APP_URL` dengan fallback aman.
   - Fungsi `sendTelegramMessage(chatId, text)`: Mengirim pesan via Telegram API native `fetch`.
   - Fungsi `formatMenuBroadcastMessage({ dish, cutoff, appUrl })`: Format pesan broadcast menu baru.
   - Fungsi `formatReminderMessage({ name, dish, cutoff, appUrl })`: Format pesan pengingat personal.
4. **User Management UI (`/users`)**:
   - Update `AddUserForm` untuk menerima input `Telegram Chat ID` (opsional).
   - Update baris tabel `UserTableRow` untuk menampilkan Telegram ID (atau badge terhubung / belum), dengan form inline untuk mengupdate Telegram ID pengguna.
   - Update server actions di `src/app/users/actions.ts` (`addMemberAction`, `updateTelegramIdAction`).
5. **Notification Triggers**:
   - **Trigger 1 (Posting Menu)**: Di `src/app/yono/actions.ts` (`postMenuAction`), kirim broadcast Telegram ke semua anggota yang memiliki `telegramChatId`.
   - **Trigger 2 (Cron Reminder)**: Di `src/app/api/cron/reminder/route.ts`, kirim reminder ke anggota yang belum mengisi katering hari ini.
   - **Trigger 3 (Manual Ping dari Dapur)**: Server Action `pingTelegramRemindersAction` yang dipanggil dari tombol di `src/app/yono/page.tsx` untuk mengingatkan anggota di daftar *Belum Memilih*.
6. **Helper Webhook Endpoint (Opsional tapi sangat membantu)**:
   - `/api/telegram/webhook`: Saat user buka `@yonocateringbot` dan ketik `/start`, bot membalas:
     *"Halo! Chat ID Telegram kamu adalah: `123456789`. Silakan berikan ID ini ke Admin untuk pengingat katering."*

## Dependencies & Risks
- **Risiko Telegram API Downtime/Rate-Limit**: Ditangani dengan `Promise.allSettled` dan delay ringan jika broadcast banyak user, sehingga proses web tidak pernah crash atau terblokir.
- **Risiko Format URL**: `getAppUrl()` membersihkan trailing slash agar link selalu valid (`https://domain.com/home`).

## Implementation Sequence
1. Database Schema (`prisma/schema.prisma` & `npx prisma db push`)
2. Telegram Library & Formatter (`src/lib/telegram.ts`)
3. Unit Tests (`src/lib/__tests__/telegram.test.ts`)
4. User CRUD Integration (`src/app/users/actions.ts` & `src/app/users/users-table.tsx`)
5. Broadcast on Menu Post (`src/app/yono/actions.ts`)
6. Manual Ping Action & UI in Kitchen (`src/app/yono/actions.ts` & `src/app/yono/page.tsx`)
7. Cron Reminder Route (`src/app/api/cron/reminder/route.ts`)
8. Webhook Endpoint for `/start` assistance (`src/app/api/telegram/webhook/route.ts`)
9. Verification (lint, test:unit, build, graphify update)
