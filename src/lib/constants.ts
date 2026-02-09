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
];

export const WORK_HIERARCHY = [
    {
        category: 'K3 dan Keselamatan',
        tasks: ['Safety Induction', 'Toolbox Meeting', 'Toolbox Talks', 'Audit K3', 'Pemasangan Safety Sign']
    },
    {
        category: 'Pekerjaan Persiapan',
        tasks: ['Pembersihan Lahan', 'Pemasangan Bowplank', 'Direksi Keet', 'Barak Pekerja', 'Gudang Material']
    },
    {
        category: 'Pekerjaan Tanah',
        tasks: ['Galian Tanah', 'Urugan Tanah', 'Urugan Pasir', 'Lantai Kerja', 'Pemadatan Tanah']
    },
    {
        category: 'Pekerjaan Struktur Bawah',
        tasks: ['Tiang Pancang', 'Bored Pile', 'Pile Cap', 'Tie Beam', 'Galian Fondasi']
    },
    {
        category: 'Pekerjaan Struktur Atas',
        tasks: ['Kolom', 'Balok', 'Plat Lantai', 'Tangga', 'Ring Balok']
    },
    {
        category: 'Pekerjaan Arsitektur',
        tasks: ['Pasangan Dinding', 'Plesteran & Acian', 'Kusen Pintu & Jendela', 'Plavon', 'Lantai & Keramik', 'Pengecatan']
    },
    {
        category: 'Pekerjaan MEP',
        tasks: ['Instalasi Listrik', 'Instalasi Air Bersih', 'Instalasi Air Kotor', 'Fire Alarm', 'CCTV']
    },
    {
        category: 'Material On Site',
        tasks: [
            'Pengiriman Tanah',
            'Pengiriman Tiang Pancang',
            'Pengiriman Material Direksi Keet',
            'Pengiriman Besi',
            'Pengiriman Pasir',
            'Pengiriman Semen',
            'Pengiriman Batu',
            'Pengiriman Beton',
            'Pengiriman Toren',
            'Pengiriman Pipa'
        ]
    },
    {
        category: 'Dokumentasi & Monitoring',
        tasks: ['Kondisi Lapangan', 'Drone View', 'Evaluasi Proyek', 'Laporan Mingguan']
    }
];
