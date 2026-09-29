# Spec: Sub-Menu & Varian Lauk pada Menu Katering dan Preferensi

## Objective
Menambahkan fitur **Sub-Menu / Pilihan Varian** pada katering kantor.
Ketika Pak Yono menyajikan menu yang memiliki variasi (contoh: *Bakmi Jogja* memiliki sub-menu *Bakmi Goreng*, *Bakmi Godhog*, *Nasi Goreng*, *Magelangan*):
1. Admin dan Pak Yono dapat mendefinisikan daftar sub-menu (dipisahkan koma) pada Menu Bawaan di Pengaturan dan saat Posting Menu harian di Dapur.
2. Anggota kantor yang memilih **Ikut Makan** di halaman Home wajib memilih salah satu sub-menu yang tersedia, lalu mengisi catatan opsional (misal: *pedas*, *tanpa sayur*).
3. Anggota dapat mengatur pilihan sub-menu dan catatan default mereka di halaman **Preferensi** (`/preferences`).
4. Dapur (`/yono`) dan Format WhatsApp otomatis mengelompokkan **Rincian Porsi Belanja** berdasarkan sub-menu (contoh: 3x Bakmi Goreng, 2x Nasi Goreng) lengkap dengan catatan masing-masing anggota.

## Background & Problem
- Saat ini menu hanya berupa satu nama hidangan tunggal (misal: "Bakmi Jogja") dengan satu catatan global.
- Untuk tempat makan yang memiliki varian pilihan menu (seperti masakan mie/nasi goreng, pilihan ayam bakar vs goreng, soto daging vs ayam), anggota kantor tidak memiliki cara terstruktur untuk memilih varian yang diinginkan.
- Akibatnya anggota menuliskan varian di catatan bebas, sehingga Pak Yono harus membaca dan merekap pesanan satu per satu secara manual.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Actions)
- **Database**: SQLite (via Prisma ORM 6.19)
- **Styling**: Tailwind CSS 4 + Neo-brutalist theme
- **Validation**: TypeScript, standard regex/string parser

## Commands
- Build: `npm run build`
- Unit Test: `npm run test:unit`
- Lint: `npm run lint`
- DB Push: `npm run db:push`
- Dev: `npm run dev`

## Project Structure
```
src/
├── app/
│   ├── home/
│   │   ├── actions.ts               → Handle saving response with subDish / variant
│   │   └── page.tsx                 → Pass subDishes from menu to ResponseForm
│   ├── preferences/
│   │   └── page.tsx                 → Load defaultDishes with subDishes
│   ├── settings/
│   │   └── actions.ts               → Add/update default dishes with subDishes
│   └── yono/
│       ├── actions.ts               → Save menu with subDishes
│       └── page.tsx                 → Render tallies grouped by sub-menu & WhatsApp format
├── components/
│   ├── default-dishes-form.tsx      → UI for subDishes in settings
│   ├── dish-preferences-card.tsx    → UI for selecting default subDish variant
│   ├── menu-form.tsx                → UI for entering subDishes when posting menu
│   └── response-form.tsx            → UI for selecting subDish chip/radio when ordering
├── lib/
│   ├── __tests__/
│   │   ├── dishes.test.ts           → Test parsing subDishes
│   │   ├── tally.test.ts            → Test portion tallies with subDishes
│   │   └── whatsapp.test.ts         → Test WA recap with subDishes
│   ├── dishes.ts                    → DefaultDish type with subDishes helper
│   ├── tally.ts                     → Tally breakdown logic grouped by subDish
│   └── whatsapp.ts                  → WhatsApp message formatter with subDishes
prisma/
└── schema.prisma                    → Add subDishes String? to Menu model
```

## Data Model Changes

### 1. Model `Menu` di `prisma/schema.prisma`:
Tambahkan kolom `subDishes String?` (menyimpan daftar sub-menu dipisahkan koma atau JSON):
```prisma
model Menu {
  id             String     @id @default(cuid())
  date           DateTime
  dish           String
  subDishes      String?    // Contoh: "Bakmi Goreng, Bakmi Godhog, Nasi Goreng"
  note           String?
  cutoffOverride String?
  createdAt      DateTime   @default(now())
  responses      Response[]

  @@unique([date])
}
```

### 2. Model `Response` & `DishPreference`:
Kolom `swapDish String?` yang sudah ada dimanfaatkan secara optimal untuk menyimpan varian sub-menu yang dipilih (misal: `"Nasi Goreng"`). Jika menu tidak memiliki sub-menu, nilainya `null`.
Tidak perlu migrasi tabel `Response` dan `DishPreference`.

### 3. Model `Settings` (`defaultDishes Json`):
Tipe data objek default dish diperluas:
```ts
export type DefaultDish = {
  name: string;
  note?: string | null;
  subDishes?: string[]; // Contoh: ["Bakmi Goreng", "Bakmi Godhog", "Nasi Goreng"]
};
```

## User Workflows & UI Design

### 1. Form Menu Bawaan di Pengaturan (`/settings`)
- Form Tambah Menu Bawaan memiliki kolom tambahan:
  - **Pilihan Sub Menu (opsional)**: Input teks dengan *placeholder* `contoh: Bakmi Goreng, Bakmi Godhog, Nasi Goreng`.
- Helper `parseSubDishes(str: string): string[]` memisahkan string koma menjadi array nama varian yang bersih.

### 2. Posting Menu di Dapur (`/yono`)
- Saat Pak Yono memilih salah satu preset Menu Bawaan (misal "Bakmi Jogja"), kolom Sub Menu otomatis terisi daftar varian dari preset tersebut.
- Pak Yono juga bisa mengetik atau mengedit varian langsung di form sebelum memposting.
- Saat menu disimpan, `subDishes` tersimpan di database.

### 3. Pemesanan Harian di Home (`/home`)
- Jika `menu.subDishes` ada:
  - Saat anggota menekan tombol **Ikut Makan**, muncul daftar pilihan varian berbentuk *chip selector* bergaya neo-brutal.
  - Anggota wajib memilih salah satu varian sebelum menyimpan.
  - Di bawah pilihan varian, terdapat kolom **Catatan Khusus (opsional)** dengan contoh cepat (seperti: *pedas*, *tidak pedas*, *porsi banyak*).
  - Terdapat opsi checkbox *"Ingat sebagai preferensi saya"*.
- Jika `menu.subDishes` kosong (menu tunggal biasa):
  - Tampilan tetap simpel seperti sekarang (Ikut / Tidak Ikut + catatan opsional).

### 4. Pengaturan Preferensi (`/preferences`)
- Pada kartu preferensi, jika menu memiliki sub-menu, anggota dapat memilih sub-menu default mereka.
- Ketika menu tersebut diposting di kemudian hari, pilihan harian mereka otomatis terisi dengan sub-menu favorit dan catatan mereka.

### 5. Ringkasan Porsi Dapur & WhatsApp (`/yono`)
- **Rincian Porsi Belanja**:
  Jika ada pesanan dengan sub-menu, rincian porsi dipecah per varian:
  - `3 porsi Bakmi Goreng`
  - `2 porsi Nasi Goreng`
  - `1 porsi Bakmi Godhog`
  - `Total: 6 porsi`
- **Daftar Pesanan & WhatsApp**:
  - `1. Pram - Bakmi Goreng (Catatan: pedas)`
  - `2. Iqbal - Nasi Goreng (Catatan: gak pake seledri)`

## Boundaries
- **Always do**:
  - Pertahankan gaya neo-brutalist (border-2 border-black, shadow-black, aksen kuning/hijau kontras).
  - Pastikan ukuran tombol / chip pilihan varian minimal 44px di mobile screen.
  - Sanitasi koma dan spasi ganda pada parsing subDishes.
  - Hindari penggunaan em dash (`—`) dalam teks sesuai aturan *antislop*.
- **Never do**:
  - Jangan menghapus data respon yang sudah ada saat menambahkan kolom baru ke model Menu.

## Success Criteria
1. Admin dapat menyimpan Menu Bawaan dengan daftar sub-menu di Pengaturan.
2. Pak Yono dapat memposting menu harian lengkap dengan daftar sub-menu.
3. Anggota dapat memilih salah satu sub-menu saat ikut makan di `/home`.
4. Anggota dapat menyimpan preferensi sub-menu di `/preferences`.
5. Rincian porsi dan pesan WhatsApp di `/yono` terkelompok rapi per sub-menu.
6. Seluruh unit test, linting, dan build Next.js lulus 100%.
