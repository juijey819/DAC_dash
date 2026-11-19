import { Database, Layers3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { integer, missing, percent, rupiah } from '../data-model'
import type { Snapshot } from '../data-model'
import type { Tip } from './Common'
import { PanelHeading, useTooltip } from './Common'
import { wageScope, wageSource } from './Overview'

type Bar = { name: string; value: number | null; display: string; tip: Tip }

function BarChart({ icon, title, subtitle, bars }: { icon: LucideIcon; title: string; subtitle: string; bars: Bar[] }) {
  const tooltip = useTooltip()
  const sorted = [...bars].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
  const maximum = Math.max(1, ...sorted.map(bar => bar.value ?? 0))
  return <section className="card chart-card bar-card">
    <PanelHeading icon={icon} title={title} />
    <p className="chart-meta">{subtitle}</p>
    {sorted.length === 0 ? <p className="chart-state">{missing}</p> :
      <ul className="bars" aria-label={title}>{sorted.map(bar => <li key={bar.name}>
        <button type="button" className={'bar-item' + (bar.name === 'SMK' ? ' smk' : '')}
          aria-label={bar.name + ', ' + bar.display}
          onFocus={event => tooltip.show(event.currentTarget, bar.tip)} onBlur={tooltip.hide}
          onPointerEnter={event => { if (event.pointerType !== 'touch') tooltip.show(event.currentTarget, bar.tip) }}
          onPointerLeave={event => { if (event.pointerType !== 'touch') tooltip.hide() }}
          onClick={event => tooltip.show(event.currentTarget, bar.tip)}>
          <span className="bar-label">{bar.name}</span>
          {bar.value === null ? <span className="bar-unavailable">{missing}</span> :
            <span className="bar-lane"><span className="bar-shape" style={{ width: bar.value / maximum * 100 + '%' }} /><strong>{bar.display}</strong></span>}
        </button>
      </li>)}</ul>}
    {tooltip.tooltip}
  </section>
}

export function UnemploymentCompositionChart({ snapshot }: { snapshot: Snapshot }) {
  const { composition, period, year } = snapshot
  return <BarChart icon={Layers3} title="Unemployment Composition by Education" subtitle={'Share of all unemployed people · ' + period}
    bars={composition.map(row => ({
      name: row.education, value: row.share, display: percent(row.share),
      tip: { title: row.education + ' · ' + period, rows: [
        { label: 'Share of total unemployment', value: percent(row.share) },
        { label: 'Unemployed people', value: integer(row.count) },
      ], note: 'Indonesia · BPS Sakernas · ' + (year === 2025 ? 'T18' : 'T18H') },
    }))} />
}

export function WageByEducationChart({ snapshot }: { snapshot: Snapshot }) {
  const { wages, period, year } = snapshot
  return <BarChart icon={Database} title="Average Monthly Wage by Education" subtitle={'Wage and salary employees · ' + period}
    bars={wages.map(row => ({
      name: row.education, value: row.millions, display: row.millions === null ? missing : 'Rp' + row.millions.toFixed(2) + 'M',
      tip: { title: row.education + ' · ' + period, rows: [
        { label: 'Average monthly net wage', value: rupiah(row.amount) },
      ], note: (row.education === 'SD' ? 'SD = Sekolah Dasar. ' : '') + wageScope + ' ' + (year === 2025 ? wageSource : 'BPS Sakernas · T11H') },
    }))} />
}
