# Task List: Sub-Menu & Varian Lauk pada Menu Katering dan Preferensi

- [x] Task 1: Database Schema & Dishes Library Updates
  - Acceptance: Kolom `subDishes String?` ada di model `Menu`. `src/lib/dishes.ts` memiliki helper `parseSubDishes` dan tipe `DefaultDish.subDishes`.
  - Verify: `npm run db:push` berhasil dan unit test `src/lib/__tests__/dishes.test.ts` lulus.
  - Files: `prisma/schema.prisma`, `src/lib/dishes.ts`, `src/lib/__tests__/dishes.test.ts`, `src/lib/menu-data.ts`

- [x] Task 2: Tally & WhatsApp Recap Grouping by Sub-Menu
  - Acceptance: Rincian porsi belanja di `buildTally` dan pesan WhatsApp mengelompokkan jumlah porsi berdasarkan varian sub-menu yang dipilih anggota.
  - Verify: Unit test `src/lib/__tests__/tally.test.ts` dan `src/lib/__tests__/whatsapp.test.ts` lulus.
  - Files: `src/lib/tally.ts`, `src/lib/whatsapp.ts`, `src/lib/__tests__/tally.test.ts`, `src/lib/__tests__/whatsapp.test.ts`

- [x] Task 3: Settings Default Dishes with Sub-Menu
  - Acceptance: Admin dapat menginputkan pilihan sub-menu (dipisahkan koma) saat menambahkan menu bawaan di `/settings`.
  - Verify: `npm run build` dan `npm run lint` lulus.
  - Files: `src/app/settings/actions.ts`, `src/components/default-dishes-form.tsx`, `src/lib/id.ts`

- [x] Task 4: Kitchen Menu Form & Actions with Sub-Menu
  - Acceptance: Form posting menu di `/yono` mendukung input sub-menu, otomatis terisi saat memilih preset menu bawaan, dan menyimpan ke database. Halaman dapur menampilkan rincian porsi per varian.
  - Verify: `npm run build` dan `npm run lint` lulus.
  - Files: `src/app/yono/actions.ts`, `src/components/menu-form.tsx`, `src/app/yono/page.tsx`, `src/lib/id.ts`

- [x] Task 5: User Response Form & Preferences with Sub-Menu
  - Acceptance: Di `/home`, jika menu memiliki sub-menu, anggota wajib memilih salah satu varian saat memilih "Ikut Makan". Di `/preferences`, anggota dapat menyimpan varian default mereka.
  - Verify: `npm run build` dan `npm run lint` lulus.
  - Files: `src/app/home/actions.ts`, `src/components/response-form.tsx`, `src/components/dish-preferences-card.tsx`, `src/app/home/page.tsx`, `src/lib/id.ts`

- [x] Task 6: Final Verification & Knowledge Graph Update
  - Acceptance: `npm run test:unit`, `npm run lint`, dan `npm run build` lulus 100%. `graphify update .` dijalankan.
  - Verify: Semua perintah lulus tanpa error.
