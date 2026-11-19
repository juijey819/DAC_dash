# Provincial map geometry source

The BPS dashboard dataset contains province-level indicators but does not contain polygon geometry.
For the 38-province choropleth, obtain province boundaries from:

- Repository: https://github.com/mashadinoor/Indonesia-Geojson-2026
- Folder: `Provinsi/`
- Repository README states that it contains GeoJSON for all 38 Indonesian provinces, corrected province codes for the Papua expansion provinces, and an MIT license.
- The repository identifies Badan Informasi Geospasial (BIG) as the geometry source and Kepmendagri No. 100.1.1-6117/2022 for province codes.

Implementation requirements:
1. Download/clone only the `Provinsi/` GeoJSON assets needed for the dashboard and store them locally in `public/data/geo/`.
2. Merge them into one local `FeatureCollection` at `public/data/indonesia-provinces.geojson`.
3. Validate 38 unique province identities after merge. Do not assume 38 features if a province geometry contains multiple parts; validate 38 unique province codes/names.
4. Join to the BPS table by normalized province name or verified official province code. `ID_Prov_Internal` is an internal row number, NOT an official code.
5. Use an explicit alias map for naming differences (e.g. DKI Jakarta / Daerah Khusus Ibukota Jakarta; DI Yogyakarta / Daerah Istimewa Yogyakarta). Do not silently drop unmatched provinces.
6. Fail visibly during development if any of the 38 BPS province rows cannot be joined to geometry. Never draw a partial map and imply full coverage.
7. Add a small map attribution in the information popover: “Province boundary geometry: Indonesia-Geojson-2026 (MIT), based on BIG data; accessed for visualization.”
8. The GeoJSON is a boundary layer, not an indicator source. Indicator values must come only from the supplied BPS CSV files.

If the repository cannot be reached, do not substitute a 34-province boundary file or invent polygons. Keep the map component's loading/error state visible and report the missing 38-province geometry asset.
