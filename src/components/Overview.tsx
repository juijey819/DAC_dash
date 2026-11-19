import { ChartPie, ChevronDown, Database, Filter, GraduationCap, Lightbulb, RotateCcw, TrendingDown, TrendingUp, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { data } from '../dashboard-data'
import { august, integer, millions, missing, percent, reportYears, rupiah, signed } from '../data-model'
import type { ReportYear, Snapshot } from '../data-model'
import { InfoPopover, PanelHeading } from './Common'

const assets = import.meta.env.BASE_URL

export const wageScope = 'Average monthly net wage of wage and salary employees (buruh/karyawan/pegawai).'
export const wageSource = 'BPS Sakernas · T11'

export function SourceLinks({ codes }: { codes: string[] }) {
  return <ul className="source-links">{data.sources.filter(source => codes.includes(source.id)).map(source =>
    <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> <small>{source.id} · {source.survey}</small></li>)}</ul>
}

export function DashboardHeader() {
  return <header className="dashboard-header">
    <img className="hero-art" src={assets + 'education-work.svg'} alt="" fetchPriority="high" />
    <div className="header-brand">
      <img className="brand-mark" src={assets + 'education-mark.svg'} alt="" />
      <div className="brand-copy">
        <p className="eyebrow">PAGE 1</p>
        <h1>Vocation Paradox</h1>
        <p className="subtitle">Indonesia is a strange country.</p>
      </div>
    </div>
    <nav className="page-nav" aria-label="Dashboard pages">
      <span className="nav-pill active" aria-current="page">Overview</span>
      <span className="unavailable-nav" tabIndex={0} aria-describedby="regional-note">
        <span className="nav-pill" aria-disabled="true">Regional Insight</span>
        <span className="nav-hint" role="tooltip" id="regional-note">Regional Insight belongs to Page 2.</span>
      </span>
      <InfoPopover label="Methodology and sources">
        <p>National data come from Badan Pusat Statistik (BPS). SMK refers to vocational upper-secondary education and SMA Umum to general upper-secondary education.</p>
        <p><strong>TPT</strong> is the share of the labour force that is unemployed. <strong>TPAK</strong> is the share of the working-age population in the labour force. The map and scatter plot cover all education levels in August of the selected year.</p>
        <p>The national trend spans August 2021–2025. Provincial TPT for 2024–2025 divides the unemployed count by the labour force within the chosen education group. Earlier provincial values are omitted. The 2025 source groups diploma and university together, so those comparisons are offered only at national level. Wage bars cover wage and salary employees only, and SD corresponds to the Sekolah Dasar row. Formal employment and average years of schooling are annual indicators. Schooling covers residents aged 15 and over. The KPI badges compare August with August one year earlier. Wages are nominal.</p>
        <SourceLinks codes={['T01', 'T18', 'T18H', 'T11', 'T11H', 'T11B', 'T02', 'T03', 'T04', 'T07', 'TPR24', 'TPR25']} />
      </InfoPopover>
    </nav>
  </header>
}

interface Filters {
  province: string
  setProvince: (value: string) => void
  year: ReportYear
  setYear: (value: ReportYear) => void
  reset: () => void
}

export function FilterSidebar({ province, setProvince, year, setYear, reset }: Filters) {
  return <section className="card filter-card">
    <details className="filter-disclosure" open>
      <summary className="sidebar-strip"><Filter aria-hidden="true" /><h2>Filters</h2><ChevronDown className="filter-chevron" aria-hidden="true" /></summary>
      <div className="filter-fields">
        <label htmlFor="province-filter">Province</label>
        <select id="province-filter" title={province || 'All Provinces'} value={province} onChange={event => setProvince(event.target.value)}>
          <option value="">All Provinces</option>
          {[...data.provinces].sort((a, b) => a.name.localeCompare(b.name)).map(({ name }) => <option key={name}>{name}</option>)}
        </select>
        <label htmlFor="year-filter">Year</label>
        <select id="year-filter" value={year} onChange={event => setYear(Number(event.target.value) as ReportYear)}>
          {reportYears.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <button className="reset-button" type="button" onClick={reset}><RotateCcw size={17} aria-hidden="true" /> Reset filters</button>
      </div>
    </details>
  </section>
}

export function KeyInsight({ snapshot }: { snapshot: Snapshot }) {
  const { rate, wage, sameYearSmaWage } = snapshot.kpi
  const pay = wage === null || !sameYearSmaWage ? null : (wage / sameYearSmaWage - 1) * 100
  const message = rate === null || pay === null ? missing : snapshot.year === 2025
    ? `Nationally, SMK graduates had the highest unemployment rate (${percent(rate)}), while SMK employees earned ${percent(pay)} more than SMA Umum employees.`
    : `Nationally, SMK graduates had the highest unemployment rate (${percent(rate)}), while SMK and SMA Umum employees earned nearly the same monthly wage.`
  return <section className="card insights-card" aria-labelledby="key-insight-heading">
    <div className="sidebar-strip">
      <Lightbulb aria-hidden="true" />
      <h2 id="key-insight-heading">Key Insights</h2>
      <InfoPopover label="How to read this insight">
        <p>The unemployment rate covers everyone in the labour force within an education group. The wage figure averages monthly net pay among wage and salary employees.</p>
        <SourceLinks codes={['T01', 'T11', 'T11H']} />
      </InfoPopover>
    </div>
    <p className="insight-period">Indonesia · {snapshot.year}</p>
    <div className="insight-body">
      <p className="insight-text">{message}</p>
    </div>
  </section>
}

function KpiCard({ icon, title, subtitle, value, tone, context, details }: {
  icon: LucideIcon; title: string; subtitle: string; value: string;
  tone: 'green' | 'blue' | 'neutral'; context: ReactNode; details: ReactNode;
}) {
  return <section className="card kpi-card">
    <PanelHeading icon={icon} title={title}><InfoPopover label={title + ' details'}>{details}</InfoPopover></PanelHeading>
    <p className="kpi-subtitle">{subtitle}</p>
    <div className="kpi-value">{value}</div>
    <div className={'chip ' + tone}>{context}</div>
  </section>
}

function Change({ value, unit, priorYear }: { value: number | null; unit: string; priorYear: number }) {
  const Icon = value === null || value === 0 ? null : value > 0 ? TrendingUp : TrendingDown
  if (value === null) return <>Comparison unavailable</>
  return <>{Icon && <Icon size={15} aria-hidden="true" />}{signed(value, unit)} vs {priorYear}</>
}

export function KpiRow({ snapshot }: { snapshot: Snapshot }) {
  const { year, period, kpi } = snapshot
  const priorYear = year - 1
  const national = 'Indonesia · ' + period
  return <div className="kpi-row">
    <KpiCard icon={GraduationCap} title="SMK Unemployment Rate" subtitle={national} value={percent(kpi.rate)}
      tone={kpi.rateChange !== null && kpi.rateChange < 0 ? 'green' : 'neutral'}
      context={<Change value={kpi.rateChange} unit=" pp" priorYear={priorYear} />}
      details={<><p>Open unemployment as a share of the SMK labour force. Change from {august(priorYear)} to {period} in percentage points.</p><SourceLinks codes={['T01']} /></>} />
    <KpiCard icon={Database} title="Average Monthly Wage (SMK)" subtitle={national} value={millions(kpi.wage, 'Rp')}
      tone={kpi.wageChange !== null && kpi.wageChange > 0 ? 'green' : 'neutral'}
      context={<Change value={kpi.wageChange} unit="%" priorYear={priorYear} />}
      details={<><p>{wageScope} The year-over-year change uses nominal wages.</p><p>{august(priorYear)} {rupiah(kpi.previousWage)} · {period} {rupiah(kpi.wage)}</p><SourceLinks codes={year === 2025 ? ['T11', 'T11H'] : ['T11H', 'T11B']} /></>} />
    <KpiCard icon={UsersRound} title="Unemployed SMK Graduates" subtitle={national} value={millions(kpi.count)} tone="blue"
      context={<Change value={kpi.countChange} unit="%" priorYear={priorYear} />}
      details={<><p>Unemployed people whose highest completed education was SMK.</p><p>{august(priorYear)} {integer(kpi.previousCount)} people · {period} {integer(kpi.count)} people.</p><SourceLinks codes={['T18H', 'T18']} /></>} />
    <KpiCard icon={ChartPie} title="Share of Total Unemployment" subtitle={'SMK contribution · ' + period} value={percent(kpi.share)} tone="neutral"
      context="≈ 1 in 4 unemployed Indonesians" details={<><p>{integer(kpi.count)} unemployed SMK graduates out of {integer(kpi.totalCount)} unemployed people in Indonesia in {period}.</p><SourceLinks codes={year === 2025 ? ['T18'] : ['T18H']} /></>} />
  </div>
}
