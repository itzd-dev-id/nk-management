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

### 5. Daftar Pekerjaan Ringkas (Concise V2.0)
Sistem sekarang menggunakan penamaan yang lebih ringkas dan langsung (Direct Naming) namun tetap mencakup seluruh fase proyek.

**PENTING**: Sesuai permintaan, item seperti **Bondek** dan **Wiremesh** kini sudah termasuk dalam kategori **`Struktur_Atas_Bekisting`** agar pelaporan lebih simpel.

**K3 & Persiapan**
- K3: `K3_Induction`, `K3_Toolbox_Meeting`, `K3_Rambu_Safety`, `K3_Safety_Net`, `K3_Audit_Mingguan`.
- Persiapan: `Persiapan_Pembersihan_Lahan`, `Persiapan_Pagar_Proyek`, `Persiapan_Bouwplank`, `Persiapan_Direksi_Keet`, `Persiapan_Mobilisasi_Alat`.

**Pekerjaan Tanah & Struktur Bawah**
- Tanah: `Tanah_Galian`, `Tanah_Urugan_Pasir`, `Tanah_Lantai_Kerja`, `Tanah_Pemadatan`.
- Struktur Bawah: `Struktur_Bawah_Pancang`, `Struktur_Bawah_Pile_Cap`, `Struktur_Bawah_Tie_Beam`, `Struktur_Bawah_Pedestal`, `Struktur_Bawah_Pembesian`, `Struktur_Bawah_Bekisting`, `Struktur_Bawah_Pengecoran`.

**Struktur Atas (Fokus Kemudahan Field)**
- `Struktur_Atas_Bekisting` (Termasuk Bondek/Wiremesh)
- `Struktur_Atas_Pembesian`
- `Struktur_Atas_Pengecoran`
- `Struktur_Atas_Finish_Trowel`
- `Struktur_Atas_Bongkar_Bekisting`

**Arsitektur & Atap**
- Arsitektur: `Arsitektur_Pasangan_Bata`, `Arsitektur_Plesteran`, `Arsitektur_Acian`, `Arsitektur_Keramik_Lantai/Dinding`, `Arsitektur_Pengecatan`, `Arsitektur_Plafon`, `Arsitektur_Kusen_Pintu_Jendela`, `Arsitektur_Sanitary`.
- Atap: `Atap_Rangka_Baja`, `Atap_Penutup_Genteng/Spandek`, `Atap_Lisplang`, `Atap_Talang`.

**MEP, Lansekap & Material**
- MEP: `MEP_Instalasi_Listrik`, `MEP_Instalasi_Air`, `MEP_Instalasi_AC`, `MEP_Fire_Alarm`, `MEP_CCTV`.
- Lansekap: `Lansekap_Paving_Block`, `Lansekap_Saluran`, `Lansekap_Taman`.
- Material: `Material_Pasir_Batu`, `Material_Semen`, `Material_Besi_Beton`, `Material_Bata_Ringan`, `Material_Beton_Ready_Mix`.

**Dokumentasi**
- `Dokumentasi_Progress_Mingguan`, `Dokumentasi_Drone_View`, `Dokumentasi_Joint_Inspection`.

---
*Status: Operasional & Tersinkronisasi ke GitHub (Versi Ringkas 2.0)*
