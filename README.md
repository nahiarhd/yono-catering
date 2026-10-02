# Yono Catering

Aplikasi pesan katering harian: Pak Yono posting menu, anggota pilih sebelum batas waktu, pengingat lewat Telegram dan web push.

## Development

```bash
cp .env.example .env
pnpm install
pnpm db:push && pnpm db:seed
pnpm dev
```

Cek sebelum push: `pnpm lint && npx tsc --noEmit && pnpm test:unit`.

## Self-Hosted Deployment (Low-Resource VPS / Standalone)

Aplikasi ini mendukung **Next.js Standalone Build** sehingga dapat dijalankan di VPS murah dengan RAM kecil (512MB - 1GB) tanpa perlu menjalankan `pnpm install` atau `pnpm build` di server.

1. **Build Otomatis via GitHub Actions**:
   - Setiap push ke `main`, GitHub Actions akan membuat arsip `.tar.gz` di tab **Actions -> Summary (Artifacts)**.
   - Setiap push git tag (`git tag v1.0.0 && git push --tags`), rilis otomatis dibuat di **GitHub Releases** dengan file `yono-catering-standalone.tar.gz`.
   - Atau bisa dijalankan manual lewat tab **Actions -> Build & Release Standalone -> Run workflow**.

2. **Jalankan di Server**:
   ```bash
   # 1. Ekstrak
   tar -xzf yono-catering-standalone.tar.gz

   # 2. Setup env
   cp .env.example .env && nano .env

   # 3. Setup database SQLite pertama kali
   ./db-push.sh
   ./seed.sh # opsional: seed data awal (Pak Yono, Raihan, PIN: 1234)

   # 4. Jalankan dengan PM2 (hemat RAM, auto-restart)
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save && pm2 startup
   ```

