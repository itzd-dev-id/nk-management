export interface Building {
    code: string;
    name: string;
}

export const BUILDINGS: Building[] = [
    { code: 'GL', name: 'Global' },
    { code: 'A', name: 'Rusun Guru' },
    { code: 'A.1', name: 'Rusun Guru' },
    { code: 'B', name: 'Asrama Putra SD' },
    { code: 'B.1', name: 'Asrama Putra SD' },
    { code: 'C', name: 'Asrama Putri SD' },
    { code: 'C.1', name: 'Asrama Putri SD' },
    { code: 'D', name: 'Asrama Putri SMP' },
    { code: 'D.1', name: 'Asrama Putra SMP' },
    { code: 'E', name: 'Asrama Putra SMA' },
    { code: 'E.1', name: 'Asrama Putri SMA' },
    { code: 'F', name: 'Kantin SD' },
    { code: 'F.1', name: 'Kantin SMP' },
    { code: 'F.2', name: 'Kantin SMA' },
    { code: 'G', name: 'Dapur Gudang' },
    { code: 'H', name: 'Guest House' },
    { code: 'I', name: 'Gedung SMA' },
    { code: 'J', name: 'Gedung SMP' },
    { code: 'K', name: 'Gedung SD' },
    { code: 'L', name: 'Masjid' },
    { code: 'M', name: 'Gedung Serbaguna' },
    { code: 'N', name: 'Lapangan Upacara' },
    { code: 'O', name: 'Pos Keamanan' },
    { code: 'P', name: 'Rumah Pompa' },
    { code: 'Q', name: 'Power House' },
    { code: 'R', name: 'TPS' },
    { code: 'S', name: 'Gedung Ibadah' },
    { code: 'T', name: 'Lapangan Basket' },
    { code: 'U', name: 'Lapangan Sepak Bola' },
    { code: 'V', name: 'Gudang Perawatan' },
    { code: 'T01', name: 'Direksi Keet' },
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
            'Pasir_Batu',
            'Semen',
            'Besi_Beton',
            'Bata_Ringan',
            'Beton_Ready_Mix'
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
