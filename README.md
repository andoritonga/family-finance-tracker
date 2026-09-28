# Family Finance Tracker 💰

Aplikasi web modern untuk pencatatan dan pengelolaan finansial keluarga, menggunakan **Google Sheets** sebagai database gratis dan real-time.

## Fitur Utama

- 📊 **Dashboard Ringkasan** — Melihat total Budget, Aktual, dan Selisih secara real-time disertai progress bar pengeluaran.
- 📅 **Generate Bulan Baru Otomatis (1 Klik)** — Salin template pengeluaran dari bulan sebelumnya, reset kolom Aktual dan Checklist, serta formula otomatis untuk Selisih, Total, dan Ringkasan Rekening.
- ✏️ **Inline Editing** — Edit nilai Aktual langsung di tabel pengeluaran tanpa perlu bolak-balik buka spreadsheet.
- ✅ **Checklist Pengeluaran** — Centang item yang sudah dibayar, otomatis tersimpan ke Google Sheets.
- 💳 **Ringkasan Posisi/Rekening** — Breakdown pengeluaran per rekening/metode pembayaran (Bank, E-Wallet, Cash, dll).
- 📱 **Mobile & Desktop Responsive** — Tampilan bersih, intuitif, dan nyaman dibuka dari smartphone.

---

## Cara Setup & Instalasi

### 1. Buat Google Spreadsheet
1. Buka [Google Sheets](https://sheets.new) dan buat spreadsheet baru.
2. Buat tab/sheet pertama dengan nama bulan dan tahun (misal: `Januari 2026`).
3. Anda dapat menggunakan format template yang disediakan pada file [`template/template_sheet.csv`](./template/template_sheet.csv) sebagai acuan struktur kolom.
4. Salin **Spreadsheet ID** dari URL browser Anda:
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

### 2. Setup Google Service Account (Gratis)
1. Buka [Google Cloud Console](https://console.cloud.google.com).
2. Buat project baru (atau gunakan project yang ada).
3. Buka menu **APIs & Services > Library**, cari **"Google Sheets API"**, lalu klik **Enable**.
4. Buka **APIs & Services > Credentials** > klik **Create Credentials > Service Account**.
5. Isi nama service account (contoh: `finance-tracker`), lalu klik **Done**.
6. Klik pada service account yang baru dibuat, buka tab **Keys** > klik **Add Key > Create new key (JSON)**. File JSON akan terunduh ke komputer Anda.
7. Simpan file JSON tersebut di folder project ini (misalnya dengan nama `service-account-key.json`).
8. **PENTING**: Buka Google Spreadsheet Anda, klik tombol **Share**, lalu tambahkan email service account (berakhiran `@...gserviceaccount.com`) dengan akses **Editor**.

### 3. Konfigurasi Environment Variable
Salin file `.env.local.example` menjadi `.env.local`:
```bash
cp .env.local.example .env.local
```

Buka `.env.local` dan sesuaikan:
```env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### 4. Jalankan Aplikasi
```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## Struktur Proyek

```
├── template/
│   └── template_sheet.csv         # Contoh format data dan formula spreadsheet
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts  # Endpoint generate tab bulan baru
│   │   │   └── sheets/            # Endpoints fetch & update data spreadsheet
│   │   ├── bulan/[sheetName]/     # Halaman detail bulanan
│   │   ├── layout.tsx
│   │   └── page.tsx               # Dashboard utama
│   ├── components/                # Komponen UI (ExpenseTable, SummaryCards, dll)
│   └── lib/                       # Google Sheets client & helper functions
├── .env.local.example
└── package.json
```

## Lisensi
MIT License
