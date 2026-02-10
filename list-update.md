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

### 5. Daftar Pekerjaan Masif (100+ Item)
Sistem sekarang memiliki 100+ pilihan pekerjaan yang sangat detail dengan format `[Kategori]_[Nama_Pekerjaan]_[Sub_Pekerjaan]`.

**PENTING**: **Struktur Bawah** kini mencakup **Kolom Pedestal** secara spesifik sesuai permintaan.

**K3 & Persiapan**
- `K3_Safety_Induction`, `K3_Toolbox_Meeting`, `K3_Pemasangan_Safety_Net`
- `Persiapan_Pemasangan_Bouwplank`, `Persiapan_Direksi_Keet`, `Persiapan_Mobilisasi_Alat_Berat`

**Struktur Bawah (Substructure)**
- `Struktur_Bawah_Tiang_Pancang_Pemancangan`
- `Struktur_Bawah_Pile_Cap_Pembesian`, `Struktur_Bawah_Pile_Cap_Pengecoran`
- **`Struktur_Bawah_Kolom_Pedestal_Bekisting`**
- **`Struktur_Bawah_Kolom_Pedestal_Pembesian`**
- **`Struktur_Bawah_Kolom_Pedestal_Pengecoran`**
- `Struktur_Bawah_Tie_Beam_Pembesian`, `Struktur_Bawah_Tie_Beam_Pengecoran`

**Struktur Atas (Superstructure)**
- `Struktur_Atas_Kolom_Utama_Pembesian`, `Struktur_Atas_Kolom_Utama_Bekisting`, `Struktur_Atas_Kolom_Utama_Pengecoran`
- `Struktur_Atas_Balok_Utama_Pembesian`, `Struktur_Atas_Balok_Utama_Bekisting`, `Struktur_Atas_Balok_Utama_Pengecoran`
- `Struktur_Atas_Plat_Lantai_Pembesian`, `Struktur_Atas_Plat_Lantai_Bekisting`, `Struktur_Atas_Plat_Lantai_Pengecoran`
- `Struktur_Atas_Bongkar_Bekisting_Balok`, `Struktur_Atas_Curing_Beton`

**Arsitektur & MEP**
- `Arsitektur_Dinding_Pasangan_Bata_Ringan`, `Arsitektur_Dinding_Plesteran`, `Arsitektur_Dinding_Acian`
- `Arsitektur_Lantai_Pasang_Keramik`, `Arsitektur_Plafon_Pasang_Gypsum`
- `MEP_Listrik_Instalasi_Titik_Lampu`, `MEP_Plumbing_Instalasi_Pipa_Air_Bersih`, `MEP_HVAC_Instalasi_Indoor_AC`

**Material & Dokumentasi**
- `Material_On_Site_Besi_Beton_Ulir`, `Material_On_Site_Semen_PC`, `Material_On_Site_Beton_Ready_Mix`
- `Dokumentasi_Progress_Mingguan`, `Dokumentasi_Drone_View_Aerial`, `Dokumentasi_Joint_Inspection`

---
*Status: Operasional & Tersinkronisasi ke GitHub*
