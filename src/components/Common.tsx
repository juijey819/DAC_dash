import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, SVGProps } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function PanelHeading({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return <div className="panel-heading"><Icon aria-hidden="true" /><h2>{title}</h2>{children}</div>
}

export function InfoPopover({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const anchor = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  function show() {
    const element = dialog.current
    const button = anchor.current
    if (!element || !button) return
    const bounds = button.getBoundingClientRect()
    const right = Math.max(12, Math.min(window.innerWidth - bounds.right, window.innerWidth - 442))
    element.style.setProperty('--info-right', right + 'px')
    element.style.setProperty('--info-top', Math.min(bounds.bottom + 8, window.innerHeight - 200) + 'px')
    element.showModal()
    setOpen(true)
  }

  return <>
    <button ref={anchor} className="icon-button info-button" type="button" onClick={show} aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={id}>
      <Info size={21} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className="info-popover" id={id} aria-labelledby={id + '-title'}
      onClose={() => { setOpen(false); anchor.current?.focus() }}
      onClick={event => {
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.target === event.currentTarget &&
            (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) event.currentTarget.close()
      }}>
      <div className="info-title">
        <h2 id={id + '-title'}>{label}</h2>
        <button className="icon-button" type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close information"><X size={19} aria-hidden="true" /></button>
      </div>
      {children}
    </dialog>
  </>
}

export type Tip = { title: string; rows: { label: string; value: string; note?: string }[]; note?: string }

export function useTooltip() {
  const [active, setActive] = useState<{ x: number; y: number; tip: Tip } | null>(null)
  const element = useRef<HTMLDivElement>(null)

  function show(target: Element, tip: Tip, point?: { x: number; y: number }) {
    const bounds = target.getBoundingClientRect()
    setActive({ x: point?.x ?? bounds.x + bounds.width / 2, y: point?.y ?? bounds.y + bounds.height / 2, tip })
  }

  const hide = () => setActive(null)

  useEffect(() => {
    if (!active) return
    function dismiss(event: Event) {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && event.target instanceof Element && event.target.closest('.chart-mark, .bar-item')) return
      setActive(null)
    }
    window.addEventListener('keydown', dismiss)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('pointerdown', dismiss)
    return () => {
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('pointerdown', dismiss)
    }
  }, [active])

  useLayoutEffect(() => {
    if (!active || !element.current) return
    const { width, height } = element.current.getBoundingClientRect()
    const offset = 13
    const left = active.x + offset + width < window.innerWidth - 8 ? active.x + offset : active.x - width - offset
    const top = active.y - height - offset > 8 ? active.y - height - offset : active.y + offset
    element.current.style.left = Math.max(8, Math.min(left, window.innerWidth - width - 8)) + 'px'
    element.current.style.top = Math.max(8, Math.min(top, window.innerHeight - height - 8)) + 'px'
  }, [active])

  return {
    show,
    hide,
    tooltip: active && createPortal(<div className="chart-tooltip" role="tooltip" ref={element}>
      <strong>{active.tip.title}</strong>
      <dl>{active.tip.rows.map(row => <div key={row.label}>
        <dt>{row.label}{row.note && <small>{row.note}</small>}</dt><dd>{row.value}</dd>
      </div>)}</dl>
      {active.tip.note && <p>{active.tip.note}</p>}
    </div>, document.body),
  }
}

export function chartMark(tip: Tip, tooltip: ReturnType<typeof useTooltip>, select?: () => void): Omit<SVGProps<SVGElement>, 'ref'> {
  return {
    tabIndex: 0,
    role: select ? 'button' : 'img',
    'aria-label': [tip.title, ...tip.rows.map(row => row.label + ' ' + row.value), tip.note].filter(Boolean).join('. '),
    onPointerEnter: event => {
      if (event.pointerType !== 'touch') tooltip.show(event.currentTarget, tip, { x: event.clientX, y: event.clientY })
    },
    onPointerMove: event => {
      if (event.pointerType === 'mouse' && event.currentTarget.classList.contains('province-mark')) tooltip.show(event.currentTarget, tip, { x: event.clientX, y: event.clientY })
    },
    onPointerLeave: event => { if (event.pointerType !== 'touch') tooltip.hide() },
    onFocus: event => tooltip.show(event.currentTarget, tip),
    onBlur: tooltip.hide,
    onClick: event => {
      select?.()
      tooltip.show(event.currentTarget, tip, { x: event.clientX, y: event.clientY })
    },
    onKeyDown: event => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      select?.()
      tooltip.show(event.currentTarget, tip)
    },
  }
}

export function usePlotSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, ...size }
}
