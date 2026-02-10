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
            'Safety_Induction',
            'Toolbox_Meeting',
            'Pemasangan_Safety_Net',
            'Pemasangan_Railing_Pengaman',
            'Audit_K3_Internal'
        ]
    },
    {
        category: 'Struktur',
        tasks: [
            'Struktur_Pekerjaan_Pemasangan_Bekisting',
            'Struktur_Pekerjaan_Pembesian',
            'Struktur_Pekerjaan_Pengecoran_Beton',
            'Struktur_Pekerjaan_Bongkar_Bekisting',
            'Struktur_Pekerjaan_Curing_Beton',
            'Struktur_Pekerjaan_Galian_Tanah',
            'Struktur_Pekerjaan_Urugan_Pasir',
            'Struktur_Pekerjaan_Lantai_Kerja'
        ]
    },
    {
        category: 'Arsitektur',
        tasks: [
            'Arsitektur_Pekerjaan_Pasangan_Bata',
            'Arsitektur_Pekerjaan_Plesteran_Acian',
            'Arsitektur_Pekerjaan_Pasang_Keramik_Lantai',
            'Arsitektur_Pekerjaan_Pasang_Keramik_Dinding',
            'Arsitektur_Pekerjaan_Pengecatan_Dinding',
            'Arsitektur_Pekerjaan_Pasang_Plafon',
            'Arsitektur_Pekerjaan_Pasang_Kusen_Pintu',
            'Arsitektur_Pekerjaan_Pasang_Sanitair'
        ]
    },
    {
        category: 'MEP',
        tasks: [
            'MEP_Pekerjaan_Instalasi_Pipa_Air',
            'MEP_Pekerjaan_Instalasi_Kabel_Listrik',
            'MEP_Pekerjaan_Pasang_Armature_Lampu',
            'MEP_Pekerjaan_Pasang_Panel_Listrik',
            'MEP_Pekerjaan_Instalasi_Fire_Alarm'
        ]
    },
    {
        category: 'Material',
        tasks: [
            'Material_On_Site_Besi_Beton',
            'Material_On_Site_Semen_Pasir',
            'Material_On_Site_Bata_Ringan',
            'Material_On_Site_Keramik',
            'Material_On_Site_Pipa_MEP'
        ]
    },
    {
        category: 'Lain-lain',
        tasks: [
            'Dokumentasi_Progress_Mingguan',
            'Dokumentasi_Kondisi_Lapang',
            'Dokumentasi_Drone_View',
            'Dokumentasi_Kunjungan_Direksi'
        ]
    }
];
