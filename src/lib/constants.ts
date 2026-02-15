import { Building } from '@/types';

export const BUILDINGS: Building[] = [
    { code: 'T-BP', name: 'Barak Pekerja', index: 100 },
    { code: 'T-DK', name: 'Direksi Keet', index: 101 },
    { code: 'T-GM', name: 'Gudang Material', index: 102 },
    { code: 'T-GS', name: 'Gudang Sementara', index: 103 },
    { code: 'T-KP', name: 'Kantin Pekerja', index: 104 },
    { code: 'T-MP', name: 'Mushola Pekerja', index: 105 },
    { code: 'T-TP', name: 'Toilet Pekerja', index: 106 },
    { code: 'MS', name: 'Material On Site', index: 107 },
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
        category: 'Persiapan',
        groups: [
            {
                name: 'Umum',
                tasks: [
                    'Barak Tenaga dan Barang',
                    'Bouwplank',
                    'Mobilisasi Alat',
                    'Pagar Sementara',
                    'Papan Nama Proyek',
                    'Pematangan Lahan',
                    'Pembersihan Lahan'
                ]
            }
        ]
    },
    {
        category: 'SMKK',
        groups: [
            {
                name: 'Umum',
                tasks: [
                    'Induction',
                    'Jaring Pengaman',
                    'Rambu Safety',
                    'Safety Sign',
                    'Toolbox Meeting'
                ]
            }
        ]
    },
    {
        category: 'Struktur',
        groups: [
            {
                name: 'Footplat',
                tasks: ['Galian', 'Lantai kerja', 'Bekisting', 'Besi', 'Beton']
            },
            {
                name: 'Tie Beam',
                tasks: ['Galian', 'Lantai kerja', 'Bekisting', 'Besi', 'Beton']
            },
            {
                name: 'Pelat',
                tasks: ['Galian', 'Lantai kerja', 'Bekisting', 'Besi', 'Beton']
            },
            {
                name: 'Kolom',
                tasks: ['Bekisting', 'Besi', 'Beton']
            },
            {
                name: 'Balok',
                tasks: ['Bekisting', 'Besi', 'Beton']
            },
            {
                name: 'Tanah',
                tasks: [
                    'Galian Biasa',
                    'Galian_Pancang',
                    'Pemadatan Tanah',
                    'Mengangkut Tanah',
                    'Urugan Tanah',
                    'Urugan Pasir',
                    'Urugan Split'
                ]
            },
            {
                name: 'Pondasi & Pancang',
                tasks: [
                    'Pancang',
                    'Pengadaan Tiang Pancang',
                    'Penetrasi Tiang Pancang',
                    'Sambungan Pancang',
                    'Pemotongan Kepala Pancang',
                    'Pile Cap',
                    'Pengecoran Pondasi',
                    'Pembesian Pondasi',
                    'Bekisting Pondasi',
                    'Pondasi Batu Belah'
                ]
            },
            {
                name: 'Lainnya',
                tasks: [
                    'Balok Praktis',
                    'Kolom Praktis',
                    'Pedestal',
                    'Tangga',
                    'Trap_Tangga',
                    'Ramp',
                    'Finish Trowel',
                    'Lean_Concrete',
                    'Wiremesh',
                    'Buis Beton 30cm'
                ]
            }
        ]
    },
    {
        category: 'Arsitektur',
        groups: [
            {
                name: 'Dinding',
                tasks: [
                    'Pasangan Bata',
                    'Bata Ringan',
                    'Plesteran',
                    'Acian',
                    'Dinding Rooster',
                    'Finishing Beton Expose'
                ]
            },
            {
                name: 'Lantai',
                tasks: [
                    'Keramik Lantai',
                    'Homogeneous Tile Polish',
                    'Homogeneous Tile Unpolished',
                    'Guiding Block'
                ]
            },
            {
                name: 'Plafon',
                tasks: [
                    'Plafon Gypsum',
                    'Plafon Kalsiboard',
                    'Plafond UPVC',
                    'Rangka Metalfuring'
                ]
            },
            {
                name: 'Pintu & Jendela',
                tasks: [
                    'Kusen',
                    'Daun Pintu',
                    'Daun Jendela'
                ]
            },
            {
                name: 'Sanitasi',
                tasks: [
                    'Sanitary',
                    'Closet',
                    'Wastafel',
                    'Floor Drain'
                ]
            },
            {
                name: 'Lainnya',
                tasks: [
                    'Cat Eksterior',
                    'Cat Interior',
                    'Kanopi',
                    'Lisplang',
                    'Nok Atap',
                    'Penutup Atap',
                    'Railing Tangga'
                ]
            }
        ]
    },
    {
        category: 'MEP',
        groups: [
            {
                name: 'Listrik',
                tasks: [
                    'Instalasi Listrik',
                    'Panel Listrik',
                    'Cubicle 20KV',
                    'Titik Lampu',
                    'Stop Kontak',
                    'Grounding'
                ]
            },
            {
                name: 'Air & Plumbing',
                tasks: [
                    'Instalasi Pipa Air',
                    'Instalasi Pipa Limbah',
                    'Pompa Air',
                    'Tandon Air'
                ]
            },
            {
                name: 'HVAC',
                tasks: [
                    'Instalasi AC',
                    'Split AC',
                    'VRV AC'
                ]
            },
            {
                name: 'Sistem',
                tasks: [
                    'Fire Alarm',
                    'Smoke Detector',
                    'CCTV',
                    'Genset',
                    'Genset 300KVA Silent'
                ]
            }
        ]
    },
    {
        category: 'Pekerjaan Lapangan',
        groups: [
            {
                name: 'Lansekap',
                tasks: [
                    'Land Clearing',
                    'Media Tanam',
                    'Penanaman Pohon',
                    'Penanaman Rumput',
                    'Rumput',
                    'Grow In',
                    'Taman'
                ]
            },
            {
                name: 'Fasilitas',
                tasks: [
                    'Paving Block',
                    'Grass Block',
                    'Saluran Drainase',
                    'Jaring Pengaman Lapangan',
                    'Marka Lapangan',
                    'Ring Basket',
                    'Net Voli'
                ]
            }
        ]
    },
    {
        category: 'Logistik & Material',
        groups: [
            {
                name: 'Pengiriman',
                tasks: [
                    'Pengiriman Bata',
                    'Pengiriman Batu',
                    'Pengiriman Besi',
                    'Pengiriman Beton',
                    'Pengiriman Keramik',
                    'Pengiriman Material',
                    'Pengiriman Pancang',
                    'Pengiriman Pasir',
                    'Pengiriman Semen',
                    'Pengiriman Tanah'
                ]
            }
        ]
    },
    {
        category: 'Furniture',
        groups: [
            {
                name: 'Meja & Kursi',
                tasks: [
                    'Meja Kelas',
                    'Meja Guru',
                    'Meja Rapat',
                    'Kursi Guru',
                    'Kursi Kelas',
                    'Kursi Rapat'
                ]
            },
            {
                name: 'Penyimpanan',
                tasks: [
                    'Lemari',
                    'Almari',
                    'Kitchen Set'
                ]
            },
            {
                name: 'Lainnya',
                tasks: [
                    'Bed UKS',
                    'Papan Tulis',
                    'Signage',
                    'Sofa'
                ]
            }
        ]
    },
    {
        category: 'Dokumentasi',
        groups: [
            {
                name: 'Laporan',
                tasks: [
                    'Progress Harian',
                    'Progress Mingguan',
                    'Progress Bulanan',
                    'As Built Drawing'
                ]
            },
            {
                name: 'Visual',
                tasks: [
                    'Drone View',
                    'Dokumentasi Material',
                    'Inspeksi Bersama'
                ]
            }
        ]
    }
];
