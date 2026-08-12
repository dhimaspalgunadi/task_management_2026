# SIGAP IT — Sistem Manajemen Tugas Unit IT (5 Kampus SPK Katolik)

Aplikasi web untuk memonitor pekerjaan staf IT di 5 kampus (KL, GS1, GS2, GK, Icon)
mengikuti alur kerja 6 tahap: **Input → Proses → Output → Evaluasi → Tindak Lanjut → Penyelesaian**.

Dibangun dengan Next.js (App Router), Prisma ORM, PostgreSQL (Netlify Database), dan NextAuth.

## Fitur

- Login staf berbasis email/kata sandi, dibatasi per kampus (kecuali Kepala IT Pusat yang melihat semua kampus)
- Dashboard kanban 5 kolom status tugas + statistik per kampus + indikator SLA (on time/overdue)
- Alur kerja 6 tahap dengan validasi berurutan dan audit trail tiap perpindahan tahap
- Kebijakan jam kerja: reguler Senin–Jumat 07.15–16.15; masuk/lembur akhir pekan wajib No. Surat Penugasan (Sabtu 07.15–13.15)
- Tabel SLA per prioritas (Urgent/Tinggi/Sedang/Rendah), dihitung dalam menit kerja efektif
- Tampilan warna-warni & interaktif dengan Tailwind CSS

## Struktur Data & Aturan Bisnis

Kebijakan jam kerja dan SLA didefinisikan satu kali di `src/lib/taskUtils.ts` (port dari
skill `it-task-management-sekolah`) — jangan duplikasi angka SLA/jam kerja di file lain.

## Menjalankan secara lokal

```bash
npm install

# siapkan database Postgres lokal, lalu isi DATABASE_URL & AUTH_SECRET di .env
cp .env.example .env

npx prisma migrate dev --name init
npm run db:seed   # membuat 5 kampus, staf demo, dan beberapa contoh tugas
npm run dev
```

Buka http://localhost:3000/login. Kredensial demo (password sama untuk semua akun):

| Peran | Email | Password |
|---|---|---|
| Kepala IT Pusat | kepala.it@spkkatolik.sch.id | ItSpk2026! |
| Koordinator per kampus | koordinator.\<kode-kampus\>@spkkatolik.sch.id | ItSpk2026! |
| Staf IT | \<nama\>@spkkatolik.sch.id (lihat output `db:seed`) | ItSpk2026! |

**Ganti semua password demo sebelum digunakan di produksi.**

## Deploy ke Netlify (dengan Netlify Database)

Proyek ini memakai [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-db/)
(paket `@netlify/database`) — Postgres yang otomatis disediakan Netlify saat deploy, tanpa perlu
daftar ke penyedia database lain. `src/lib/prisma.ts` dan `scripts/netlify-migrate.mjs` sudah
dikonfigurasi untuk memakai koneksi ini otomatis kalau env var `DATABASE_URL` belum diisi manual.

1. Push repo ini ke GitHub, lalu hubungkan ke [Netlify](https://app.netlify.com) sebagai site baru.
   Build command & publish directory sudah dikonfigurasi di `netlify.toml`
   (memakai `@netlify/plugin-nextjs`).
2. Karena `@netlify/database` sudah ada di `package.json`, Netlify akan otomatis menyediakan
   database Postgres untuk site ini saat build/deploy — tidak ada tombol tambahan yang perlu
   diklik.
3. Di **Site settings → Environment variables**, set dua ini secara manual (tidak otomatis):
   - `AUTH_SECRET` — string acak (`openssl rand -base64 32`)
   - `AUTH_URL` — URL produksi site, mis. `https://nama-site.netlify.app`

   (`DATABASE_URL` tidak perlu diisi manual — diambil otomatis dari Netlify Database. Kalau kamu
   memang punya Postgres sendiri dan ingin memakainya, isi `DATABASE_URL` manual dan itu akan
   dipakai lebih dulu daripada Netlify Database.)
4. Deploy. Setelah deploy pertama sukses, jalankan seed sekali lewat Netlify CLI (agar terkoneksi
   ke database production yang sama):
   ```bash
   netlify link          # hubungkan folder lokal ke site Netlify ini
   netlify env:pull .env.production
   DATABASE_URL="$(grep NETLIFY_DATABASE_URL .env.production | cut -d= -f2-)" npm run db:seed
   ```
   Kalau env var-nya bernama beda, cek dulu isinya dengan `netlify env:list`.

## Skrip yang tersedia

| Skrip | Kegunaan |
|---|---|
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` | Build produksi |
| `npm run db:migrate` | Buat & terapkan migrasi Prisma (lokal) |
| `npm run db:deploy` | Terapkan migrasi tanpa membuat file baru (produksi/CI) |
| `npm run db:seed` | Isi data kampus, staf, dan contoh tugas |
