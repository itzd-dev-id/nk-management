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
        category: "Persiapan",
        groups: [
            {
                name: "Umum",
                tasks: [
                    "Barak Tenaga dan Barang",
                    "Bouwplank",
                    "Mobilisasi Alat",
                    "Pagar Sementara",
                    "Pagar Proyek",
                    "Papan Nama Proyek",
                    "Pematangan Lahan",
                    "Pembersihan Lahan",
                    "Direksi Keet",
                    "Mushola Pekerja",
                    "Kantin Pekerja",
                    "Gudang Sementara",
                    "Toilet Pekerja",
                    "Gudang Material"
                ]
            }
        ]
    },
    {
        category: "SMKK",
        groups: [
            {
                name: "Keselamatan",
                tasks: [
                    "Induction",
                    "Jaring Pengaman",
                    "Rambu Safety",
                    "Safety Sign",
                    "Toolbox Meeting",
                    "Safety Net",
                    "Scaffolding",
                    "Perancah",
                    "Barricade",
                    "Pagar Pengaman",
                    "Helmet Area",
                    "Audit Mingguan",
                    "Audit K3"
                ]
            }
        ]
    },
    {
        category: "Struktur",
        groups: [
            {
                name: "Tanah",
                tasks: [
                    "Galian",
                    "Galian Tanah",
                    "Galian Biasa",
                    "Pemadatan Tanah",
                    "Mengangkut Tanah",
                    "Urugan Tanah",
                    "Urugan Pasir",
                    "Urugan Split",
                    "Urugan Tanah Biasa",
                    "Lantai Kerja",
                    "Pengecoran Lantai Kerja",
                    "Buis Beton 30cm"
                ]
            },
            {
                name: "Footplat",
                tasks: [
                    "Galian",
                    "Lantai Kerja",
                    "Bekisting",
                    "Pembesian",
                    "Pengecoran",
                    "Pengecoran Pondasi",
                    "Pengecoran Pile Cap",
                    "Pengecoran Bored Pile",
                    "Pengecoran Pile Head",
                    "Pile Cap",
                    "Bored Pile",
                    "Pancang",
                    "Pengadaan Tiang Pancang",
                    "Penetrasi Tiang Pancang",
                    "Sambungan Pancang",
                    "Pemotongan Kepala Pancang",
                    "Besi Tulangan Ulir"
                ]
            },
            {
                name: "Tie Beam",
                tasks: [
                    "Galian",
                    "Lantai Kerja",
                    "Bekisting",
                    "Pembesian",
                    "Pengecoran",
                    "Pengecoran Tie Beam",
                    "Pengecoran Sloof"
                ]
            },
            {
                name: "Kolom",
                tasks: [
                    "Galian",
                    "Bekisting",
                    "Bekisting Kolom",
                    "Pembesian",
                    "Pembesian Kolom",
                    "Pengecoran",
                    "Pengecoran Kolom",
                    "Pengecoran Pedestal",
                    "Pengecoran Kolom Praktis",
                    "Pedestal",
                    "Kolom Praktis"
                ]
            },
            {
                name: "Balok",
                tasks: [
                    "Bekisting",
                    "Bekisting Balok",
                    "Pembesian",
                    "Pembesian Balok",
                    "Pengecoran",
                    "Pengecoran Balok",
                    "Pengecoran Balok Praktis",
                    "Balok Praktis"
                ]
            },
            {
                name: "Pelat",
                tasks: [
                    "Bekisting",
                    "Bekisting Plat",
                    "Pembesian",
                    "Pembesian Plat",
                    "Pengecoran",
                    "Pengecoran Plat",
                    "Pengecoran Pelat",
                    "Pengecoran Plat Lantai",
                    "Wiremesh",
                    "Plat Lantai",
                    "Plat t=120"
                ]
            },
            {
                name: "Ring Balok",
                tasks: [
                    "Bekisting",
                    "Pembesian",
                    "Pengecoran",
                    "Pengecoran Ring Balok"
                ]
            },
            {
                name: "Lainnya",
                tasks: [
                    "Tangga",
                    "Ramp",
                    "Finish Trowel",
                    "Lean_Concrete",
                    "Buis Beton",
                    "Penyemprotan Anti Rayap",
                    "Bekisting Tangga",
                    "Pembesian Tangga",
                    "Pengecoran Tangga",
                    "Pengecoran Ramp",
                    "Pengecoran Lift Shaft",
                    "Lift Shaft"
                ]
            },
            {
                name: "Pabrikasi",
                tasks: [
                    "Pabrikasi Bekisting",
                    "Pabrikasi Besi"
                ]
            }
        ]
    },
    {
        category: "Arsitektur",
        groups: [
            {
                name: "Dinding",
                tasks: [
                    "Pasangan Bata",
                    "Bata Ringan",
                    "Pasangan Batako",
                    "Plesteran",
                    "Plesteran Mortar Siap Pakai",
                    "Plesteran Dalam",
                    "Plesteran Luar",
                    "Acian",
                    "Dinding Rooster",
                    "Finishing Beton Expose"
                ]
            },
            {
                name: "Lantai",
                tasks: [
                    "Keramik Lantai",
                    "Keramik Dinding",
                    "Granit Lantai",
                    "Homogeneous Tile Polish",
                    "Homogeneous Tile Unpolished",
                    "Guiding Block",
                    "Cat Epoxy"
                ]
            },
            {
                name: "Plafon",
                tasks: [
                    "Plafon Gypsum",
                    "Plafon Kalsiboard",
                    "Plafond UPVC",
                    "Rangka Metalfuring",
                    "List Plafond"
                ]
            },
            {
                name: "Pintu & Jendela",
                tasks: [
                    "Kusen",
                    "Kusen Pintu",
                    "Kusen Jendela",
                    "Daun Pintu",
                    "Daun Jendela",
                    "Kaca Jendela",
                    "Kaca Pintu"
                ]
            },
            {
                name: "Atap",
                tasks: [
                    "Rangka Atap",
                    "Rangka Baja",
                    "Rangka Kayu",
                    "Penutup Atap",
                    "Penutup Genteng",
                    "Penutup Spandek",
                    "Nok Atap",
                    "Lisplang",
                    "Talang"
                ]
            },
            {
                name: "Sanitasi",
                tasks: [
                    "Sanitary",
                    "Closet",
                    "Wastafel",
                    "Shower",
                    "Floor Drain"
                ]
            },
            {
                name: "Finishing Lainnya",
                tasks: [
                    "Cat Eksterior",
                    "Cat Interior",
                    "Kanopi",
                    "Railing Tangga",
                    "Handrail Tangga",
                    "Railing Balkon",
                    "Bordes Tangga"
                ]
            }
        ]
    },
    {
        category: "MEP",
        groups: [
            {
                name: "Listrik",
                tasks: [
                    "Instalasi Listrik",
                    "Instalasi Kabel",
                    "Panel Listrik",
                    "Panel Tegangan Menengah",
                    "Cubicle 20KV",
                    "Load Break Switch",
                    "Circuit Breaker",
                    "Trafo Oil Ester",
                    "Titik Lampu",
                    "Stop Kontak",
                    "Grounding"
                ]
            },
            {
                name: "Air & Plumbing",
                tasks: [
                    "Instalasi Pipa Air",
                    "Instalasi Pipa Limbah",
                    "Instalasi Hydrant",
                    "Pompa Air",
                    "Pompa Alkon",
                    "Tangki Air",
                    "Tandon Air"
                ]
            },
            {
                name: "HVAC",
                tasks: [
                    "Instalasi AC",
                    "Split AC",
                    "VRV AC"
                ]
            },
            {
                name: "Penyelamatan",
                tasks: [
                    "Instalasi Fire Alarm",
                    "Smoke Detector",
                    "CCTV"
                ]
            },
            {
                name: "Genset",
                tasks: [
                    "Genset",
                    "Genset 300KVA Silent",
                    "Panel Genset AMF",
                    "Battery Charger",
                    "Tanki Genset",
                    "Knalpot Silencer",
                    "Flow Meter"
                ]
            }
        ]
    },
    {
        category: "Pekerjaan Lapangan",
        groups: [
            {
                name: "Lansekap",
                tasks: [
                    "Land Clearing",
                    "Weed Killer",
                    "Leveling Subgrade",
                    "Geotextil",
                    "Media Tanam",
                    "Pratanam",
                    "Penanaman Pohon",
                    "Penanaman Rumput",
                    "Rumput",
                    "Grow In",
                    "Pasca Grow In",
                    "Taman"
                ]
            },
            {
                name: "Fasilitas Luar",
                tasks: [
                    "Paving Block",
                    "Paving Jalan",
                    "Paving Trotoar",
                    "Grass Block",
                    "Saluran",
                    "Saluran Drainase",
                    "Jaring Pengaman Lapangan",
                    "Marka Lapangan",
                    "Ring Basket",
                    "Net Voli"
                ]
            }
        ]
    },
    {
        category: "Logistik & Material",
        groups: [
            {
                name: "Pengiriman",
                tasks: [
                    "Pengiriman Material",
                    "Pengiriman Tanah",
                    "Pengiriman Tiang Pancang",
                    "Pengiriman Besi",
                    "Pengiriman Pasir",
                    "Pengiriman Semen",
                    "Pengiriman Batu",
                    "Pengiriman Beton",
                    "Pengiriman Bata",
                    "Pengiriman Keramik",
                    "Pengiriman Pancang"
                ]
            }
        ]
    },
    {
        category: "Furniture",
        groups: [
            {
                name: "Meja & Kursi",
                tasks: [
                    "Meja Kelas",
                    "Meja Guru",
                    "Meja Rapat",
                    "Meja Sofa",
                    "Meja Lab",
                    "Kursi Kelas",
                    "Kursi Guru",
                    "Kursi Rapat",
                    "Kursi Nakes",
                    "Kursi Pasien",
                    "Kursi Lab"
                ]
            },
            {
                "name": "Penyimpanan",
                "tasks": [
                    "Lemari",
                    "Almari",
                    "Nakas",
                    "Kitchen Set"
                ]
            },
            {
                "name": "Lainnya",
                "tasks": [
                    "Bed UKS",
                    "Papan Tulis",
                    "Sofa",
                    "Marking Parkir",
                    "Signage",
                    "Papan Nama",
                    "Cleaning",
                    "Pembersihan Akhir"
                ]
            }
        ]
    },
    {
        category: "Dokumentasi",
        groups: [
            {
                name: "Laporan",
                tasks: [
                    "Progress Harian",
                    "Progress Mingguan",
                    "Progress Bulanan",
                    "As Built Drawing"
                ]
            },
            {
                name: "Visual",
                tasks: [
                    "Drone View",
                    "Foto Udara",
                    "Joint Inspection",
                    "Inspeksi Bersama",
                    "Dokumentasi Material"
                ]
            }
        ]
    }
];
