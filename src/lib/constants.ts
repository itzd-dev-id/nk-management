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
            'K3_Safety_Induction',
            'K3_Toolbox_Meeting',
            'K3_Safety_Morning',
            'K3_Audit_Internal',
            'K3_Pemasangan_Safety_Sign',
            'K3_Pemasangan_Safety_Net',
            'K3_Pemasangan_Railing_Pengaman',
            'K3_Inspeksi_Alat_Berat'
        ]
    },
    {
        category: 'Persiapan',
        tasks: [
            'Persiapan_Pembersihan_Lahan',
            'Persiapan_Pagar_Proyek_Sementara',
            'Persiapan_Pemasangan_Bouwplank',
            'Persiapan_Direksi_Keet',
            'Persiapan_Gudang_Material',
            'Persiapan_Barak_Kerja',
            'Persiapan_Mobilisasi_Alat_Berat',
            'Persiapan_Penyediaan_Air_Kerja',
            'Persiapan_Penyediaan_Listrik_Kerja'
        ]
    },
    {
        category: 'Tanah',
        tasks: [
            'Tanah_Galian_Struktur',
            'Tanah_Urugan_Kembali',
            'Tanah_Urugan_Pasir_Bawah_Pondasi',
            'Tanah_Pemadatan_Tanah',
            'Tanah_Lantai_Kerja_Beton_Mutu_Rendah',
            'Tanah_Galian_Septic_Tank',
            'Tanah_Galian_Saluran_Drainase'
        ]
    },
    {
        category: 'Struktur Bawah',
        tasks: [
            'Struktur_Bawah_Tiang_Pancang_Pengadaan',
            'Struktur_Bawah_Tiang_Pancang_Pemancangan',
            'Struktur_Bawah_Tiang_Pancang_Pemotongan_Kepala',
            'Struktur_Bawah_Bore_Pile_Pengeboran',
            'Struktur_Bawah_Bore_Pile_Pembesian',
            'Struktur_Bawah_Bore_Pile_Pengecoran',
            'Struktur_Bawah_Pile_Cap_Bekisting',
            'Struktur_Bawah_Pile_Cap_Pembesian',
            'Struktur_Bawah_Pile_Cap_Pengecoran',
            'Struktur_Bawah_Tie_Beam_Bekisting',
            'Struktur_Bawah_Tie_Beam_Pembesian',
            'Struktur_Bawah_Tie_Beam_Pengecoran',
            'Struktur_Bawah_Kolom_Pedestal_Bekisting',
            'Struktur_Bawah_Kolom_Pedestal_Pembesian',
            'Struktur_Bawah_Kolom_Pedestal_Pengecoran'
        ]
    },
    {
        category: 'Struktur Atas',
        tasks: [
            'Struktur_Atas_Kolom_Utama_Bekisting',
            'Struktur_Atas_Kolom_Utama_Pembesian',
            'Struktur_Atas_Kolom_Utama_Pengecoran',
            'Struktur_Atas_Kolom_Praktis_Bekisting',
            'Struktur_Atas_Kolom_Praktis_Pembesian',
            'Struktur_Atas_Kolom_Praktis_Pengecoran',
            'Struktur_Atas_Balok_Utama_Bekisting',
            'Struktur_Atas_Balok_Utama_Pembesian',
            'Struktur_Atas_Balok_Utama_Pengecoran',
            'Struktur_Atas_Balok_Anak_Bekisting',
            'Struktur_Atas_Balok_Anak_Pembesian',
            'Struktur_Atas_Balok_Anak_Pengecoran',
            'Struktur_Atas_Plat_Lantai_Bekisting',
            'Struktur_Atas_Plat_Lantai_Pembesian',
            'Struktur_Atas_Plat_Lantai_Pengecoran',
            'Struktur_Atas_Ring_Balok_Bekisting',
            'Struktur_Atas_Ring_Balok_Pembesian',
            'Struktur_Atas_Ring_Balok_Pengecoran',
            'Struktur_Atas_Tangga_Bekisting',
            'Struktur_Atas_Tangga_Pembesian',
            'Struktur_Atas_Tangga_Pengecoran',
            'Struktur_Atas_Bongkar_Bekisting_Kolom',
            'Struktur_Atas_Bongkar_Bekisting_Balok',
            'Struktur_Atas_Bongkar_Bekisting_Plat',
            'Struktur_Atas_Curing_Beton'
        ]
    },
    {
        category: 'Arsitektur',
        tasks: [
            'Arsitektur_Dinding_Pasangan_Bata_Merah',
            'Arsitektur_Dinding_Pasangan_Bata_Ringan',
            'Arsitektur_Dinding_Plesteran',
            'Arsitektur_Dinding_Acian',
            'Arsitektur_Dinding_Pengecatan_Interior',
            'Arsitektur_Dinding_Pengecatan_Eksterior',
            'Arsitektur_Lantai_Pasang_Granit',
            'Arsitektur_Lantai_Pasang_Keramik',
            'Arsitektur_Lantai_Pasang_Plint',
            'Arsitektur_Kusen_Pintu_Jendela_Aluminium',
            'Arsitektur_Kusen_Pintu_Jendela_Kayu',
            'Arsitektur_Daun_Pintu_Jendela_Pasang',
            'Arsitektur_Plafon_Rangka_Hollow',
            'Arsitektur_Plafon_Pasang_Gypsum',
            'Arsitektur_Plafon_Pasang_PVC',
            'Arsitektur_Plafon_Pengecatan',
            'Arsitektur_Sanitary_Pasang_Kloset',
            'Arsitektur_Sanitary_Pasang_Wastafel',
            'Arsitektur_Sanitary_Pasang_Shower'
        ]
    },
    {
        category: 'MEP',
        tasks: [
            'MEP_Listrik_Instalasi_Kabel_Daya',
            'MEP_Listrik_Instalasi_Titik_Lampu',
            'MEP_Listrik_Pasang_Armatur_Lampu',
            'MEP_Listrik_Pasang_Saklar_Stop_Kontak',
            'MEP_Listrik_Pasang_Panel_SDP',
            'MEP_Plumbing_Instalasi_Pipa_Air_Bersih',
            'MEP_Plumbing_Instalasi_Pipa_Air_Kotor',
            'MEP_Plumbing_Instalasi_Pipa_Air_Hujan',
            'MEP_Plumbing_Pasang_Pompa_Air',
            'MEP_Plumbing_Pasang_Tandon_Air',
            'MEP_HVAC_Instalasi_Indoor_AC',
            'MEP_HVAC_Instalasi_Outdoor_AC',
            'MEP_Fire_Instalasi_Fire_Alarm',
            'MEP_Fire_Instalasi_Sprinkler_Hydrant',
            'MEP_Elektronik_Instalasi_CCTV',
            'MEP_Elektronik_Instalasi_Data_Wifi'
        ]
    },
    {
        category: 'Material On Site',
        tasks: [
            'Material_On_Site_Pasir_Urug',
            'Material_On_Site_Pasir_Pasang',
            'Material_On_Site_Semen_PC',
            'Material_On_Site_Batu_Kali',
            'Material_On_Site_Batu_Pecah_Split',
            'Material_On_Site_Besi_Beton_Polos',
            'Material_On_Site_Besi_Beton_Ulir',
            'Material_On_Site_Bata_Merah',
            'Material_On_Site_Bata_Ringan',
            'Material_On_Site_Keramik_Lantai',
            'Material_On_Site_Beton_Ready_Mix',
            'Material_On_Site_Pipa_PVC',
            'Material_On_Site_Kayu_Bekisting'
        ]
    },
    {
        category: 'Dokumentasi & Monitoring',
        tasks: [
            'Dokumentasi_Kondisi_Lahan_Existing',
            'Dokumentasi_Progress_0_Persen',
            'Dokumentasi_Progress_Mingguan',
            'Dokumentasi_Progress_Bulanan',
            'Dokumentasi_Drone_View_Aerial',
            'Dokumentasi_Joint_Inspection',
            'Dokumentasi_Kunjungan_Direksi',
            'Dokumentasi_Tes_Laboratorium'
        ]
    }
];
