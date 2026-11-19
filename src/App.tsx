import { useState } from 'react'
import { snapshots } from './dashboard-data'
import type { Education, ReportYear } from './data-model'
import { DashboardHeader, FilterSidebar, KeyInsight, KpiRow } from './components/Overview'
import { TrendChart } from './components/TrendChart'
import { ProvinceChoropleth, ProvincialScatterChart } from './components/ProvinceCharts'
import { UnemploymentCompositionChart, WageByEducationChart } from './components/BarCharts'

export function App() {
  const [province, setProvince] = useState('')
  const [year, setYear] = useState<ReportYear>(2025)
  const [comparison, setComparison] = useState<Education | ''>('')
  const snapshot = snapshots[year]

  function reset() {
    setProvince('')
    setYear(2025)
    setComparison('')
  }

  return <>
    <DashboardHeader />
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Filters and insights">
        <FilterSidebar province={province} setProvince={setProvince} year={year} setYear={setYear} reset={reset} />
        <KeyInsight snapshot={snapshot} />
      </aside>
      <div className="dashboard-main">
        <KpiRow snapshot={snapshot} />
        <div className="middle-row">
          <TrendChart province={province} reportYear={year} comparison={comparison} setComparison={setComparison} />
          <ProvinceChoropleth snapshot={snapshot} selected={province} select={setProvince} />
        </div>
        <div className="bottom-row">
          <UnemploymentCompositionChart snapshot={snapshot} />
          <WageByEducationChart snapshot={snapshot} />
          <ProvincialScatterChart snapshot={snapshot} selected={province} select={setProvince} />
        </div>
      </div>
    </main>
  </>
}
