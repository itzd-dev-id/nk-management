# Log Pembaruan Sistem (Februari 2026)

Berikut adalah daftar peningkatan fitur dan perbaikan yang telah diimplementasikan:

### 1. Sinkronisasi Cloud & Data
- **Pemisahan Database**: Data Gedung (`buildings.json`) dan Pekerjaan (`works.json`) sekarang disimpan secara terpisah di Google Drive untuk manajemen yang lebih rapi.
- **Prioritas Cloud (Drive-First)**: Sistem selalu mencari data terbaru di Drive terlebih dahulu sebelum menggunakan data default internal.
- **Migrasi Otomatis**: Sistem secara otomatis memecah file lama `nk-management.json` menjadi format baru saat pertama kali dijalankan.

### 2. Peningkatan UI & UX
- **Edit Langsung (Inline Editing)**: Nama gedung dan tugas pekerjaan dapat diedit langsung di tab Settings tanpa perlu hapus-tambah.
- **Notifikasi Toast**: Muncul notifikasi melayang di pojok kanan atas untuk konfirmasi simpan, edit, hapus, dan kesalahan sistem.
- **Indikator Loading**: Tombol "Add" menampilkan spinner saat proses sinkronisasi ke cloud sedang berjalan.
- **Ikon & Konfirmasi Hapus**: Menggunakan ikon tempat sampah (`Trash2`) dan kotak konfirmasi spesifik untuk mencegah penghapusan tidak sengaja.

### 3. Pengolahan Foto & Penamaan
- **Ensemen Format JPEG**: Semua foto hasil kompresi sekarang dipaksa memiliki ekstensi `.jpg` (memperbaiki masalah file `.blob`).
- **Daftar Pekerjaan Granular**: Root database telah diperbarui dengan tugas konstruksi yang sangat detail (contoh: `Struktur_Pekerjaan_Pemasangan_Bekisting`, `MEP_Pekerjaan_Instalasi_Pipa`).
- **Pratinjau Akurat**: Nama file di antrean (queue) sekarang langsung mencerminkan format final `.jpg`.

### 4. Daftar Gedung & Lokasi
| Kode | Nama Gedung |
| :--- | :--- |
| **GL** | Global |
| **A** | Rusun Guru |
| **B** | Asrama Putra SD |
| **C** | Asrama Putri SD |
| **D** | Asrama Putri SMP |
| **E** | Asrama Putra SMA |
| **F** | Kantin |
| **G** | Dapur Gudang |
| **H** | Guest House |
| **I** | Gedung SMA |
| **J** | Gedung SMP |
| **K** | Gedung SD |
| **L** | Masjid |
| **M** | Gedung Serbaguna |
| **N** | Lapangan Upacara |
| **O** | Pos Keamanan |
| **P** | Rumah Pompa |
| **Q** | Power House |
| **R** | TPS |
| **S** | Gedung Ibadah |
| **T** | Lapangan Basket/Bola |
| **T01** | Direksi Keet |

### 5. Daftar Pekerjaan (Granular)
**Persiapan**
- `Persiapan_Pekerjaan_Pemasangan_Bouwplank`
- `Persiapan_Pekerjaan_Pembersihan_Lahan`
- `Persiapan_Pekerjaan_Direksi_Keet`

**Struktur**
- `Struktur_Pekerjaan_Lantai_Kerja`
- `Struktur_Pekerjaan_Pemasangan_Bekisting`
- `Struktur_Pekerjaan_Pembesian`
- `Struktur_Pekerjaan_Pengecoran_Beton`
- `Struktur_Pekerjaan_Bongkar_Bekisting`
- `Struktur_Pekerjaan_Galian_Tanah`

**Arsitektur**
- `Arsitektur_Pekerjaan_Pasangan_Bata`
- `Arsitektur_Pekerjaan_Plesteran_Dinding`
- `Arsitektur_Pekerjaan_Acian_Dinding`
- `Arsitektur_Pekerjaan_Pasang_Keramik`
- `Arsitektur_Pekerjaan_Pengecatan_Dinding`

**MEP & Material**
- `MEP_Pekerjaan_Instalasi_Pipa_Air`
- `MEP_Pekerjaan_Instalasi_Kabel_Listrik`
- `Material_On_Site_Besi_Beton`
- `Material_On_Site_Beton_Ready_Mix`

---
*Status: Operasional & Tersinkronisasi ke GitHub*
