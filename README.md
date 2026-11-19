# Vocation Paradox · Page 1

An interactive dashboard of national education and employment indicators and provincial labour market context. It uses the supplied BPS CSVs and a local boundary layer.

## Run locally

Install Node.js 22.13 or later and run:

```sh
npm ci
npm run dev
```

`npm test` checks national figures, chart data, province matching and boundary validity. `npm run build` runs TypeScript checks and writes the static build to `dist/`. `npm run preview` serves that production build locally.

For GitHub upload instructions in Indonesian, see [PANDUAN_PUSH_GITHUB.md](PANDUAN_PUSH_GITHUB.md).

## Project files

| Location | Role |
| --- | --- |
| `src/App.tsx`, `src/main.tsx`, `index.html` | App entry and shared dashboard filters |
| `src/components/{Overview,Common,TrendChart,BarCharts,ProvinceCharts}.tsx` | Header, sidebar, KPIs, charts, methodology and tooltips |
| `src/{dashboard-data,data-model}.ts` | Local CSV parsing, formatting and province-name joins |
| `src/styles.css`, `public/education-{mark,work}.svg` | Layout, typography and hero artwork |
| `data/tableau_ready/`, `data/source_raw_bps/` | Dashboard CSVs, audit CSVs and verified historical BPS supplements |
| `public/data/geo/`, `public/data/indonesia-provinces.geojson` | 38 source files with their MIT license and the merged boundary asset |
| `scripts/merge-boundaries.mjs`, `scripts/data.test.mjs` | Reproducible merge and automated validation |
| `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore` | Dependencies and build settings |

Boundary geometry comes from the [Indonesia-Geojson-2026 province folder](https://github.com/mashadinoor/Indonesia-Geojson-2026/tree/main/Provinsi), which attributes its geometry to BIG. Each downloaded JSON file was checked against its GitHub blob SHA. Regenerate the merged file with `node scripts/merge-boundaries.mjs`. The dashboard joins by normalized province name with explicit aliases. The original BPS indicators and their coverage are described in [the data notes](data/DATA_CAVEATS_FOR_CODEX.md).

## Dashboard behaviour

The Year filter selects August 2024 or August 2025 for the KPIs, map, bars and scatter plot. The wage and unemployed SMK badges compare the selected August with the previous August. The trend uses a fixed 2021–2025 axis and marks the selected year. Selecting a province from the slicer, map or scatter plot switches the trend to that province and highlights the corresponding point. The gray diamond in the scatter plot is Indonesia's national benchmark.

`D1_13_National_Historical.csv` uses table 14 of *Keadaan Angkatan Kerja di Indonesia Agustus 2025*, the BPS August 2024 wage table (Total column) and Appendix 24 of *Indikator Pekerjaan Layak di Indonesia 2024*. `D1_14_Provincial_Education_Trend.csv` uses tables 46 and 151 (August 2024) and tables 44 and 123 (August 2025) in *Keadaan Angkatan Kerja di Indonesia*. Provincial TPT is calculated as unemployed divided by labour force in the same province, year and education group. Provincial data are displayed for the 2024–2025 comparison, which covers 38 provinces. BPS-suppressed observations are shown as gaps and available estimates with an RSE warning carry a tooltip note. The 2025 source groups higher education in the provincial unemployment table, so diploma and university comparisons are national only.

## Verification

- Production build and TypeScript checks passed.
- Eight automated data checks cover both reporting years and reconcile the provincial trends with national BPS totals. The geometry layer matches 38 BPS provinces with no duplicate or unmatched identities.
- Visual checks covered 1648 × 930, 1440 × 900, 1024 × 768 and 390 × 844. Both desktop sizes show the complete dashboard in one viewport.
- Browser checks covered province selection in both directions, scatter keyboard selection, reporting year and comparison filters, reset, chart tooltips, methodology links, and dismissal by Escape and outside click.
