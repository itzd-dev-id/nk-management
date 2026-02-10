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

### 5. Daftar Pekerjaan Master (Versi 2.0 - 180+ Item)
Sistem sekarang menggunakan daftar pekerjaan tingkat profesional yang disinkronkan dengan standar **SNI & RAB Nindya Karya**.

**K3 & Persiapan**
- K3: `Safety_Induction`, `Toolbox_Meeting`, `Safety_Morning`, `Audit_Internal`, `Inspeksi_APD`, `Rambu_K3`, `Safety_Net`, `Railing_Pengaman`, `Barikade`, `Inspeksi_Alat`, `Izin_Kerja_Panas/Ketinggian`, `Tanggap_Darurat`, `Kotak_P3K`, `Fogging`.
- Persiapan: `Site_Clearing`, `Pagar_Proyek`, `Bouwplank`, `Direksi_Keet`, `Gudang`, `Barak`, `Papan_Nama`, `Air_Listrik_Kerja`, `Mobilisasi`, `Survey_Topografi`, `Jalan_Akses`.

**Struktur Bawah (Substructure)**
- Pondasi: `Tiang_Pancang_Pemancangan/Sambungan/Chipping`, `Bore_Pile_Pengeboran/Pembesian/Tremie`, `PDA_Test`, `Sondir`.
- Komponen: `Pile_Cap`, `Tie_Beam`, **`Kolom_Pedestal`**, `Pondasi_Batu_Kali`, `Pondasi_Tapak` (Pembesian, Bekisting, Pengecoran).

**Struktur Atas (Superstructure)**
- Kolom/Balok/Plat: `Kolom_Utama`, `Kolom_Praktis`, `Balok_Utama`, `Balok_Anak`, `Plat_Lantai` (Bondek, Wiremesh, Pembesian, Bekisting, Pengecoran, Finish_Trowel).
- Lainnya: `ShearWall`, `Tangga`, `Ring_Balok`, `Bongkar_Bekisting`, `Curing_Beton_Watering/Compound`.

**Arsitektur & Atap**
- Dinding/Lantai: `Bata_Merah/Ringan`, `Plesteran`, `Sponengan`, `Acian_Semen/Skimcoat`, `Cat_Interior/Eksterior/Plamir`, `Granit`, `Keramik`, `Vinyl`, `Plint`.
- Plafon/Pintu: `Rangka_Galfum`, `Gypsum`, `PVC`, `GRC`, `Kusen_Aluminium/Kayu`, `Pintu_Engineering`, `Kaca_Tempered`, `Hardware_Kunci`.
- Atap: `Rangka_Baja_Ringan`, `Gording_Steel`, `Aluminium_Foil`, `Genteng_Metal/Keramik`, `Spandek`, `Bubungan`, `Lisplang`, `Talang`, `Flashings`.

**MEP & Perlindungan**
- Elektrikal: `Kabel_TR/Power`, `Tray_Kabel`, `Panel_LVMDP/SDP`, `Pipa_Conduit`, `Titik_Lampu`, `Armatur`, `Saklar`.
- Plumbing/HVAC: `Pipa_Air_Bersih/Kotor/Vent`, `Pompa_Booster`, `Roof_Tank`, `Bio_Septic_Tank`, `Pipa_Refrigerant`, `Indoor_Outdoor_AC`.
- Spesifik: `Fire_Alarm`, `Hydrant`, `APAR`, `CCTV_IP`, `Wifi_AP`, `Sound_System`, `Sistem_Penangkal_Petir`, **`Waterproofing_Toilet/Dak`**.

**Lansekap, Material & Dokumentasi**
- Lansekap: `Paving_Block`, `Cansteen`, `Grass_Block`, `Saluran_U_Ditch/Cover`, `Lampu_Taman`, `Rumput_Pohon`, `Signage_Marking`.
- Material: `Pasir`, `Batu_Split`, `Semen`, `Besi_Polos/Ulir`, `Bata_Ringan`, `Keramik`, `Beton_Ready_Mix`, `Besi_Wiremesh`, `Bondek`.
- Monitoring: `Titik_Nol`, `Progress_Mingguan/Bulanan`, `Drone_Aerial`, `Uji_Kubus/Baja/Hydro`, `Joint_Inspection`, `Kunjungan_Direksi`, `STH-1`.

---
*Status: Operasional & Tersinkronisasi ke GitHub (Versi Master 2.0)*
