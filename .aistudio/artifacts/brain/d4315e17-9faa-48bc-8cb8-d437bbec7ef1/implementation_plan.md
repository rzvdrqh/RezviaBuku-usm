# PoS (Point of Sale) Kasir & Auto-Ratio Profit Management - PustakaVia

Sistem kasir Point of Sale (PoS) terintegrasi untuk PustakaVia dengan kontrol inventaris, manajemen Harga Pokok Penjualan (HPP / Harga Beli), kalkulator otomatis rasio profit / margin harga jual, kalkulator pembayaran kasir (tunai + kembalian otomatis & QRIS), serta cetak struk belanja kasir langsung terhubung ke database Firestore real-time.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Pertanyaan klarifikasi telah dilewati (*skipped*). Implementasi akan menggunakan **opsi yang direkomendasikan** untuk menghadirkan pengalaman kasir toko retail yang efisien, mudah digunakan, dan akurat:

- **Formula Auto-Ratio Profit**: Menggunakan model *Markup On Cost* standar retail: $\text{Harga Jual} = \text{Harga Beli} \times (1 + \text{Markup Ratio})$. Di antarmuka, staf kasir/admin dapat memasukkan Harga Beli dan persentase Margin yang diinginkan (default 30%), lalu sistem secara otomatis menghitung Harga Jual dan nominal laba kotor per buku secara *two-way real-time binding*.
- **Penempatan & Akses PoS Kasir**: Disediakan **akses ganda**: (1) Tab khusus **"Kasir PoS"** di dalam Dashboard Admin, dan (2) Tombol pintas **"Mode Kasir PoS"** di bilah navigasi atas (Navbar) yang membuka antarmuka kerja kasir yang ergonomis, cepat, dan responsif.
- **Metode Pembayaran & Cetak Struk**: Mendukung pembayaran **Tunai** (dengan tombol uang cepat Rp 50.000, Rp 100.000, Uang Pas, dan perhitungan kembalian otomatis), **QRIS Instan**, serta tombol cetak struk belanja kasir (*Thermal 58mm/80mm format* siap cetak).

---

## 1. Overview & Core Concept

### What It Does
Fitur ini memperluas webstore PustakaVia menjadi sistem *omnichannel* toko buku: selain melayani pesanan webstore, kasir toko fisik dapat melakukan transaksi langsung dengan barcode/ISBN atau pencarian judul instan, memotong stok real-time di Firestore, mengkalkulasi laba kotor (*Gross Margin*), dan mencetak struk transaksi.

### Target Persona
- **Kasir & Staf Toko PustakaVia**: Membutuhkan sistem pencatatan kasir yang cepat, bebas hambatan, otomatis menghitung kembalian uang, dan langsung mencetak struk belanja.
- **Pemilik / Manajer Toko (Rezvia)**: Membutuhkan visibilitas terhadap Harga Pokok Penjualan (HPP), persentase keuntungan, dan total valuasi modal inventaris toko secara live.

### Key Value
- **Akurasi Keuangan**: Menghilangkan tebak-tebakan harga jual dengan rumus rasio profit yang konsisten.
- **Stok Tunggal (Real-Time Single Source of Truth)**: Transaksi di kasir fisik langsung memotong stok di webstore online secara otomatis pada detik yang sama di database Firestore.
- **Perhitungan Laba Bersih**: Laporan penjualan dapat membedakan antara omset kotor (*gross revenue*) dan laba bersih (*net gross profit*).

---

## 2. User Experience & Visual Design

### A. Palet Warna & Visual Identity (Pastel Cerah & Ergonomis)
- Mengikuti tema pastel cerah PustakaVia: latar belakang *warm off-white/cream* (`#faf7f2`), aksen *pastel rose/blush* (`#f43f5e`, `#fb7185`), *soft sage mint* untuk status dan pembayaran sukses, serta tipografi **Plus Jakarta Sans** dan **Quicksand**.
- Layout layar kasir didesain ergonomis:
  - **Sisi Kiri (65%)**: Katalog buku cepat dengan pencarian instan, filter kategori (Novel, Komik Jepang, Sains, Bahasa, Modul Tes), badge stok live, dan kartu buku ringkas.
  - **Sisi Kanan (35%)**: Keranjang kasir (*sticky checkout drawer*), daftar item terpilih, kuantitas stepper, ringkasan subtotal, tombol pembayaran cepat, dan tombol cetak struk.

### B. Alur Pengguna (Key User Flows)

```
1. Cari / Klik Buku ───► 2. Masuk Keranjang Kasir ───► 3. Pilih Metode Bayar
   (Scan / Ketik Judul)     (Qty Stepper + Diskon)         (Tunai / QRIS)
                                                                 │
6. Cetak Struk Kasir ◄─── 5. Stok Terpotong Real-Time ◄─── 4. Input Uang &
   (Format Thermal)          (Database Firestore)             Hitung Kembalian
```

1. **Pencarian Cepat & Tambah ke Keranjang**: Kasir mengetik nama buku atau mengklik kartu buku; item langsung masuk ke struk kasir sisi kanan dalam 1 klik.
2. **Kalkulator Pembayaran & Kembalian**:
   - Jika memilih **Tunai**: Muncul tombol cepat nominal uang (`Uang Pas`, `Rp 50.000`, `Rp 100.000`, `Rp 200.000`). Sistem otomatis menampilkan nominal kembalian dengan warna hijau mint lembut.
   - Jika memilih **QRIS**: Menampilkan kode QRIS dinamis untuk dipindai pelanggan.
3. **Penyelesaian Transaksi & Potong Stok**: Menekan tombol *"Selesaikan Transaksi & Cetak"*, transaksi otomatis tersimpan di Firestore dengan tipe transaksi `POS_STORE`, memotong stok buku, dan memunculkan modal struk belanja kasir.

### C. Antarmuka Manajemen Harga & Rasio Profit (Inventory Settings)
- Kolom baru pada tabel inventaris: **Harga Beli (HPP)**, **Ratio Profit (%)**, **Harga Jual (IDR)**, dan **Estimasi Margin (IDR)**.
- *Live Pricing Calculator* di modal produk:
  - Input Harga Beli (misal Rp 70.000) $\to$ Masukkan Rasio (misal 35%) $\to$ Otomatis merekomendasikan Harga Jual Rp 94.500 (dapat dibulatkan ke kelipatan ribuan terdekat).
  - Mengubah Harga Jual $\to$ Otomatis menghitung ulang rasio profit riil.
- Widget Ringkasan Modal & Laba: Menampilkan **Total Modal Inventaris Toko**, **Total Estimasi Nilai Jual**, dan **Potensi Total Laba**.

---

## 3. Key Product Decisions & Trade-Offs

- **Formula Rasio Profit**:
  - *Keputusan*: Rasio dihitung berdasarkan Margin Markup dari Harga Beli: $\text{Harga Jual} = \text{Harga Beli} \times (1 + \text{Ratio}/100)$.
  - *Alasan*: Metode markup paling lazim dan intuitif bagi pengelola toko buku retail saat menerima pasokan dari penerbit / distributor.
- **Penyimpanan Transaksi PoS**:
  - *Keputusan*: Transaksi kasir disimpan di koleksi Firestore `orders` dengan flag `channel: "pos"` dan status langsung `selesai`.
  - *Alasan*: Menjaga kesatuan data (*single source of truth*) sehingga laporan sales dapat menyaring omset webstore online vs transaksi kasir toko fisik tanpa membuat tabel terpisah yang membingungkan.
- **Pencegahan Error Firestore Transaction**:
  - *Keputusan*: Seluruh pemotongan stok kasir menerapkan arsitektur *All-Reads-First-Then-Writes* yang sudah diverifikasi dan bebas error.

---

## 4. Technical Architecture & Data Strategy

### System & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PustakaVia Application                          │
├────────────────────────────────────────────────────────────────────────┤
│ Navigation: Storefront View  │  Admin Portal  │  PoS Kasir Workstation │
└──────────────┬───────────────────────┬───────────────────┬─────────────┘
               │                       │                   │
               ▼                       ▼                   ▼
       ┌───────────────┐       ┌───────────────┐   ┌───────────────┐
       │ Store Catalog │       │ Admin Modules │   │  PoS Cashier  │
       │ & Web Cart    │       │ • Inventory   │   │ • Quick Search│
       └───────┬───────┘       │ • Auto-Ratio  │   │ • Cash Calc   │
               │               │ • Sales Report│   │ • Receipt Print
               │               └───────┬───────┘   └───────┬───────┘
               │                       │                   │
               ▼                       ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Firestore Database Service                        │
│ • /books: { id, title, costPrice, price, profitRatio, stock, ... }      │
│ • /orders: { id, orderNumber, channel: "pos"|"web", status, items, ... }│
│ • /customers: { id, totalSpent, totalOrders, ... }                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model Updates
1. **Model `Book`** ditambahkan properti:
   - `costPrice`: `number` (Harga beli / HPP dalam IDR)
   - `profitRatio`: `number` (Persentase rasio keuntungan, default 30%)
2. **Model `Order`** ditambahkan properti:
   - `channel`: `'web' | 'pos'`
   - `cashierName`?: `string`
   - `cashPaid`?: `number` (Nominal uang tunai diserahkan)
   - `changeDue`?: `number` (Nominal kembalian)
3. **Komponen Baru yang Dibangun**:
   - `src/components/Pos/PosWorkstation.tsx`: Layar kerja kasir interaktif dengan grid produk instan dan keranjang kasir.
   - `src/components/Pos/PosReceiptModal.tsx`: Format cetak struk nota belanja thermal 58mm/80mm siap print.
   - `src/components/Admin/TabInventoryPricing.tsx`: Modul pengaturan HPP, kalkulator rasio profit massal, dan valuasi aset toko.

---

## 5. Implementation Roadmap (Next Steps After Approval)

1. **Step 1: Data Model & Seed Updates**:
   - Perbarui tipe data `Book` dan `Order` di `src/types/index.ts`.
   - Tambahkan default `costPrice` (HPP) dan `profitRatio` (rasio profit) pada seed buku di `src/data/seedBooks.ts`.
2. **Step 2: Service Layer & Transaction**:
   - Tambahkan fungsi `createPosTransaction()` di `src/services/storeService.ts` untuk memproses transaksi kasir dan memotong stok seketika.
   - Tambahkan fungsi update batch rasio profit dan harga buku.
3. **Step 3: PoS Workstation & Receipt Component**:
   - Bangun antarmuka kasir `PosWorkstation.tsx` dengan pencarian buku instan, kalkulator kembalian uang, dan pilihan metode bayar.
   - Bangun modal cetak struk kasir `PosReceiptModal.tsx` dengan layout thermal printer yang rapi.
4. **Step 4: Inventory & Pricing Management Module**:
   - Tambahkan tab pengaturan harga dan auto-ratio profit di Panel Admin (`TabInventoryPricing.tsx`).
   - Sediakan form kalkulator dua arah (Harga Beli $\to$ Rasio Profit $\to$ Harga Jual).
5. **Step 5: Integrasi Navbar & Verification**:
   - Tambahkan tombol cepat kasir di Navbar dan tab navigasi admin.
   - Jalankan `compile_applet` dan `lint_applet` untuk memastikan verifikasi 100% bebas error.
