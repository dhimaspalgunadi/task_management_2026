# SIGAP IT — Sistem Manajemen Tugas Unit IT (5 Kampus SPK Katolik)

Aplikasi web untuk memonitor pekerjaan staf IT di 5 kampus (KL, GS1, GS2, GK, Icon)
mengikuti alur kerja 6 tahap: **Input → Proses → Output → Evaluasi → Tindak Lanjut → Penyelesaian**.

Dibangun dengan Next.js (App Router), Prisma ORM, PostgreSQL (Netlify DB / Neon), dan NextAuth.

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

## Deploy ke Netlify (dengan Netlify DB / Neon Postgres)

1. Push repo ini ke GitHub, lalu hubungkan ke [Netlify](https://app.netlify.com) sebagai site baru.
   Build command & publish directory sudah dikonfigurasi di `netlify.toml`
   (memakai `@netlify/plugin-nextjs`).
2. Aktifkan **Netlify DB** (Postgres bertenaga Neon) di dashboard site Netlify, atau jalankan
   `netlify db init` dari Netlify CLI di root project. Ini akan menyediakan connection string.
3. Di **Site settings → Environment variables**, set:
   - `DATABASE_URL` — connection string dari Netlify DB / Neon (harus tersedia saat build, karena
     `netlify.toml` menjalankan `prisma migrate deploy` sebagai bagian dari build)
   - `AUTH_SECRET` — string acak (`openssl rand -base64 32`)
   - `AUTH_URL` — URL produksi site, mis. `https://nama-site.netlify.app`
4. Deploy. Setelah deploy pertama sukses, jalankan seed sekali via Netlify CLI:
   ```bash
   netlify env:pull .env.production
   DATABASE_URL="<connection-string-produksi>" npm run db:seed
   ```
   atau jalankan `prisma migrate deploy` + seed dari environment mana pun yang punya akses ke
   `DATABASE_URL` produksi.

## Skrip yang tersedia

| Skrip | Kegunaan |
|---|---|
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` | Build produksi |
| `npm run db:migrate` | Buat & terapkan migrasi Prisma (lokal) |
| `npm run db:deploy` | Terapkan migrasi tanpa membuat file baru (produksi/CI) |
| `npm run db:seed` | Isi data kampus, staf, dan contoh tugas |
