This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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

