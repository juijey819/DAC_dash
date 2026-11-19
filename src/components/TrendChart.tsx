import { ChartNoAxesCombined } from 'lucide-react'
import { data } from '../dashboard-data'
import { categories, integer, missing, percent, trendMax } from '../data-model'
import type { Education, ReportYear } from '../data-model'
import { chartMark, PanelHeading, usePlotSize, useTooltip } from './Common'

function seriesPath<T>(points: T[], getPoint: (point: T) => [number, number] | null) {
  let previous = false
  return points.map(point => {
    const position = getPoint(point)
    const instruction = position ? (previous ? 'L' : 'M') + position.join(',') : ''
    previous = Boolean(position)
    return instruction
  }).join(' ')
}

const start = 2021
const end = 2025
const years = [2021, 2022, 2023, 2024, 2025]

export function TrendChart({ province, reportYear, comparison, setComparison }: {
  province: string; reportYear: ReportYear; comparison: Education | ''; setComparison: (value: Education | '') => void;
}) {
  const plot = usePlotSize()
  const tooltip = useTooltip()
  const localRows = data.provinceTrend.filter(row => row.province === province)
  const provinceAvailable = localRows.some(row => row.education === 'SMK' && row.rate !== null)
  const rows = provinceAvailable ? localRows : data.trend
  const scope = provinceAvailable ? province : 'Indonesia'
  const options = categories.filter(education => education !== 'SMK' && rows.some(row => row.education === education && row.rate !== null))
  const activeComparison = options.find(option => option === comparison)
  const series = activeComparison ? ['SMK' as const, activeComparison] : ['SMK' as const]
  const sourceForYear = (year: number) => provinceAvailable ? 'TPR' + String(year).slice(-2) : 'T01'
  const { width, height } = plot
  const axisTop = 13
  const axisBottom = height - 29
  const axisLeft = 59
  const axisRight = width - (width < 370 ? 22 : 37)
  const x = (year: number) => axisLeft + 10 + (axisRight - axisLeft - 20) * (year - start) / (end - start)
  const y = (value: number) => axisBottom - (axisBottom - axisTop) * value / trendMax
  const smk = years.map(year => rows.find(row => row.year === year && row.education === 'SMK')?.rate ?? null)
  const smkArea = smk.every(value => value !== null)
    ? 'M' + x(start) + ',' + axisBottom + ' ' + smk.map((value, index) => 'L' + x(years[index]) + ',' + y(value)).join(' ') + ' L' + x(end) + ',' + axisBottom + 'Z'
    : ''
  const selectedRate = smk[reportYear - start]
  const valid = smk.some(value => value !== null)

  return <section className="card chart-card trend-card">
    <PanelHeading icon={ChartNoAxesCombined} title={`SMK Unemployment Trend, ${start}–${end}`}>
      <div className="compare-control"><label htmlFor="trend-compare">Compare with</label>
        <select id="trend-compare" value={activeComparison ?? ''} onChange={event => { tooltip.hide(); setComparison(event.target.value as Education | '') }}>
          <option value="">None</option>
          {options.map(value => <option key={value}>{value}</option>)}
        </select>
      </div>
    </PanelHeading>
    <div className="chart-meta trend-meta"><span aria-live="polite">
        {scope} · August estimates
        {provinceAvailable && <> · <span className="scope-note">Provincial data 2024–2025</span>
          {selectedRate === null && <> · <span className="scope-note">{reportYear} SMK estimate unavailable</span></>}
        </>}
        {province && !provinceAvailable && <> · <span className="scope-note">SMK series unavailable for {province}</span></>}
      </span>
      <div className="trend-legend" aria-label="Series">{series.map(education => <span key={education}><i className={education === 'SMK' ? 'orange' : 'blue'} />{education}</span>)}</div>
    </div>
    <div className="plot trend-plot" ref={plot.ref}>
      {!valid && <p className="chart-state">{missing}</p>}
      {valid && width > 100 && height > 70 && <svg width={width} height={height} aria-label="Open unemployment rate by education and year" role="group">
        <defs><linearGradient id="smk-area" x2="0" y2="1"><stop stopColor="#f5a05a" stopOpacity=".26" /><stop offset="1" stopColor="#fffaf5" stopOpacity=".25" /></linearGradient></defs>
        {smkArea && <path d={smkArea} fill="url(#smk-area)" />}
        {[0, 3, 6, 9, 12, 15].map(tick => <g key={tick}>
          <line className="gridline" x1={axisLeft} x2={axisRight} y1={y(tick)} y2={y(tick)} />
          <text className="tick" x={axisLeft - 10} y={y(tick)} dy=".34em" textAnchor="end">{tick}%</text>
        </g>)}
        {years.map(year => <g key={year}>
          <line className={year === reportYear ? "gridline report-year" : "gridline vertical"} x1={x(year)} x2={x(year)} y1={axisTop} y2={axisBottom} />
          <text className={year === reportYear ? "tick report-year-label" : "tick"} x={x(year)} y={axisBottom + 21} textAnchor="middle">{year}</text>
        </g>)}
        <path className="axis" d={`M${axisLeft},${axisTop} V${axisBottom} H${axisRight}`} />
        <text className="axis-label" textAnchor="middle" transform={`translate(15,${(axisTop + axisBottom) / 2}) rotate(-90)`}>TPT (%)</text>
        {series.map(education => {
          const isSmk = education === 'SMK'
          const color = isSmk ? 'var(--orange-line)' : 'var(--blue)'
          const points = years.map(year => ({
            year,
            rate: rows.find(item => item.education === education && item.year === year)?.rate ?? null,
            counts: provinceAvailable ? localRows.find(item => item.education === education && item.year === year) : undefined,
          }))
          return <g key={education}>
            <path className="series-line" stroke={color} d={seriesPath(points, point => point.rate === null ? null : [x(point.year), y(point.rate)])} />
            {points.map(({ year, rate, counts }) => rate !== null && <g key={year} className="chart-mark trend-point" data-year={year} data-education={education} data-rate={rate} {...chartMark({
              title: scope + ' · ' + education + ' · August ' + year,
              rows: [
                { label: 'Open unemployment rate (TPT)', value: percent(rate) },
                ...(counts ? [
                  { label: 'Unemployed people', value: integer(counts.unemployed) },
                  { label: 'Labour force', value: integer(counts.labourForce) },
                ] : []),
              ],
              note: 'BPS Sakernas · ' + sourceForYear(year) + (counts?.quality === 'caution' ? ' · BPS flags a relative standard error of 25%–50% in the underlying count.' : ''),
            }, tooltip)}>
              <circle className="hit-area" cx={x(year)} cy={y(rate)} r="11" />
              <circle className="trend-dot" stroke={color} cx={x(year)} cy={y(rate)} r={isSmk ? 5.4 : 4.2} />
            </g>)}
          </g>
        })}
        {selectedRate != null && <g className="trend-end-label" transform={`translate(${Math.min(x(reportYear) - 25, width - 57)}, ${y(selectedRate) - 29})`}>
          <rect width="53" height="20" rx="5" /><text x="26.5" y="14" textAnchor="middle">{percent(selectedRate)}</text>
        </g>}
      </svg>}
    </div>
    {tooltip.tooltip}
  </section>
}
