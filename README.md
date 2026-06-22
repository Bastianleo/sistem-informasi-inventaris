# Stokly — Aplikasi Manajemen Inventaris

Aplikasi manajemen inventaris (gudang) berbasis **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, dan **shadcn/ui** (tema *new-york*, dark mode default).

Data kini disimpan di **database asli (SQLite) lewat Prisma ORM** — bukan lagi mock/localStorage. Autentikasi memakai sesi JWT (httpOnly cookie) dengan password yang di-hash menggunakan bcrypt.

## ✨ Fitur

- **Login** — terhubung ke database, validasi email/password, "ingat saya" (memperpanjang masa berlaku sesi).
- **Dasbor** — KPI, grafik tren stok masuk/keluar, distribusi kategori, mutasi terbaru, produk yang perlu perhatian.
- **Produk** — CRUD lengkap, pencarian, filter (kategori/supplier/status stok), pagination.
- **Kategori** & **Supplier** — CRUD lengkap dengan validasi relasi (tidak bisa dihapus bila masih dipakai produk).
- **Stok Masuk/Keluar** — pencatatan mutasi (transaksi atomik di database), validasi stok tidak boleh minus, hapus mutasi otomatis mengembalikan stok.

## 🔐 Akun Demo (dari seed)

| Role  | Email              | Password   |
|-------|---------------------|------------|
| Admin | admin@stokly.id     | admin123   |
| Staff | staff@stokly.id     | staff123   |

> ⚠️ Ganti/hapus akun ini sebelum men-deploy ke production.

## 🚀 Setup & Menjalankan Proyek

### 1. Install dependencies
```bash
npm install
```
Perintah ini otomatis menjalankan `prisma generate` lewat hook `postinstall`.

### 2. Siapkan environment variable
File `.env` sudah disediakan dengan nilai default untuk development:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ganti-dengan-string-acak-yang-panjang-dan-rahasia-untuk-produksi"
```
**Wajib ganti `AUTH_SECRET`** dengan string acak yang panjang sebelum produksi (mis. `openssl rand -base64 32`).

### 3. Buat database & isi data awal (seed)
```bash
npm run db:push
npm run db:seed
```
- `db:push` membuat file `prisma/dev.db` sesuai schema (`prisma/schema.prisma`).
- `db:seed` mengisi data kategori, supplier, produk, riwayat stok, dan ketiga akun demo di atas (password otomatis di-hash).

### 4. Jalankan aplikasi
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000).

### Build untuk produksi
```bash
npm run build
npm run start
```

### Script Prisma lain yang tersedia
| Command | Fungsi |
|---|---|
| `npm run db:studio` | Membuka Prisma Studio (GUI lihat/edit data) |
| `npm run db:reset` | Reset total schema + seed ulang dari awal |

## 🗂️ Struktur Folder Penting

```
prisma/
├─ schema.prisma         # Definisi model database (User, Category, Supplier, Product, StockMovement)
└─ seed.ts                # Script pengisi data awal

src/
├─ middleware.ts                    # Proteksi rute dashboard + redirect login (cek sesi JWT)
├─ app/
│  ├─ login/page.tsx                # Halaman login
│  ├─ api/                          # Route handler backend (REST, dipanggil via fetch dari client)
│  │  ├─ auth/{login,logout,me}/route.ts
│  │  ├─ categories/route.ts (+ [id]/route.ts)
│  │  ├─ suppliers/route.ts (+ [id]/route.ts)
│  │  ├─ products/route.ts (+ [id]/route.ts)
│  │  └─ stock-movements/route.ts (+ [id]/route.ts)
│  └─ (dashboard)/
│     ├─ layout.tsx                 # Server Component: cek sesi via getCurrentUser()
│     ├─ dashboard/page.tsx
│     ├─ products/page.tsx
│     ├─ categories/page.tsx
│     ├─ suppliers/page.tsx
│     └─ stock/page.tsx
├─ components/
│  ├─ ui/                           # Komponen shadcn/ui
│  └─ app-sidebar.tsx, site-header.tsx, stat-card.tsx, ...
├─ hooks/
│  ├─ use-inventory.ts              # SWR hooks: useCategories, useSuppliers, useProducts, useMovements
│  └─ use-current-user.ts
└─ lib/
   ├─ prisma.ts                     # Prisma Client singleton
   ├─ auth.ts                       # getCurrentUser() / requireUser() (server-only)
   ├─ session.ts                    # Sign/verify JWT sesi (edge-safe, dipakai middleware)
   ├─ password.ts                  # Hash/verifikasi password (bcryptjs)
   ├─ api-client.ts                 # Fungsi fetch untuk mutasi dari sisi client
   ├─ fetcher.ts                    # Fetcher dasar untuk SWR
   └─ types.ts                      # Tipe data bersama (Product, Category, dst.)
```

## 🧠 Arsitektur Singkat

- **Autentikasi**: login memverifikasi password dengan bcrypt → membuat JWT (lib `jose`) → disimpan di cookie httpOnly `stokly_session`. `middleware.ts` memeriksa cookie ini di edge runtime untuk redirect cepat; layout dashboard (`(dashboard)/layout.tsx`) melakukan pengecekan kedua di server sekaligus mengambil data user terbaru dari database.
- **Data fetching**: setiap halaman dashboard memakai SWR (`src/hooks/use-inventory.ts`) untuk mengambil data dari REST API di `src/app/api/**`. Setelah create/update/delete, cache SWR direvalidasi (`mutate()`) agar tampilan langsung sinkron.
- **Transaksi stok**: pembuatan/penghapusan mutasi stok memakai `prisma.$transaction` agar perubahan `stock` pada produk dan pencatatan `StockMovement` selalu konsisten (atomik).

## 🛠️ Teknologi

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma ORM · SQLite · bcryptjs · jose (JWT) · SWR · Recharts · Sonner · next-themes · lucide-react

## ❓ Troubleshooting

- **`Error: @prisma/client did not initialize yet`** → jalankan `npx prisma generate`.
- **Login selalu gagal setelah setup baru** → pastikan sudah menjalankan `npm run db:seed`.
- **Ingin pindah ke PostgreSQL/MySQL** → ubah `provider` di `prisma/schema.prisma` dan `DATABASE_URL` di `.env`, lalu jalankan ulang `npm run db:push && npm run db:seed`.
