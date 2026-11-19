import { createSnapshot, parseDashboard } from './data-model'

const files = import.meta.glob<string>(
  ['../data/tableau_ready/D1_{01,02,03,06,10,11,12,13,14}_*.csv', '../data/source_raw_bps/T{02,03,04,07}_*.csv'],
  { query: '?raw', import: 'default', eager: true },
)

export const data = parseDashboard(files)
export const snapshots = {
  2024: createSnapshot(data, 2024),
  2025: createSnapshot(data, 2025),
}
