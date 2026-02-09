# NK Management - Proyek Sekolah Rakyat

NK Management adalah aplikasi otomasi dokumentasi proyek konstruksi yang dirancang khusus untuk mempermudah pengelolaan foto dan data lapangan dengan integrasi langsung ke **Google Drive**.

## 🚀 Fitur Utama

- **Login Google (OAuth2)**: Akses aman tanpa perlu berbagi password, langsung menggunakan akun Google Anda.
- **Penyimpanan Eksklusif Google Drive**: Menghilangkan ketergantungan pada penyimpanan lokal untuk kompatibilitas cloud (Vercel) yang lebih baik.
- **Auto-Naming Cerdas**: Foto otomatis diubah namanya sesuai format standar: `Tanggal_Pekerjaan_Gedung_Kode_Progres`.
- **Struktur Folder Otomatis**: Aplikasi secara otomatis membangun folder `Gedung / Jenis Pekerjaan` di dalam Google Drive Anda.
- **Indikator Simpan Otomatis**: G-Drive Folder ID tersimpan secara permanen di browser dengan indikator visual "Saved".
- **UI Premium & Responsif**: Interface modern dengan animasi halus menggunakan Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: Next.js API Routes, NextAuth.js.
- **Storage**: Google Drive API v3.

## ⚙️ Persiapan & Instalasi

### 1. Environment Variables
Buat file `.env` di root direktori atau tambahkan variabel berikut di dashboard Vercel:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="random_long_string_for_security"
```

### 2. Setup Google Cloud Console
Untuk menggunakan fitur upload, Anda perlu mendaftarkan aplikasi di Google Cloud:

1. Aktifkan **Google Drive API**.
2. Di **OAuth Consent Screen**, pilih External dan tambahkan email Anda sebagai **Test User**.
3. Di **Credentials**, buat **OAuth 2.0 Client ID** tipe "Web Application".
4. Tambahkan Redirect URI: `https://[domain-anda].vercel.app/api/auth/callback/google`.

## 📖 Cara Penggunaan

1. **Login**: Klik tombol "Login Google" di header. Pastikan memberikan izin akses Drive.
2. **Folder ID**: Masukkan ID Folder Google Drive (Root) di kolom yang tersedia. Ceklis hijau "Saved" akan muncul jika berhasil tersimpan.
3. **Pilih Gedung & Pekerjaan**: Gunakan sidebar untuk memilih lokasi dan jenis pekerjaan.
4. **Upload**: Drag & drop atau pilih file foto. Aplikasi akan memproses penamaan dan menguploadnya ke folder yang sesuai di Drive.

---
Dikembangkan untuk efisiensi dokumentasi lapangan **PT. Nindya Karya**.
