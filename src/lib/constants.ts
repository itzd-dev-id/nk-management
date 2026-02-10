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
            'K3_Induction',
            'K3_Toolbox_Meeting',
            'K3_Rambu_Safety',
            'K3_Safety_Net',
            'K3_Audit_Mingguan'
        ]
    },
    {
        category: 'Persiapan',
        tasks: [
            'Persiapan_Pembersihan_Lahan',
            'Persiapan_Pagar_Proyek',
            'Persiapan_Bouwplank',
            'Persiapan_Direksi_Keet',
            'Persiapan_Mobilisasi_Alat'
        ]
    },
    {
        category: 'Tanah',
        tasks: [
            'Tanah_Galian',
            'Tanah_Urugan_Pasir',
            'Tanah_Lantai_Kerja',
            'Tanah_Pemadatan'
        ]
    },
    {
        category: 'Struktur Bawah',
        tasks: [
            'Struktur_Bawah_Pancang',
            'Struktur_Bawah_Pile_Cap',
            'Struktur_Bawah_Tie_Beam',
            'Struktur_Bawah_Pedestal',
            'Struktur_Bawah_Pembesian',
            'Struktur_Bawah_Bekisting',
            'Struktur_Bawah_Pengecoran'
        ]
    },
    {
        category: 'Struktur Atas',
        tasks: [
            'Struktur_Atas_Bekisting',
            'Struktur_Atas_Pembesian',
            'Struktur_Atas_Pengecoran',
            'Struktur_Atas_Finish_Trowel',
            'Struktur_Atas_Bongkar_Bekisting'
        ]
    },
    {
        category: 'Arsitektur',
        tasks: [
            'Arsitektur_Pasangan_Bata',
            'Arsitektur_Plesteran',
            'Arsitektur_Acian',
            'Arsitektur_Keramik_Lantai',
            'Arsitektur_Keramik_Dinding',
            'Arsitektur_Pengecatan',
            'Arsitektur_Plafon',
            'Arsitektur_Kusen_Pintu_Jendela',
            'Arsitektur_Sanitary'
        ]
    },
    {
        category: 'Atap',
        tasks: [
            'Atap_Rangka_Baja',
            'Atap_Penutup_Genteng',
            'Atap_Penutup_Spandek',
            'Atap_Lisplang',
            'Atap_Talang'
        ]
    },
    {
        category: 'MEP',
        tasks: [
            'MEP_Instalasi_Listrik',
            'MEP_Instalasi_Air',
            'MEP_Instalasi_AC',
            'MEP_Fire_Alarm',
            'MEP_CCTV'
        ]
    },
    {
        category: 'Lansekap',
        tasks: [
            'Lansekap_Paving_Block',
            'Lansekap_Saluran',
            'Lansekap_Taman'
        ]
    },
    {
        category: 'Material On Site',
        tasks: [
            'Material_Pasir_Batu',
            'Material_Semen',
            'Material_Besi_Beton',
            'Material_Bata_Ringan',
            'Material_Beton_Ready_Mix'
        ]
    },
    {
        category: 'Dokumentasi',
        tasks: [
            'Dokumentasi_Progress_Mingguan',
            'Dokumentasi_Drone_View',
            'Dokumentasi_Joint_Inspection'
        ]
    }
];
