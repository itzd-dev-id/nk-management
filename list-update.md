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

### 5. Daftar Pekerjaan Ringkas & Bersih (V2.1 Final)
Pembaruan terakhir memastikan antarmuka yang bersih dengan spasi pada kategori, namun tetap menggunakan underscore pada nama file untuk kompatibilitas sistem.

**Format Penamaan:**
- **Kategori (Display UI)**: Menggunakan spasi (contoh: `Struktur Atas`, `Material On Site`).
- **Pekerjaan (File Name)**: Menggunakan underscore untuk pemisahan kata (contoh: `Toolbox_Meeting`, `Paving_Block`).
- **Struktur File**: `[Tanggal]_[Kategori]-[Pekerjaan]_[Gedung]_[Progress]_[No].jpg`

**Contoh Daftar Terkini:**

**Struktur Atas & Struktur Bawah**
- **Kategori**: `Struktur Atas`, `Struktur Bawah`
- **Pekerjaan**: `Bekisting` (Sudah termasuk Bondek/Wiremesh), `Pembesian`, `Pengecoran`, `Pedestal`, `Tie_Beam`, `Finish_Trowel`.

**K3 & Persiapan**
- **Kategori**: `K3 dan Keselamatan`, `Persiapan`
- **Pekerjaan**: `Induction`, `Toolbox_Meeting`, `Rambu_Safety`, `Pembersihan_Lahan`, `Bouwplank`, `Direksi_Keet`.

**Arsitektur & MEP**
- **Kategori**: `Arsitektur`, `MEP`
- **Pekerjaan**: `Pasangan_Bata`, `Plesteran`, `Acian`, `Keramik_Lantai`, `Sanitary`, `Instalasi_Listrik`, `Instalasi_Air`, `Fire_Alarm`.

**Lansekap, Material & Dokumentasi**
- **Kategori**: `Lansekap`, `Material On Site`, `Dokumentasi`
- **Pekerjaan**: `Paving_Block`, `Taman`, `Pasir_Batu`, `Besi_Beton`, `Beton_Ready_Mix`, `Progress_Mingguan`, `Drone_View`.

---
*Status: Operasional & Tersinkronisasi ke GitHub (V2.1 Final Clean)*
