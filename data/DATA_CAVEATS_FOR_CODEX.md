# Dashboard 1 — Data contract and caveats for Codex

## Source-of-truth hierarchy
1. `tableau_ready/` contains cleaned dashboard-ready CSVs and derived values.
2. `source_raw_bps/` contains selected raw BPS table exports for audit.
3. `Dashboard1_DataSlayer_Tableau.xlsx` is a convenience workbook; the CSVs remain the clearest source for code.
4. The supplied mockup is a visual/layout reference only. Never copy numeric labels from the image when they conflict with the CSV data.

## Important facts
- National SMK TPT, August 2025: 8.63%.
- National SMA Umum TPT, August 2025: 6.88%.
- SMK–SMA Umum TPT gap: 1.75 percentage points.
- SMK unemployed, August 2025: 1,923,756 people.
- Total unemployed, August 2025: 7,461,507 people.
- SMK share of all unemployed: 25.7824% (display 25.78%).
- Average monthly net wage of SMK wage/salary employees: Rp3,256,604.
- SMA Umum equivalent: Rp3,149,687.
- SMK wage premium vs SMA Umum: 3.3945% (display 3.39%).
- SMK TPT change from 2024 to 2025: -0.38 percentage points.
- SMK TPT in 2020 is 13.55%; the trend chart y-axis must include this peak.

## Chart data rules
- Trend: `D1_02_TPT_Pendidikan_2019_2025.csv`; national TPT by completed education, 2019–2025. Default SMK.
- Unemployment composition: `D1_03_Pengangguran_Pendidikan_2025_6Kelompok.csv`; use `Pangsa_Penganggur_Agustus_pct`.
  Actual descending shares: SMA Umum 30.74%; SMK 25.78%; SD ke bawah 16.10%; SMP 13.29%; Universitas 12.12%; Diploma I/II/III 1.96%.
- Wage chart: use `D1_12_Wage_6_Jenjang_Display.csv`. This chart intentionally uses the exact “Sekolah Dasar” row as `SD`; do not aggregate the three SD-related rows by taking a simple average. Wage data applies only to wage/salary employees.
  Values: Universitas Rp4,804,860; Diploma I/II/III Rp4,500,603; SMK Rp3,256,604; SMA Umum Rp3,149,687; SMP Rp2,482,817; SD Rp2,242,860.
- Map: `D1_06_Peta_TPT_Total_38Provinsi_2025.csv`; 38 provinces; metric is total TPT across all education levels, August 2025. It is NOT SMK-specific.
- Scatter: `D1_11_Scatter_TPT_TPAK_2025.csv`; 38 provinces plus Indonesia national benchmark. X = TPT total (all education levels, %); Y = TPAK (all education levels, %). National benchmark: TPT 4.85%, TPAK 70.59%. This is intentionally used instead of the screenshot's SMK-TPT / SMK-wage axis labels because no provincial SMK TPT series is available.
- Province context file `D1_05_Konteks_PasarKerja_38Provinsi_2025.csv` contains a blank `TPT_SMK_Agustus_2025_pct` field for all 38 provinces. Do not impute, replace, or derive it from total TPT.
- `D1_07_Template_TPT_SMK_38Provinsi.csv` is an intentionally blank template for future research, not display data.

## Period and population caveats
- TPT and TPAK: Sakernas, August 2025.
- Formal employment and underemployment: annual 2025 indicators.
- Average years of schooling (RLS): Susenas annual 2025, age 15+.
- Wage by education: average monthly net wage/salary of buruh/karyawan/pegawai only; not all workers, not all graduates, and not household income.
- Do not combine periods without clearly labelling each metric in its tooltip or methodology panel.
- 2021–2023 data for Papua and Papua Barat refer to pre-expansion territorial definitions; post-2024 data refer to the expanded province definitions. Do not imply a fully comparable province-level time series across the Papua expansion without a caveat.
- `ID_Prov_Internal` is a row index only, not an official BPS or Kemendagri province code.
- The screenshot mockup contains stale/placeholder composition and wage values. Always render the actual values from the CSVs listed above.

## Recommended interpretation
The national TPT for SMK is higher than other education categories in 2025, while the average wage among employed SMK wage/salary employees is slightly above SMA Umum. This indicates an employment-absorption challenge; it does not prove that SMK education causes unemployment or that every employed SMK graduate earns more.
