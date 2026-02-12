import { Building } from '@/types';

export const BUILDINGS: Building[] = [
    { code: 'T-BP', name: 'Barak Pekerja', index: 100 },
    { code: 'T-DK', name: 'Direksi Keet', index: 101 },
    { code: 'T-GM', name: 'Gudang Material', index: 102 },
    { code: 'T-GS', name: 'Gudang Sementara', index: 103 },
    { code: 'T-KP', name: 'Kantin Pekerja', index: 104 },
    { code: 'T-MP', name: 'Mushola Pekerja', index: 105 },
    { code: 'T-TP', name: 'Toilet Pekerja', index: 106 },
    { code: 'A', name: 'Rusun Guru', index: 0 },
    { code: 'B', name: 'Asrama Putra SD', index: 2 },
    { code: 'C', name: 'Asrama Putri SD', index: 4 },
    { code: 'D', name: 'Asrama Putri SMP', index: 6 },
    { code: 'E', name: 'Asrama Putra SMA', index: 8 },
    { code: 'F', name: 'Kantin SD', index: 10 },
    { code: 'G', name: 'Dapur Gudang', index: 13 },
    { code: 'H', name: 'Guest House', index: 14 },
    { code: 'I', name: 'Gedung SMA', index: 15 },
    { code: 'J', name: 'Gedung SMP', index: 16 },
    { code: 'K', name: 'Gedung SD', index: 17 },
    { code: 'L', name: 'Masjid', index: 18 },
    { code: 'M', name: 'Gedung Serbaguna', index: 19 },
    { code: 'N', name: 'Lapangan Upacara', index: 20 },
    { code: 'O', name: 'Pos Keamanan', index: 21 },
    { code: 'P', name: 'Rumah Pompa', index: 22 },
    { code: 'Q', name: 'Power House', index: 23 },
    { code: 'R', name: 'TPS', index: 24 },
    { code: 'S', name: 'Gedung Ibadah', index: 25 },
    { code: 'T', name: 'Lapangan Basket', index: 26 },
    { code: 'U', name: 'Lapangan Sepak Bola', index: 27 },
    { code: 'V', name: 'Gudang Perawatan', index: 28 }
];

export const WORK_HIERARCHY = [
    {
        category: '01. Persiapan & SMKK',
        tasks: [
            'Barak Tenaga dan Barang',
            'Bouwplank',
            'Induction',
            'Jaring Pengaman',
            'Mobilisasi Alat',
            'Pagar Sementara',
            'Papan Nama Proyek',
            'Pematangan Lahan',
            'Pembersihan Lahan',
            'Rambu Safety',
            'Safety Sign',
            'Toolbox Meeting'
        ]
    },
    {
        category: '02. Pekerjaan Tanah',
        tasks: [
            'Buis Beton 30cm',
            'Galian',
            'Galian Biasa',
            'Mengangkut Tanah',
            'Pemadatan Tanah',
            'Urugan Pasir',
            'Urugan Split',
            'Urugan Tanah'
        ]
    },
    {
        category: '03. Struktur Bawah',
        tasks: [
            'Bekisting Pondasi',
            'Lantai Kerja',
            'Pancang',
            'Pedestal',
            'Pembesian Pondasi',
            'Pemotongan Kepala Pancang',
            'Penetrasi Tiang Pancang',
            'Pengecoran Pondasi',
            'Pengadaan Tiang Pancang',
            'Pile Cap',
            'Pondasi Batu Belah',
            'Sambungan Pancang',
            'Sloof',
            'Tie Beam'
        ]
    },
    {
        category: '04. Struktur Atas',
        tasks: [
            'Balok',
            'Balok Praktis',
            'Bekisting',
            'Finish Trowel',
            'Kolom',
            'Kolom Praktis',
            'Pembesian',
            'Pengecoran',
            'Plat Lantai',
            'Ramp',
            'Tangga',
            'Wiremesh'
        ]
    },
    {
        category: '05. Arsitektur & Atap',
        tasks: [
            'Acian',
            'Bata Ringan',
            'Cat Eksterior',
            'Cat Interior',
            'Closet',
            'Daun Jendela',
            'Daun Pintu',
            'Dinding Rooster',
            'Finishing Beton Expose',
            'Floor Drain',
            'Guiding Block',
            'Homogeneous Tile Polish',
            'Homogeneous Tile Unpolished',
            'Kanopi',
            'Keramik Lantai',
            'Kusen',
            'Lisplang',
            'Nok Atap',
            'Pasangan Bata',
            'Penutup Atap',
            'Plafon Gypsum',
            'Plafon Kalsiboard',
            'Plafond UPVC',
            'Plesteran',
            'Railing Tangga',
            'Rangka Metalfuring',
            'Sanitary',
            'Wastafel'
        ]
    },
    {
        category: '06. MEP',
        tasks: [
            'CCTV',
            'Cubicle 20KV',
            'Fire Alarm',
            'Genset',
            'Genset 300KVA Silent',
            'Grounding',
            'Instalasi AC',
            'Instalasi Listrik',
            'Instalasi Pipa Air',
            'Instalasi Pipa Limbah',
            'Panel Listrik',
            'Pompa Air',
            'Smoke Detector',
            'Split AC',
            'Stop Kontak',
            'Tandon Air',
            'Titik Lampu',
            'VRV AC'
        ]
    },
    {
        category: '07. Lansekap & Lapangan',
        tasks: [
            'Grass Block',
            'Grow In',
            'Jaring Pengaman Lapangan',
            'Land Clearing',
            'Marka Lapangan',
            'Media Tanam',
            'Net Voli',
            'Paving Block',
            'Penanaman Pohon',
            'Penanaman Rumput',
            'Ring Basket',
            'Rumput',
            'Saluran Drainase',
            'Taman'
        ]
    },
    {
        category: '08. Furniture',
        tasks: [
            'Almari',
            'Bed UKS',
            'Kitchen Set',
            'Kursi Guru',
            'Kursi Kelas',
            'Kursi Rapat',
            'Lemari',
            'Meja Guru',
            'Meja Kelas',
            'Meja Rapat',
            'Papan Tulis',
            'Signage',
            'Sofa'
        ]
    },
    {
        category: '09. Dokumentasi',
        tasks: [
            'As Built Drawing',
            'Dokumentasi Material',
            'Drone View',
            'Inspeksi Bersama',
            'Progress Bulanan',
            'Progress Harian',
            'Progress Mingguan'
        ]
    },
    {
        category: '10. Logistik & Material',
        tasks: [
            'Pengiriman Bata',
            'Pengiriman Batu',
            'Pengiriman Besi',
            'Pengiriman Beton',
            'Pengiriman Keramik',
            'Pengiriman Material',
            'Pengiriman Pasir',
            'Pengiriman Semen',
            'Pengiriman Tanah'
        ]
    }
];
