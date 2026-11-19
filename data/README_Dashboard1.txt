DASHBOARD 1 — DATA SLAYER 4.0
Topik: Lulusan SMK dan keterserapan kerja antarprovinsi
Platform target: Tableau
Tahun acuan: 2025

ISI PAKET
- Dashboard1_DataSlayer_Tableau.xlsx : workbook dengan sheet siap dibaca.
- tableau_ready/ : seluruh CSV bersih yang dapat langsung dihubungkan ke Tableau.
- source_raw_bps/ : salinan CSV sumber BPS terpilih untuk audit dan penelusuran.

ANGKA UTAMA YANG SUDAH ADA DI DATA
- TPT SMK nasional Agustus 2025: 8,63%.
- TPT SMA umum Agustus 2025: 6,88%.
- Gap TPT SMK vs SMA umum: 1,75 poin persentase.
- Penganggur SMK Agustus 2025: 1.923.756 orang.
- Pangsa penganggur SMK dari total penganggur: 25,78%.
- Upah rata-rata buruh/karyawan/pegawai SMK Agustus 2025: Rp3.256.604/bulan.
- Upah SMA umum: Rp3.149.687/bulan; selisih sekitar Rp106.917 (3,39%).

BATASAN PENTING
1. Paket sumber yang dikirim BELUM memiliki TPT SMK per provinsi.
2. Peta yang dapat dibuat dari data saat ini adalah TPT total semua pendidikan per provinsi, bukan TPT SMK.
3. Jangan mengganti nilai TPT_SMK kosong dengan TPT total. File D1_07_Template_TPT_SMK_38Provinsi.csv sengaja dikosongkan untuk pengumpulan data tambahan dari portal/publikasi BPS provinsi.
4. Upah pendidikan pada T11 hanya untuk buruh/karyawan/pegawai; jangan menyebutnya rata-rata pendapatan seluruh lulusan.
5. ID_Prov_Internal hanyalah nomor urut internal, bukan kode wilayah resmi BPS.
6. Beberapa data provinsi berasal dari periode berbeda: TPT/TPAK/pekerja/upah = Sakernas Agustus 2025; formal/TSP = tahunan 2025; RLS = Susenas tahunan 2025. Tampilkan periode dan sumber pada caption/tooltip.
7. Baris nasional dikeluarkan dari dataset provinsi (38 baris).

SARAN LAYOUT
- Sidebar: Province selector + Key Insights.
- KPI cards: TPT SMK; gap vs SMA; jumlah penganggur SMK; share penganggur SMK.
- Main row: line chart TPT pendidikan 2019–2025 + choropleth TPT total provinsi Agustus 2025.
- Bottom row: penganggur menurut 6 kelompok pendidikan; upah buruh menurut pendidikan; scatter TPT total vs TPAK provinsi (Agustus 2025).
- Gunakan white/blue corporate styling; navy untuk struktur, blue untuk pembanding, orange khusus SMK.
- Jika memakai filter tahun, terapkan pada line chart saja. KPI dan visual komposisi/upah tetap pada 2025. Map default 2025.
