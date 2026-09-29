# Implementation Plan: Sub-Menu & Varian Lauk pada Menu Katering dan Preferensi

## 1. Overview
Fitur ini mengintegrasikan sub-menu / varian hidangan (contoh: *Bakmi Jogja* -> *Bakmi Goreng, Bakmi Godhog, Nasi Goreng*) dari pengaturan bawaan, posting menu harian di dapur, formulir pemesanan harian anggota di Home, halaman preferensi, hingga rekap porsi belanja di Dapur & pesan WhatsApp.

## 2. Architecture & Data Flow
1. **Database**:
   - `Menu.subDishes`: Kolom string opsional berisi daftar varian dipisahkan koma (contoh: `"Bakmi Goreng, Bakmi Godhog, Nasi Goreng"`).
   - `Response.swapDish`: Kolom string yang sudah ada dipakai untuk menyimpan nama varian sub-menu yang dipilih (contoh: `"Nasi Goreng"`).
   - `DishPreference.swapDish`: Kolom string yang sudah ada dipakai untuk menyimpan default varian sub-menu pilihan pengguna.
   - `Settings.defaultDishes`: Diperluas dengan array `subDishes: string[]`.
2. **Library & Utilities**:
   - `src/lib/dishes.ts`: Tambah helper `parseSubDishes(str: string): string[]` dan perbarui `parseDefaultDishes`.
   - `src/lib/tally.ts`: Hitung breakdown porsi berdasarkan varian (`r.swapDish || mainDish`).
   - `src/lib/whatsapp.ts`: Format rekap pesanan dengan menyertakan nama varian sub-menu.
3. **Components & Pages**:
   - `/settings` (`DefaultDishesForm`): Input kolom sub-menu dipisahkan koma.
   - `/yono` (`MenuForm`): Input kolom sub-menu untuk posting menu harian, sinkron saat chip preset diklik.
   - `/home` (`ResponseForm`): Jika `subDishes` ada, tampilkan pilihan chip varian (wajib dipilih saat "Ikut").
   - `/preferences` (`DishPreferencesCard`): Pilihan default varian jika menu bawaan memiliki `subDishes`.
   - `/yono` (Kitchen View): Rincian porsi belanja mengelompokkan per varian sub-menu.

## 3. Tasks Breakdown
- **Task 1: Database Schema & Dishes Library Updates**
  - Update `prisma/schema.prisma` (`subDishes String?` pada model `Menu`).
  - Run `npm run db:push`.
  - Update `src/lib/dishes.ts` with `subDishes` support & `parseSubDishes`.
  - Update unit tests in `src/lib/__tests__/dishes.test.ts`.
- **Task 2: Tally & WhatsApp Recap Grouping by Sub-Menu**
  - Update `src/lib/tally.ts` to tally by chosen variant when present.
  - Update `src/lib/whatsapp.ts` to show chosen variant in WhatsApp breakdown and orders.
  - Update unit tests in `src/lib/__tests__/tally.test.ts` and `src/lib/__tests__/whatsapp.test.ts`.
- **Task 3: Settings Default Dishes with Sub-Menu**
  - Update `src/app/settings/actions.ts` to accept `subDishes` input.
  - Update `src/components/default-dishes-form.tsx` to render and input subDishes.
  - Update `src/lib/id.ts` for translation labels.
- **Task 4: Kitchen Menu Form & Actions**
  - Update `src/app/yono/actions.ts` (`postMenuAction` & `upsertMenu`) to save `subDishes`.
  - Update `src/components/menu-form.tsx` to include sub-menu input with auto-fill from presets.
  - Update `src/app/yono/page.tsx` to pass `subDishes` to tally & orders.
- **Task 5: User Response Form & Preferences**
  - Update `src/app/home/actions.ts` (`saveResponseAction` & `saveDishPreferenceAction`) to save selected `subDish` into `swapDish`.
  - Update `src/components/response-form.tsx` to show variant selector chips when menu has sub-menus.
  - Update `src/components/dish-preferences-card.tsx` to support selecting default sub-menu variant.
  - Update `src/app/home/page.tsx` & `src/app/preferences/page.tsx`.
- **Task 6: Verification & Polish**
  - Run `npm run test:unit`.
  - Run `npm run lint`.
  - Run `npm run build`.
  - Run `graphify update .`.

## 4. Verification Checkpoints
- Unit tests pass after each step.
- Build succeeds without TypeScript or Turbopack errors.
- Visual check: Neo-brutalist styling, 44px minimum tap targets, no em dashes.
