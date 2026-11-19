import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import { csvParseRows } from 'd3-dsv'
import { august, createSnapshot, matchProvinces, parseDashboard, trendMax } from '../src/data-model.ts'

const folders = ['../data/tableau_ready/', '../data/source_raw_bps/'].map(path => new URL(path, import.meta.url))
const files = Object.fromEntries(folders.flatMap(folder => readdirSync(folder).map(name => [name, readFileSync(new URL(name, folder), 'utf8')])))
const data = parseDashboard(files)
const close = (value, expected, tolerance = .005) => assert.ok(Math.abs(value - expected) <= tolerance, `${value} ≈ ${expected}`)

test('August 2025 national KPIs and their derived comparisons', () => {
  const { kpi } = data
  assert.equal(kpi.year, 2025)
  assert.equal(kpi.rate, 8.63)
  assert.equal(kpi.smaRate, 6.88)
  close(kpi.rate - kpi.smaRate, 1.75)
  close(kpi.gap, 1.75)
  assert.equal(kpi.count, 1_923_756)
  assert.equal(kpi.totalCount, 7_461_507)
  close(kpi.share, 100 * kpi.count / kpi.totalCount)
  close(kpi.share, 25.78)
  assert.equal(kpi.wage, 3_256_604)
  assert.equal(kpi.smaWage, 3_149_687)
  close(kpi.premium, 100 * (kpi.wage / kpi.smaWage - 1))
  close(kpi.premium, 3.39)
  close(kpi.change, -.38)
})

test('trend has seven complete years and includes its 13.55% peak', () => {
  const { trend, kpi } = data
  const smk = trend.filter(item => item.education === 'SMK')
  const rate = (year, education) => trend.find(item => item.year === year && item.education === education)?.rate
  assert.equal(trend.length, 42)
  assert.equal(new Set(trend.map(row => `${row.year}-${row.education}`)).size, 42)
  assert.deepEqual(smk.map(item => item.year), [2019, 2020, 2021, 2022, 2023, 2024, 2025])
  assert.ok(trend.every(item => item.rate >= 0 && item.rate <= trendMax && item.rate !== null))
  assert.equal(rate(2020, 'SMK'), 13.55)
  assert.equal(rate(2025, 'SMK'), kpi.rate)
  assert.equal(rate(2025, 'SMA Umum'), kpi.smaRate)
  assert.equal(Math.max(...trend.filter(item => item.year === 2025).map(item => item.rate)), kpi.rate)
  close(rate(2025, 'SMK') - rate(2024, 'SMK'), kpi.change)
})

test('composition and wage bars match the specified categories and bases', () => {
  assert.equal(data.composition.length, 6)
  const shares = Object.fromEntries(data.composition.map(item => [item.education, item.share]))
  for (const [category, expected] of Object.entries({ 'SMA Umum': 30.74, SMK: 25.78, 'SD ke bawah': 16.10, SMP: 13.29, Universitas: 12.12, 'Diploma I/II/III': 1.96 })) close(shares[category], expected)
  close(Object.values(shares).reduce((sum, value) => sum + value, 0), 100)
  assert.equal(data.wages.length, 6)
  const expected = { Universitas: 4_804_860, 'Diploma I/II/III': 4_500_603, SMK: 3_256_604, 'SMA Umum': 3_149_687, SMP: 2_482_817, SD: 2_242_860 }
  assert.deepEqual(Object.fromEntries(data.wages.map(row => [row.education, row.amount])), expected)
  assert.ok(data.wages.every(row => row.amount / 1_000_000 === row.millions))
  assert.equal(data.wages.find(row => row.education === 'SD').bpsLabel, 'Sekolah Dasar')
})

test('map and scatter contain all 38 provinces and match the national benchmark', () => {
  const provinces = new Map(data.provinces.map(row => [row.name, row]))
  assert.equal(data.provinces.length, 38)
  assert.equal(provinces.size, 38)
  assert.equal(data.scatter.length, 39)
  assert.equal(new Set(data.scatter.map(row => row.name)).size, 39)
  assert.ok(data.scatter.every(row => row.period === august(2025)))
  const national = data.scatter.filter(row => row.national)
  assert.deepEqual(national.map(row => [row.name, row.rate, row.participation]), [['Indonesia', 4.85, 70.59]])
  for (const row of data.scatter.filter(row => !row.national)) {
    const province = provinces.get(row.name)
    assert.ok(province)
    assert.ok(Number.isFinite(province.rate) && Number.isFinite(province.participation))
    assert.equal(province.rate, row.rate)
    assert.equal(province.participation, row.participation)
  }
})

test('all geographic identities and their polygon rings validate', () => {
  const geo = JSON.parse(readFileSync(new URL('../public/data/indonesia-provinces.geojson', import.meta.url)))
  const joined = matchProvinces(geo, data.provinces)
  assert.equal(joined.length, 38)
  assert.equal(new Set(joined.map(row => row.province.name)).size, 38)
  for (const { polygons } of joined) {
    assert.ok(polygons.every(polygon => polygon.length))
    for (const ring of polygons.flat()) {
      assert.ok(ring.length >= 4)
      assert.deepEqual(ring[0], ring.at(-1))
      assert.ok(ring.every(([lon, lat]) => lon > 90 && lon < 145 && lat > -15 && lat < 10))
    }
  }
  assert.throws(() => matchProvinces({ ...geo, features: geo.features.slice(1) }, data.provinces), /Missing boundaries/)
  assert.throws(() => matchProvinces({ ...geo, features: [...geo.features, geo.features[0]] }, data.provinces), /Unmatched or invalid/)
})

test('blank provincial SMK TPT is not part of the displayed model', () => {
  const contextFile = Object.keys(files).find(name => name.startsWith('D1_05_'))
  const [header, ...rows] = csvParseRows(files[contextFile])
  const index = header.indexOf('TPT_SMK_Agustus_2025_pct')
  assert.ok(index >= 0)
  assert.equal(rows.length, 38)
  assert.ok(rows.every(row => row[index] === ''))
  assert.ok(data.provinces.every(row => Object.keys(row).sort().join() === 'formal,name,participation,rate,schooling'))
})

test('reporting years drive the snapshot and compare the same month one year earlier', () => {
  const current = createSnapshot(data, 2025)
  const prior = createSnapshot(data, 2024)
  assert.equal(current.kpi.previousCount, prior.kpi.count)
  assert.equal(current.kpi.previousWage, prior.kpi.wage)
  assert.equal(prior.kpi.previousCount, 1_780_095)
  assert.equal(prior.kpi.previousWage, 3_028_328)
  assert.equal(prior.kpi.count, 1_840_162)
  assert.equal(prior.kpi.wage, 3_091_621)
  assert.equal(prior.kpi.totalCount, 7_465_599)
  assert.equal(prior.kpi.rate, 9.01)
  close(current.kpi.wageChange, 5.34)
  close(current.kpi.countChange, 4.54)
  close(prior.kpi.wageChange, 2.09)
  close(prior.kpi.countChange, 3.37)
  close(prior.composition.reduce((sum, row) => sum + row.share, 0), 100)
  assert.equal(prior.wages.find(row => row.education === 'SD').amount, 2_143_184)
  assert.equal(prior.wages.find(row => row.education === 'Universitas').amount, 4_960_719)
  assert.equal(prior.provinces.length, 38)
  assert.ok(prior.provinces.every(row => [row.rate, row.participation, row.formal, row.schooling].every(Number.isFinite)))
  assert.deepEqual(prior.provinces.find(row => row.name === 'Aceh'), { name: 'Aceh', rate: 5.75, participation: 65.11, formal: 39.83, schooling: 9.95 })
  assert.equal(prior.scatter.length, 39)
  assert.deepEqual(prior.scatter.find(row => row.national), {
    name: 'Indonesia', national: true, rate: 4.91, participation: 70.63, period: 'August 2024',
  })
})

test('provincial education rates reconcile to the published national counts', () => {
  const expected = {
    2024: { unemployed: [1_228_158, 1_091_015, 2_293_359, 1_840_162], labourForce: [53_013_295, 26_568_780, 32_527_868, 20_432_932] },
    2025: { unemployed: [1_201_440, 991_984, 2_293_563, 1_923_756], labourForce: [52_123_628, 26_071_970, 33_340_105, 22_285_170] },
  }
  const education = ['SD ke bawah', 'SMP', 'SMA Umum', 'SMK']
  assert.equal(data.provinceTrend.length, 304)
  for (const year of [2024, 2025]) {
    for (const field of ['unemployed', 'labourForce']) {
      const sum = education.map(category => {
        const rows = data.provinceTrend.filter(row => row.year === year && row.education === category)
        assert.deepEqual(rows.map(row => row.province).sort(), data.provinces.map(row => row.name).sort())
        return rows.reduce((subtotal, row) => subtotal + (row[field] ?? 0), 0)
      })
      assert.deepEqual(sum, expected[year][field])
    }
  }
  const jawaTimur = data.provinceTrend.filter(row => row.province === 'Jawa Timur' && row.education === 'SMK')
  assert.deepEqual(jawaTimur.map(row => [row.year, row.unemployed, row.labourForce]), [[2024, 230_110, 3_380_476], [2025, 250_479, 3_695_482]])
  close(jawaTimur[0].rate, 6.81)
  close(jawaTimur[1].rate, 6.78)
  const suppressed = data.provinceTrend.find(row => row.year === 2025 && row.province === 'Papua Pegunungan' && row.education === 'SMK')
  assert.equal(suppressed.rate, null)
  assert.equal(suppressed.quality, 'suppressed')
  assert.equal(data.provinceTrend.find(row => row.year === 2025 && row.province === 'Papua Tengah' && row.education === 'SMK').quality, 'caution')
})
