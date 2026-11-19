import { useEffect, useState } from 'react'
import { MapPin, ScatterChart } from 'lucide-react'
import { data, snapshots } from '../dashboard-data'
import { matchProvinces, missing, percent } from '../data-model'
import type { Boundaries, Province, ScatterPoint, Snapshot } from '../data-model'
import { chartMark, InfoPopover, PanelHeading, usePlotSize, useTooltip } from './Common'
import { SourceLinks } from './Overview'

type Selection = { selected: string; select: (value: string) => void }

function provinceTip(province: Province, { year, period }: Snapshot) {
  return {
    title: province.name,
    rows: [
      { label: 'Total TPT', value: percent(province.rate), note: period + ' · BPS Sakernas T02' },
      { label: 'TPAK', value: percent(province.participation), note: period + ' · BPS Sakernas T03' },
      { label: 'Formal employment share', value: percent(province.formal), note: `Annual ${year} · BPS Sakernas T04` },
      { label: 'Average years of schooling', value: province.schooling === null ? missing : province.schooling.toFixed(2) + ' years', note: `Annual ${year} · Ages 15+ · BPS Susenas T07` },
    ],
    note: 'Province-wide indicators across education levels.',
  }
}

function prepareMap(geo: Boundaries) {
  const provinces = matchProvinces(geo, data.provinces)
  const bounds = { west: Infinity, east: -Infinity, north: -Infinity, south: Infinity }
  for (const { polygons } of provinces) {
    for (const polygon of polygons) {
      if (!polygon.length) throw new Error('Empty province polygon.')
      for (const ring of polygon) {
        if (ring.length < 4) throw new Error('Open or incomplete province ring.')
        for (const [x, y] of ring) {
          if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid province coordinates.')
          bounds.west = Math.min(bounds.west, x)
          bounds.east = Math.max(bounds.east, x)
          bounds.north = Math.max(bounds.north, y)
          bounds.south = Math.min(bounds.south, y)
        }
      }
    }
  }
  const scale = 700 / (bounds.east - bounds.west)
  const height = (bounds.north - bounds.south) * scale + 16
  const shapes = provinces.map(({ province, code, polygons }) => ({
    code, name: province.name,
    path: polygons.map(polygon => polygon.map(ring => ring.map(([lon, lat], index) => {
      const x = (lon - bounds.west) * scale + 8
      const y = (bounds.north - lat) * scale + 8
      return (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)
    }).join('') + 'Z').join('')).join(''),
  }))
  return { width: 716, height, shapes }
}

const rates = Object.values(snapshots).flatMap(snapshot => snapshot.provinces.flatMap(row => row.rate === null ? [] : [row.rate]))
const lowest = Math.min(...rates)
const highest = Math.max(...rates)
function rateColor(rate: number | null) {
  if (rate === null) return '#e7ecf1'
  const position = Math.max(0, Math.min(100, (rate - lowest) / (highest - lowest || 1) * 100))
  return `color-mix(in srgb, #0a62b4 ${position}%, #d6ebff)`
}

export function ProvinceChoropleth({ snapshot, selected, select }: Selection & { snapshot: Snapshot }) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; map: ReturnType<typeof prepareMap> }
  >({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const tooltip = useTooltip()
  useEffect(() => {
    const controller = new AbortController()
    fetch(import.meta.env.BASE_URL + 'data/indonesia-provinces.geojson', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Province boundary request failed.')
        return response.json() as Promise<Boundaries>
      })
      .then(geo => setState({ status: 'ready', map: prepareMap(geo) }))
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }) })
    return () => controller.abort()
  }, [attempt])
  const { year, period } = snapshot
  const byProvince = new Map(snapshot.provinces.map(row => [row.name, row]))
  const current = state.status === 'ready' ? state.map.shapes.find(shape => shape.name === selected) : undefined

  return <section className="card chart-card map-card">
    <PanelHeading icon={MapPin} title={`Provincial Employment Pressure, ${year}`}>
      <InfoPopover label="About the provincial map">
        <p>The map shows total provincial TPT across all education levels. Source: BPS Sakernas, {period}. The colour scale is shared across reporting years.</p>
        <p>Province boundary geometry: <a href="https://github.com/mashadinoor/Indonesia-Geojson-2026" target="_blank" rel="noreferrer">Indonesia-Geojson-2026</a> (MIT), based on BIG data and accessed for visualization.</p>
        <SourceLinks codes={['T02', 'T03', 'T04', 'T07']} />
      </InfoPopover>
    </PanelHeading>
    <p className="chart-meta">Total TPT across all education levels · {period}</p>
    <span className="sr-only" aria-live="polite">{selected ? 'Selected province: ' + selected : ''}</span>
    <div className="map-body">
      {state.status === 'loading' && <p className="chart-state" role="status">Loading provincial boundaries…</p>}
      {state.status === 'error' && <div className="chart-state" role="status">
        <p>Data not available. The 38-province layer could not be loaded or verified.</p>
        <button type="button" onClick={() => { setState({ status: 'loading' }); setAttempt(attempt + 1) }}>Retry</button>
      </div>}
      {state.status === 'ready' && <svg className="province-map" viewBox={`0 0 ${state.map.width} ${state.map.height}`} role="group" aria-label="Choropleth of total open unemployment across 38 Indonesian provinces">
        {state.map.shapes.map(({ code, name, path }) => {
          const province = byProvince.get(name)
          if (!province) return null
          return <g key={code} className="province-mark chart-mark" data-province={name} aria-pressed={selected === name}
            {...chartMark(provinceTip(province, snapshot), tooltip, () => select(name))}>
            <path d={path} className="province-shape" fill={rateColor(province.rate)} aria-hidden="true" />
          </g>
        })}
        {current && <path className="selected-boundary" d={current.path} aria-hidden="true" />}
      </svg>}
    </div>
    {state.status === 'ready' && <div className="map-legend" aria-label={`Lower TPT ${percent(lowest)} to higher TPT ${percent(highest)}`}>
      <span>Lower TPT <small>{percent(lowest)}</small></span><i /><span>Higher TPT <small>{percent(highest)}</small></span>
    </div>}
    {tooltip.tooltip}
  </section>
}

function scatterTip(point: ScatterPoint) {
  return { title: point.name, rows: [
    { label: 'Total TPT', value: percent(point.rate) },
    { label: 'TPAK', value: percent(point.participation) },
  ], note: (point.national ? 'National benchmark · ' : '') + point.period + ' · All education levels · BPS Sakernas' }
}

const scatterRates = Object.values(snapshots).flatMap(snapshot => snapshot.scatter.flatMap(row => row.rate === null ? [] : [row.rate]))
const participations = Object.values(snapshots).flatMap(snapshot => snapshot.scatter.flatMap(row => row.participation === null ? [] : [row.participation]))
const xMin = Math.floor(Math.min(...scatterRates))
const xMax = Math.ceil(Math.max(...scatterRates))
const yMin = Math.floor(Math.min(...participations) / 5) * 5
const yMax = Math.ceil(Math.max(...participations) / 5) * 5

export function ProvincialScatterChart({ snapshot, selected, select }: Selection & { snapshot: Snapshot }) {
  const plot = usePlotSize()
  const tooltip = useTooltip()
  const dots = snapshot.scatter.flatMap(row => row.rate !== null && row.participation !== null
    ? [{ ...row, rate: row.rate, participation: row.participation }] : [])
  const { width, height } = plot
  const axisTop = 10
  const axisBottom = height - 42
  const axisLeft = 60
  const axisRight = width - 15
  const x = (value: number) => axisLeft + (axisRight - axisLeft) * (value - xMin) / (xMax - xMin || 1)
  const y = (value: number) => axisBottom - (axisBottom - axisTop) * (value - yMin) / (yMax - yMin || 1)
  const ticks = (start: number, end: number, step: number) => Array.from({ length: (end - start) / step + 1 }, (_, index) => start + index * step)
  const national = dots.find(row => row.national)
  const provinces = dots.filter(row => !row.national)
  const selectedPoint = provinces.find(row => row.name === selected)

  function dot(point: typeof dots[number]) {
    const active = selected === point.name
    return <g key={point.name} className={`chart-mark scatter-dot${point.national ? ' national' : ''}${active ? ' selected' : ''}${selected && !active && !point.national ? ' dimmed' : ''}`}
      data-province={point.name} aria-pressed={!point.national ? active : undefined}
      transform={`translate(${x(point.rate)},${y(point.participation)})`}
      {...chartMark(scatterTip(point), tooltip, point.national ? undefined : () => select(point.name))}>
      <circle className="hit-area" r="8" />
      {point.national ? <rect className="benchmark-dot" x="-3.3" y="-3.3" width="6.6" height="6.6" rx="1" transform="rotate(45)" /> :
        <circle className="dot-core" r={active ? 6.5 : 4.1} />}
      {active && <circle className="dot-center" r="2.5" />}
    </g>
  }

  return <section className="card chart-card scatter-card">
    <PanelHeading icon={ScatterChart} title="Provincial Labour Market Context">
      <InfoPopover label="About the provincial scatter plot">
        <p>Each blue point is a province. The selected province is orange. The gray diamond is the Indonesia benchmark. All points cover all education levels in {snapshot.period}.</p>
        <p>TPT measures unemployment as a share of the labour force. TPAK measures the labour force as a share of the working-age population.</p>
        <SourceLinks codes={['T02', 'T03']} />
      </InfoPopover>
    </PanelHeading>
    <div className="chart-meta scatter-meta">
      <span>All education levels · {snapshot.period}</span>
      <span className="benchmark-key"><i aria-hidden="true" />Indonesia</span>
    </div>
    <div className="plot scatter-plot" ref={plot.ref}>
      {dots.length === 0 && <p className="chart-state">{missing}</p>}
      {dots.length > 0 && width > 100 && height > 80 && <svg width={width} height={height} aria-label="Total TPT and TPAK by province" role="group">
        {ticks(yMin, yMax, 5).map(tick => <g key={tick}>
          <line className="gridline" x1={axisLeft} x2={axisRight} y1={y(tick)} y2={y(tick)} />
          <text className="tick" x={axisLeft - 9} y={y(tick)} dy=".34em" textAnchor="end">{tick}%</text>
        </g>)}
        {ticks(xMin, xMax, 1).map(tick => <g key={tick}>
          <line className="gridline vertical" x1={x(tick)} x2={x(tick)} y1={axisTop} y2={axisBottom} />
          <text className="tick" x={x(tick)} y={axisBottom + 17} textAnchor="middle">{tick}%</text>
        </g>)}
        <path className="axis" d={`M${axisLeft},${axisTop} V${axisBottom} H${axisRight}`} />
        <text className="axis-label" textAnchor="middle" transform={`translate(14,${(axisTop + axisBottom) / 2}) rotate(-90)`}>TPAK (%)</text>
        <text className="axis-label" textAnchor="middle" x={(axisLeft + axisRight) / 2} y={height - 5}>TPT Total (%)</text>
        {provinces.filter(row => row.name !== selected).map(dot)}
        {national && dot(national)}
        {selectedPoint && <>
          {dot(selectedPoint)}
          <SelectedProvinceLabel name={selectedPoint.name} x={x(selectedPoint.rate)} y={y(selectedPoint.participation)} left={axisLeft} right={axisRight} top={axisTop} />
        </>}
      </svg>}
    </div>
    {tooltip.tooltip}
  </section>
}

function SelectedProvinceLabel({ name, x, y, left, right, top }: {
  name: string; x: number; y: number; left: number; right: number; top: number;
}) {
  const width = name.length * 7 + 14
  const labelX = Math.max(left + 2, Math.min(right - width - 2, x - width / 2))
  const labelY = y < top + 30 ? y + 11 : y - 29
  return <g className="scatter-selection" transform={`translate(${labelX},${labelY})`} aria-hidden="true">
    <rect width={width} height="19" rx="5" />
    <text x={width / 2} y="13" textAnchor="middle">{name}</text>
  </g>
}
