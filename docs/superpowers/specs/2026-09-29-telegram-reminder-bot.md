# Spec: Telegram Reminder Bot & User Telegram ID Integration

## Objective
Mengintegrasikan Telegram Bot sebagai pengingat katering harian yang andal untuk kantor.
Admin dapat menginputkan `Telegram Chat ID` (atau Telegram ID) setiap pengguna saat mengelola akun di menu Pengguna (`/users`). Ketika Pak Yono memposting menu baru atau menjelang batas waktu katering (*cutoff*), bot akan secara otomatis mengirimkan pesan pribadi ke Telegram anggota yang belum mengisi pilihan menu hari itu.

## Background & Problem
1. Notifikasi *Web Push* di browser desktop/mobile sering kali gagal terkirim atau diblokir oleh sistem operasi/browser (khususnya Safari iOS dan mode hemat daya).
2. Anggota kantor sering lupa membuka web katering tepat waktu sebelum jam *cutoff* (08:00 WIB), menyebabkan Pak Yono kesulitan menghitung porsi belanja.
3. Telegram adalah aplikasi perpesanan yang sangat stabil, memiliki API resmi gratis, dan pesan *direct message* (DM) dari bot memiliki tingkat keterbacaan (*open rate*) hampir 100%.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Actions, Route Handlers)
- **Database**: SQLite (via Prisma ORM 6.19)
- **API**: Telegram Bot API via native `fetch` (tanpa dependensi eksternal, sesuai prinsip *Ponytail*)
- **Styling**: Tailwind CSS 4 + Neo-brutalist custom theme

## Commands
- Dev Server: `npm run dev`
- Build: `npm run build`
- Unit Tests: `npm run test:unit`
- Lint: `npm run lint`
- Database Push: `npm run db:push`

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── reminder/route.ts    → Scheduled reminder check & notification
│   │   └── telegram/
│   │       └── webhook/route.ts     → Optional webhook to reply with user's Chat ID upon /start
│   ├── users/
│   │   ├── actions.ts               → CRUD Server Actions (includes telegramChatId)
│   │   ├── page.tsx                 → Users page
│   │   └── users-table.tsx          → Table with Telegram Chat ID column & edit modal/inline
│   └── yono/
│       ├── actions.ts               → Triggers broadcast when menu is posted & manual ping action
│       └── page.tsx                 → Kitchen view with manual "Ingatkan via Telegram" button
├── lib/
│   ├── __tests__/
│   │   └── telegram.test.ts         → Unit tests for Telegram message formatting & helpers
│   ├── db.ts                        → Prisma database client
│   └── telegram.ts                  → Native Telegram Bot API client (sendMessage, broadcast)
docs/superpowers/specs/
└── 2026-09-29-telegram-reminder-bot.md → This specification
```

## Data Model Changes
Tambahkan kolom opsional `telegramChatId` pada model `User` di `prisma/schema.prisma`:
```prisma
model User {
  id               String           @id @default(cuid())
  name             String           @unique
  pinHash          String
  role             Role
  telegramChatId   String?          // ID obrolan Telegram untuk DM notifikasi
  pushSubscription Json?
  createdAt        DateTime         @default(now())
  responses        Response[]
  dishPreferences  DishPreference[]
}
```

## Telegram Bot Mechanism & Workflow

### 1. Prasyarat Telegram
Telegram Bot API memiliki aturan keamanan: **Bot tidak dapat memulai chat pertama kali ke pengguna** tanpa pengguna menekan tombol `/start` pada bot tersebut terlebih dahulu.
Untuk memudahkan admin dan user:
1. Bot memiliki username, misalnya `@YonoCateringBot` (dikonfigurasi via `TELEGRAM_BOT_TOKEN`).
2. Anggota membuka `@YonoCateringBot` dan mengirim pesan `/start`.
3. Webhook (atau bot) membalas: 
   > *"Halo [Nama]! Chat ID Telegram kamu adalah: `123456789`. Silakan berikan ID ini ke Admin untuk pengingat katering."*
4. Admin memasukkan Chat ID tersebut ke kolom **Telegram ID** pada form Tambah / Edit Pengguna di `/users`.

### 2. Skenario Pengiriman Notifikasi
1. **Menu Diposting (Broadcast)**:
   - Terjadi saat Pak Yono memposting menu baru (`postMenuAction`).
   - Bot mengirim pesan ke semua anggota yang memiliki `telegramChatId`:
     > *🔔 **MENU HARI INI DIPOSTING!***
     > *Menu: **Ayam Bakar Madu***
     > *Batas Waktu: **08:00 WIB***
     > *Silakan isi pilihan makan kamu:*
     > *👉 https://catering.office.com/home*
2. **Pengingat Belum Memilih (Scheduled Cron Reminder)**:
   - Dijalankan pada jam pengingat (misal 07:00 atau 30 menit sebelum batas waktu).
   - Bot memfilter anggota yang **belum memilih** (`pendingMembers`) dan mengirim pesan pengingat personal:
     > *⏳ **PENGINGAT KATERING PAK YONO***
     > *Halo Raihan, kamu belum menentukan pilihan menu katering hari ini (*Ayam Bakar Madu*).*
     > *Batas waktu tinggal 30 menit lagi (08:00 WIB).*
     > *👉 https://catering.office.com/home*
3. **Manual Ping oleh Admin / Pak Yono**:
   - Di halaman Dapur (`/yono`), terdapat tombol **"Kirim Pengingat Telegram"** di samping daftar *Belum Memilih*.
   - Berguna jika jam sudah mendekati batas akhir dan masih ada 3-5 orang yang belum mengisi.

## Code Style & Implementation
- Fungsi mandiri `src/lib/telegram.ts` menggunakan native `fetch`:
```ts
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parseMode?: "HTML" | "Markdown" }
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN belum diatur" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode ?? "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    return { ok: data.ok, error: data.description };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
```

## Testing Strategy
- Unit test di `src/lib/__tests__/telegram.test.ts`:
  - Validasi generator teks pesan katering (menu baru, pengingat, dan teks bantuan).
  - Validasi sanitasi karakter HTML/Markdown agar tidak rusak saat format dikirim.
  - Mock fetch untuk memastikan endpoint Telegram dipanggil dengan payload yang tepat.
- Manual check:
  - Input Telegram ID di `/users`.
  - Trigger test pesan atau broadcast.

## Boundaries
- **Always do**:
  - Validasi token Telegram di server environment (`process.env.TELEGRAM_BOT_TOKEN`).
  - Berikan penanganan error yang anggun (*graceful fallback*) jika bot token tidak ada atau Telegram API gagal (jangan biarkan website crash).
  - Terapkan rate-limiting/delay jika mengirim pesan massal agar tidak terkena Telegram flood limit (30 pesan/detik).
- **Ask first**:
  - Format pesan default dan waktu pengingat otomatis.
  - Menjalankan webhook Telegram publik vs manual Chat ID entry.
- **Never do**:
  - Jangan commit bot token atau secret ke git repository.
  - Jangan menghentikan proses posting menu katering jika pengiriman Telegram mengalami kegagalan sebagian (misal satu user memblokir bot).

## Success Criteria
1. Terdapat kolom `Telegram ID` (Chat ID) pada formulir Tambah Pengguna dan Tabel Pengguna di `/users`.
2. Admin dapat mengedit/mengisi `Telegram ID` untuk setiap pengguna.
3. Terdapat modul `src/lib/telegram.ts` yang mampu mengirimkan pesan teks terformat ke Telegram pengguna.
4. Saat menu diposting, bot mengirimkan pemberitahuan menu hari ini ke pengguna yang memiliki Telegram ID.
5. Cron job pengingat mengirimkan pesan kepada anggota yang belum mengisi.
6. Halaman dapur `/yono` memiliki tombol untuk mengirimkan pengingat manual ke anggota yang belum memilih.
7. Semua unit test, lint, dan build lulus tanpa error.

## Open Questions for Review
1. Apakah admin sudah memiliki Bot Telegram (token dari `@BotFather`), atau ingin dibuatkan panduan singkat cara membuatnya?
2. Untuk mendapatkan Chat ID anggota: apakah cukup anggota mengecek Chat ID mereka (misal lewat `@userinfobot` atau `/start` ke bot) lalu diberikan ke admin, atau kamu ingin ada link otomatis?
