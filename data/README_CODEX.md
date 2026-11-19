# Dashboard 1 dataset — Codex package

This folder is the complete data handoff for the Dashboard 1 National Overview build.

## Contents
- `tableau_ready/`: cleaned chart-ready CSVs, including two derived tables added for the web dashboard.
- `source_raw_bps/`: selected raw BPS source exports for audit.
- `Dashboard1_DataSlayer_Tableau.xlsx`: convenience workbook.
- `README_Dashboard1.txt`: original project notes.
- `diagnostik_sumber_asli.txt`: original data quality and source diagnostics.
- `DATA_CAVEATS_FOR_CODEX.md`: mandatory data contract.
- `MAP_BOUNDARY_SOURCE.md`: 38-province geometry source and join requirements.

## Two additional chart-ready tables
- `D1_11_Scatter_TPT_TPAK_2025.csv`: 38 province points + national benchmark. X = total TPT, Y = TPAK. Both all-education indicators.
- `D1_12_Wage_6_Jenjang_Display.csv`: exactly six education categories for the wage bar chart; SD uses the exact BPS “Sekolah Dasar” row, not a fabricated aggregate.

## Important
The mockup is a layout/style reference, not the source of truth for chart numbers. Read `DATA_CAVEATS_FOR_CODEX.md` before implementing.
