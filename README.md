# Family Finance Tracker (APBK) 💰

Aplikasi web modern dan Progressive Web App (PWA) untuk pencatatan, pemantauan, dan analisis finansial keluarga secara real-time dengan menggunakan **Google Sheets** sebagai database gratis, aman, dan tanpa biaya server database bulanan.

---

## ✨ Fitur Utama

### 📱 1. Mobile-First & Progressive Web App (PWA)
- **Installable App**: Dapat di-install langsung ke homescreen iOS (Safari: *Add to Home Screen*) maupun Android (Chrome/PWA prompt) seperti aplikasi native.
- **Bottom Navigation Dock**: Navigasi bawah mengambang (*Summary*, *Sheets*, *Quick Action*, *Analytics*) yang nyaman dioperasikan satu tangan di smartphone.
- **Card-Based Mobile Layout**: Tabel pengeluaran di smartphone otomatis beradaptasi menjadi kartu intuitif dengan tombol centang haptic, metrik anggaran, dan tanpa perlu horizontal scrolling.
- **Bottom Sheet Modal**: Form tambah/edit pengeluaran muncul dari bawah layar dengan drag-handle khas mobile app.

### 🌐 2. Dukungan Multi-Bahasa (Bilingual: 🇮🇩 ID / 🇬🇧 EN)
- Tombol pengganti bahasa instan di header atas.
- Menerjemahkan seluruh UI, label kolom, kartu KPI, diagram, hingga modal pop-up secara real-time.
- Format penamaan bulan otomatis menyesuaikan bahasa (contoh: *Oktober 2026* ⇄ *October 2026*).
- Pilihan bahasa tersimpan otomatis di browser (`localStorage`).

### 🌓 3. Tema Gelap & Terang (Dark / Light Mode)
- Tampilan mode gelap modern (*slate-900 / dark aesthetic*) yang hemat daya dan nyaman di mata malam hari.
- Mendukung sinkronisasi otomatis preferensi OS dan toggle manual satu klik.

### 📊 4. Dashboard Tren & Analisis Finansial (`/analytics`)
- **Indikator Kinerja Utama (KPI)**:
  - Rata-rata pengeluaran bulanan vs target anggaran.
  - Total alokasi tabungan dan rasio tabungan (*Savings Rate*).
  - Skor disiplin anggaran (*Budget Discipline Rate*).
  - Identifikasi bulan paling hemat vs bulan paling boros.
- **Grafik Komparasi Tren**: Visualisasi batang perbandingan antara rencana anggaran vs realisasi aktual tiap periode.
- **10 Pos Pengeluaran Terbesar**: Peringkat pos belanja yang paling banyak menyerap anggaran.
- **Distribusi Porsi Rekening**: Persentase beban belanja per dompet / rekening bank.
- **Rekap Historis Seluruh Periode**: Tabel rekapitulasi performa bulan-ke-bulan dengan status otomatis (✓ *Surplus/Hemat* atau ⚠️ *Deficit/Overbudget*).

### 💰 5. Pengelolaan Pendapatan & Alokasi Tabungan Otomatis
- **Formula Pendapatan Fleksibel**: Mendukung input nominal gabungan langsung maupun penjumlahan rincian sumber pendapatan (misal: `11500000 + 3650000 + 4190000`).
- **Kalkulasi Tabungan Otomatis**: Menghitung sisa dana dari Pendapatan dikurangi Total Anggaran yang otomatis diarahkan ke rekening tabungan/investasi.
- Pencatatan nama rekening tujuan dan keterangan pocket tabungan.

### ⚡ 6. Pencatatan Pengeluaran Cepat & Fleksibel
- **Inline Editing (Desktop)**: Klik langsung pada nominal Aktual untuk mengupdate pengeluaran tanpa perlu modal.
- **Optimistic UI Update**: Perubahan checklist dan angka langsung ter-update di layar secara instan (0ms latency) sebelum data tersimpan di Google Sheets.
- **Auto-Checklist**: Otomatis menandai checklist terbayar ketika nominal aktual telah diisi mencapai target anggaran.
- **Pencarian & Filter Cepat**: Filter berdasarkan status pembayaran (*Semua*, *Belum Bayar*, *Lunas*) atau filter per rekening/dompet.

### 💳 7. Pivot Alokasi Rekening & Bulk Rename
- Tabel ringkasan otomatis mengelompokkan anggaran dan realisasi per rekening (BCA, Mandiri, Blu, Gopay, Cash, dll).
- **Ganti Nama Rekening Massal**: Ubah nama rekening di semua pos pengeluaran dalam satu klik tanpa perlu edit manual satu per satu di spreadsheet.

### 📅 8. Generator Bulan Baru Otomatis (1-Klik)
- Salin struktur pos anggaran dari bulan sebelumnya ke lembar baru Google Sheets.
- Otomatis mereset nilai aktual & checklist serta memasang formula perhitungan selisih dan ringkasan posisi.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database / Storage**: [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis`
- **PWA**: Web App Manifest, Service Worker Caching, Apple Mobile Web App Capable
- **Type Safety**: TypeScript 5

---

## 🚀 Panduan Setup & Instalasi

### 1. Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.new) dan buat spreadsheet baru.
2. Buat tab/sheet pertama dengan format nama bulan dan tahun (contoh: `Januari 2026` atau `Oktober 2026`).
3. Anda dapat mengacu pada struktur kolom pada file [`template/template_sheet.csv`](./template/template_sheet.csv).
4. Salin **Spreadsheet ID** dari URL browser Anda:
   ```text
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```

### 2. Setup Google Service Account (Gratis)
1. Buka [Google Cloud Console](https://console.cloud.google.com).
2. Buat project baru (misal: `Family Finance Tracker`).
3. Buka **APIs & Services > Library**, cari **"Google Sheets API"**, lalu klik **Enable**.
4. Buka **APIs & Services > Credentials** > klik **Create Credentials > Service Account**.
5. Isi nama service account (contoh: `sheets-sync`), lalu klik **Create and Continue** > **Done**.
6. Klik service account yang baru dibuat, buka tab **Keys** > klik **Add Key > Create new key > JSON**. File JSON kredensial akan terunduh.
7. Simpan file tersebut di direktori project (misalnya `service-account-key.json`).
8. **PENTING**: Buka Google Spreadsheet Anda, klik tombol **Share / Bagikan**, masukkan alamat email service account (berakhiran `@...iam.gserviceaccount.com`), dan berikan hak akses sebagai **Editor**.

### 3. Konfigurasi Environment Variable
Salin file `.env.local.example` menjadi `.env.local`:
```bash
cp .env.local.example .env.local
```

Buka `.env.local` dan isi kredensial:
```env
# Opsi 1: Menggunakan file path JSON lokal
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json

# Opsi 2 (Disarankan untuk Deployment Vercel / Cloud): Salin seluruh isi JSON service account dalam 1 baris
# GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# ID Google Spreadsheet Anda
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### 4. Menjalankan Aplikasi
```bash
# Instal dependensi
npm install

# Jalankan server development lokal
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000).

Untuk memeriksa build produksi:
```bash
npm run build
npm run start
```

---

## 📁 Struktur Direktori

```text
├── template/
│   └── template_sheet.csv         # Format kolom & acuan spreadsheet
├── public/
│   ├── icons/                     # Icon PWA (192px, 512px, apple-touch-icon)
│   ├── manifest.webmanifest       # Konfigurasi PWA Web App Manifest
│   └── sw.js                      # Service Worker offline caching
├── src/
│   ├── app/
│   │   ├── analytics/             # Halaman Analitik & Tren Finansial
│   │   ├── api/
│   │   │   ├── analytics/         # Endpoint agregasi metrik & tren historis
│   │   │   ├── generate/          # Endpoint generate lembar bulan baru
│   │   │   └── sheets/            # Endpoint CRUD data spreadsheet
│   │   ├── bulan/[sheetName]/     # Halaman rincian anggaran bulanan
│   │   ├── layout.tsx             # Root layout, PWA meta tags, Theme & Language Provider
│   │   └── page.tsx               # Dashboard ringkasan & daftar bulan
│   ├── components/                # Komponen UI modular
│   │   ├── AddItemModal.tsx       # Modal tambah pengeluaran baru
│   │   ├── EditIncomeModal.tsx    # Modal atur pendapatan & alokasi tabungan
│   │   ├── EditItemModal.tsx      # Modal edit detail & hapus pengeluaran
│   │   ├── ExpenseTable.tsx       # Tabel pengeluaran (Desktop & Mobile Card View)
│   │   ├── GenerateModal.tsx      # Modal generate bulan baru
│   │   ├── ManagePositionsModal.tsx # Modal ganti nama rekening massal
│   │   ├── Navbar.tsx             # Header navigasi, Switcher Bahasa & Tema
│   │   ├── PositionSummaryTable.tsx # Tabel alokasi dana per rekening/dompet
│   │   ├── SavingsCard.tsx        # Kartu kalkulasi arus kas & tabungan
│   │   └── SummaryCards.tsx       # Kartu KPI total budget, aktual, dan selisih
│   └── lib/
│       ├── format.ts              # Helper format mata uang Rupiah & parsing
│       ├── google-sheets.ts       # Integrasi Google Sheets API v4
│       ├── i18n.tsx               # Kamus terjemahan Bahasa Indonesia & Inggris
│       └── types.ts               # TypeScript interfaces
├── .env.local.example
├── next.config.ts
├── package.json
└── README.md
```

---

## 📄 Lisensi
Didistribusikan di bawah lisensi **MIT**. Bebas digunakan dan dimodifikasi untuk kebutuhan pribadi maupun keluarga.
