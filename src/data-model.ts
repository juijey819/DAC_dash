import { csvParseRows } from 'd3-dsv'

export const reportYears = [2025, 2024] as const
export type ReportYear = typeof reportYears[number]
export const august = (year: number) => 'August ' + year
export const categories = ['SMK', 'SMA Umum', 'SMP', 'SD ke bawah', 'Diploma I/II/III', 'Universitas'] as const
export const trendMax = 15
export type Education = typeof categories[number]
type Numeric = number | null

function csv(input: string) {
  const [headers, ...rows] = csvParseRows(input.replace(/^\uFEFF/, ''))
  if (!headers?.length) throw new Error('A required data table has no headers.')
  return rows.filter(row => row.some(Boolean)).map(row => {
    if (row.length !== headers.length) throw new Error('A data row has an unexpected number of fields.')
    return Object.fromEntries(headers.map((header, index) => [header, row[index].trim()]))
  })
}

function number(value: string | undefined): Numeric {
  if (!value?.trim()) return null
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

function education(value: string): Education {
  const label = categories.find(item => item === value)
  if (!label) throw new Error('Unexpected education category: ' + value)
  return label
}

export function parseDashboard(files: Record<string, string>) {
  const read = (id: string) => {
    const tables = Object.entries(files).filter(([path]) => path.split('/').at(-1)?.startsWith(id + '_'))
    if (tables.length !== 1) throw new Error('Expected one data table for ' + id)
    return csv(tables[0][1].replace(/^\uFEFF/, '').replace(/^#.*(?:\r?\n|$)/gm, ''))
  }
  const [row] = read('D1_01')
  if (!row) throw new Error('No national KPI data.')
  const provincialTable = (id: string, column: string) => new Map(
    read(id).map(row => [provinceKey(row.Provinsi), number(row[column]?.replace(',', '.'))]),
  )
  const oldRates = provincialTable('T02', 'Agustus 2024')
  const oldParticipation = provincialTable('T03', 'Agustus 2024')
  const oldFormal = provincialTable('T04', 'Tahunan 2024')
  const oldSchooling = provincialTable('T07', 'Tahunan 2024')
  return {
    kpi: {
      year: number(row.Tahun),
      rate: number(row.TPT_SMK_pct),
      smaRate: number(row.TPT_SMA_Umum_pct),
      gap: number(row.Gap_TPT_SMK_vs_SMA_pp),
      count: number(row.Penganggur_SMK_Agustus_orang),
      totalCount: number(row.Total_Penganggur_Agustus_orang),
      share: number(row.Share_Penganggur_SMK_pct),
      wage: number(row.Upah_Buruh_SMK_Agustus_Rp),
      smaWage: number(row.Upah_Buruh_SMA_Umum_Agustus_Rp),
      premium: number(row.Premi_Upah_SMK_vs_SMA_pct),
      change: number(row.Perubahan_TPT_SMK_2024_2025_pp),
    },
    trend: read('D1_02').map(row => ({
      year: number(row.Tahun),
      education: education(row.Jenjang_Standar),
      rate: number(row.TPT_pct),
    })),
    provinceTrend: read('D1_14').map(row => {
      const unemployed = number(row.August_Unemployed)
      const labourForce = number(row.August_Labour_Force)
      return {
        province: row.Province,
        year: number(row.Year),
        education: education(row.Education),
        unemployed, labourForce,
        rate: unemployed === null || !labourForce ? null : 100 * unemployed / labourForce,
        quality: row.RSE_Flag,
      }
    }),
    composition: read('D1_03').map(row => ({
      education: education(row.Jenjang_Standar),
      share: number(row.Pangsa_Penganggur_Agustus_pct),
      count: number(row.Penganggur_Agustus_orang),
    })),
    wages: read('D1_12').map(row => ({
      education: row.Education === 'SD' ? 'SD' : education(row.Education),
      bpsLabel: row.Pendidikan_BPS,
      amount: number(row.Wage_Aug_Rp),
      millions: number(row.Wage_Aug_Million),
    })),
    provinces: read('D1_06').map(row => ({
      name: row.Provinsi,
      rate: number(row.TPT_Total_Agustus_2025_pct),
      participation: number(row.TPAK_Agustus_2025_pct),
      formal: number(row.Pekerja_Formal_Tahunan_2025_pct),
      schooling: number(row.RLS_Tahunan_2025_tahun),
    })),
    scatter: read('D1_11').map(row => ({
      national: row.Point_Type === 'National',
      name: row.Province,
      rate: number(row.TPT_Total_pct),
      participation: number(row.TPAK_pct),
      period: row.Period,
    })),
    historicalEducation: read('D1_13').map(row => ({
      year: number(row.Year),
      name: row.Education,
      count: number(row.August_Unemployed),
      wage: number(row.August_Wage_Rp),
    })),
    historicalProvince(name: string) {
      const key = provinceKey(name)
      return {
        name,
        rate: oldRates.get(key) ?? null,
        participation: oldParticipation.get(key) ?? null,
        formal: oldFormal.get(key) ?? null,
        schooling: oldSchooling.get(key) ?? null,
      }
    },
    sources: read('D1_10').map(row => ({
      id: row.Kode_Sumber,
      name: row.Judul_Tabel,
      survey: row.Survei,
      url: row.URL_Resmi_BPS,
    })),
  }
}

export type DashboardData = ReturnType<typeof parseDashboard>
export type Province = DashboardData['provinces'][number]
export type ScatterPoint = DashboardData['scatter'][number]

export function relativeChange(current: Numeric, previous: Numeric): Numeric {
  return current === null || previous === null || previous === 0 ? null : (current - previous) / previous * 100
}

export function createSnapshot(data: DashboardData, year: ReportYear) {
  const historical = (name: string, referenceYear: number) =>
    data.historicalEducation.find(row => row.name === name && row.year === referenceYear)
  const rate = (referenceYear: number) =>
    data.trend.find(row => row.education === 'SMK' && row.year === referenceYear)?.rate ?? null
  const count = (referenceYear: number) =>
    referenceYear === 2025 ? data.kpi.count : historical('SMK', referenceYear)?.count ?? null
  const wage = (referenceYear: number) =>
    referenceYear === 2025 ? data.kpi.wage : historical('SMK', referenceYear)?.wage ?? null
  const currentRate = rate(year)
  const previousRate = rate(year - 1)
  const currentCount = count(year)
  const currentWage = wage(year)
  const previousCount = count(year - 1)
  const previousWage = wage(year - 1)
  const totalCount = year === 2025 ? data.kpi.totalCount : historical('Total', year)?.count ?? null
  const share = (amount: Numeric) => amount === null || !totalCount ? null : 100 * amount / totalCount
  const composition = year === 2025 ? data.composition : categories.map(education => {
    const count = historical(education, year)?.count ?? null
    return { education, count, share: share(count) }
  })
  const wages = year === 2025 ? data.wages : data.wages.map(row => {
    const amount = historical(row.education, year)?.wage ?? null
    return { ...row, amount, millions: amount === null ? null : amount / 1_000_000 }
  })
  const provinces = year === 2025 ? data.provinces : data.provinces.map(province => data.historicalProvince(province.name))
  const scatter = year === 2025 ? data.scatter : [...provinces, data.historicalProvince('Indonesia')].map(row => ({
    name: row.name,
    rate: row.rate,
    participation: row.participation,
    national: row.name === 'Indonesia',
    period: august(year),
  }))
  return {
    year, period: august(year), composition, wages, provinces, scatter,
    kpi: {
      count: currentCount, totalCount, wage: currentWage, rate: currentRate, share: share(currentCount),
      previousCount, previousWage,
      sameYearSmaWage: wages.find(row => row.education === 'SMA Umum')?.amount ?? null,
      rateChange: currentRate === null || previousRate === null ? null : currentRate - previousRate,
      wageChange: relativeChange(currentWage, previousWage),
      countChange: relativeChange(currentCount, previousCount),
    },
  }
}

export type Snapshot = ReturnType<typeof createSnapshot>


type Position = [number, number]
type Polygon = Position[][]
export type Boundaries = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    properties: { name: string; code: string }
    geometry: { type: 'MultiPolygon'; coordinates: Polygon[] }
  }[]
}

const aliases: Record<string, string> = {
  'daerah khusus ibukota jakarta': 'dki jakarta',
  'daerah khusus ibu kota jakarta': 'dki jakarta',
  'daerah istimewa yogyakarta': 'di yogyakarta',
  'bangka belitung': 'kepulauan bangka belitung',
  'kep bangka belitung': 'kepulauan bangka belitung',
  'kep riau': 'kepulauan riau',
}

function provinceKey(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z]+/g, ' ').trim()
  return aliases[normalized] ?? normalized
}

export function matchProvinces(geo: Boundaries, provinces: Province[]) {
  const rows = new Map(provinces.map(province => [provinceKey(province.name), province]))
  const shapes = new Set<string>()
  const codes = new Set<string>()

  if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features) || rows.size !== 38 || provinces.length !== 38) {
    throw new Error('The boundary layer and the source table must cover 38 unique provinces.')
  }
  const matched = geo.features.map(feature => {
    const key = provinceKey(feature.properties.name)
    const code = feature.properties.code
    const province = rows.get(key)
    if (!province || shapes.has(key) || codes.has(code) || !/^\d{2}$/.test(code) ||
        feature.geometry.type !== 'MultiPolygon' || !feature.geometry.coordinates.length) {
      throw new Error('Unmatched or invalid province boundary: ' + feature.properties.name)
    }
    shapes.add(key)
    codes.add(code)
    return { province, code, polygons: feature.geometry.coordinates }
  })
  if (shapes.size !== rows.size) {
    throw new Error('Missing boundaries: ' + [...rows.keys()].filter(name => !shapes.has(name)).join(', '))
  }
  return matched
}

export const missing = 'Data not available'
export const percent = (value: Numeric) => value === null ? missing : value.toFixed(2) + '%'
export const millions = (value: Numeric, prefix = '') => value === null ? missing : prefix + (value / 1_000_000).toFixed(2) + 'M'
export const integer = (value: Numeric) => value === null ? missing : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
export const rupiah = (value: Numeric) => value === null ? missing : 'Rp' + integer(value)
export const signed = (value: Numeric, suffix: string) => value === null ? missing : (value < 0 ? '−' : value > 0 ? '+' : '') + Math.abs(value).toFixed(2) + suffix
