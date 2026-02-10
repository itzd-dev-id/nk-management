import { Building } from '@/types';

export const BUILDINGS: Building[] = [
    { code: 'GL', name: 'Global', index: 0 },
    { code: 'A', name: 'Rusun Guru', index: 1 },
    { code: 'B', name: 'Asrama Putra SD', index: 2 },
    { code: 'C', name: 'Asrama Putri SD', index: 3 },
    { code: 'D', name: 'Asrama Putri SMP', index: 4 },
    { code: 'E', name: 'Asrama Putra SMA', index: 5 },
    { code: 'F', name: 'Kantin', index: 6 },
    { code: 'G', name: 'Dapur Gudang', index: 7 },
    { code: 'H', name: 'Guest House', index: 8 },
    { code: 'I', name: 'Gedung SMA', index: 9 },
    { code: 'J', name: 'Gedung SMP', index: 10 },
    { code: 'K', name: 'Gedung SD', index: 11 },
    { code: 'L', name: 'Masjid', index: 12 },
    { code: 'M', name: 'Gedung Serbaguna', index: 13 },
    { code: 'N', name: 'Lapangan Upacara', index: 14 },
    { code: 'O', name: 'Pos Keamanan', index: 15 },
    { code: 'P', name: 'Rumah Pompa', index: 16 },
    { code: 'Q', name: 'Power House', index: 17 },
    { code: 'R', name: 'TPS', index: 18 },
    { code: 'S', name: 'Gedung Ibadah', index: 19 },
    { code: 'T', name: 'Lapangan Basket/Bola', index: 20 },
    { code: 'T01', name: 'Direksi Keet', index: 21 },
];

export const WORK_HIERARCHY = [
    {
        category: 'K3 dan Keselamatan',
        tasks: [
            'Induction',
            'Toolbox_Meeting',
            'Rambu_Safety',
            'Safety_Net',
            'Audit_Mingguan'
        ]
    },
    {
        category: 'Persiapan',
        tasks: [
            'Pembersihan_Lahan',
            'Pagar_Proyek',
            'Bouwplank',
            'Direksi_Keet',
            'Mobilisasi_Alat'
        ]
    },
    {
        category: 'Tanah',
        tasks: [
            'Galian',
            'Urugan_Pasir',
            'Lantai_Kerja',
            'Pemadatan'
        ]
    },
    {
        category: 'Struktur Bawah',
        tasks: [
            'Pancang',
            'Pile_Cap',
            'Tie_Beam',
            'Pedestal',
            'Pembesian',
            'Bekisting',
            'Pengecoran'
        ]
    },
    {
        category: 'Struktur Atas',
        tasks: [
            'Bekisting',
            'Pembesian',
            'Pengecoran',
            'Finish_Trowel'
        ]
    },
    {
        category: 'Arsitektur',
        tasks: [
            'Pasangan_Bata',
            'Plesteran',
            'Acian',
            'Keramik_Lantai',
            'Keramik_Dinding',
            'Pengecatan',
            'Plafon',
            'Kusen_Pintu_Jendela',
            'Sanitary'
        ]
    },
    {
        category: 'Atap',
        tasks: [
            'Rangka_Baja',
            'Penutup_Genteng',
            'Penutup_Spandek',
            'Lisplang',
            'Talang'
        ]
    },
    {
        category: 'MEP',
        tasks: [
            'Instalasi_Listrik',
            'Instalasi_Air',
            'Instalasi_AC',
            'Fire_Alarm',
            'CCTV'
        ]
    },
    {
        category: 'Lansekap',
        tasks: [
            'Paving_Block',
            'Saluran',
            'Taman'
        ]
    },
    {
        category: 'Material On Site',
        tasks: [
            'Pengiriman_Tanah',
            'Pengiriman_Tiang_pancang',
            'Pengiriman_Material_direksi_keet',
            'Pengiriman_besi',
            'Pengiriman_pasir',
            'Pengiriman_semen',
            'Pengiriman_batu',
            'Pengiriman_beton'
        ]
    },
    {
        category: 'Dokumentasi',
        tasks: [
            'Progress_Mingguan',
            'Drone_View',
            'Joint_Inspection'
        ]
    }
];
