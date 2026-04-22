// IBM Carbon Design System — White theme tokens
export const C = {
  bgUi:       '#ffffff',
  layer01:    '#f4f4f4',
  layer02:    '#ffffff',
  borderSub:  '#e0e0e0',
  borderStr:  '#c6c6c6',
  textPri:    '#161616',
  textSec:    '#525252',
  textPlc:    '#a8a8a8',
  textHlp:    '#6f6f6f',
  textOnCol:  '#ffffff',
  interactive:'#0f62fe',
  hoverPri:   '#0353e9',
  danger:     '#da1e28',
  success:    '#198038',
  warning:    '#f1c21b',
  hoverUI:    '#e8e8e8',
  selUI:      '#e0e0e0',
  overlay:    'rgba(22,22,22,.5)',
  focus:      '#0f62fe',
  // g100 sidebar
  g100bg:     '#161616',
  g100layer:  '#262626',
  g100hover:  '#353535',
  g100border: '#393939',
  g100text:   '#f4f4f4',
  g100textSc: '#c6c6c6',
  g100textPl: '#6f6f6f',
}

export const PLX = "'IBM Plex Sans','Noto Sans TC',sans-serif"
export const MON = "'IBM Plex Mono',monospace"

export const STATUSES = ['todo', 'in-progress', 'review', 'done']
export const STATUS_CFG = {
  todo:          { label: 'To Do',       color: '#525252', icon: '○' },
  'in-progress': { label: 'In Progress', color: '#0f62fe', icon: '◐' },
  review:        { label: 'Review',      color: '#6929c4', icon: '◑' },
  done:          { label: 'Done',        color: '#198038', icon: '●' },
}

export const PHASES = { dev: 'Development', delivery: 'Delivery', post: 'Post-Delivery', launch: 'Launch' }
export const PHASE_COLORS = { dev: '#6929c4', delivery: '#1192e8', post: '#005d5d', launch: '#9f1853' }
export const PHASE_BG    = { dev: '#e8daff', delivery: '#d0e2ff', post: '#a7f0ba', launch: '#ffd6e8' }

export const DELAY = {
  overdue: { bg: '#fff1f1', bd: '#da1e28', tx: '#750e13' },
  warning: { bg: '#fdf6dd', bd: '#8e6a00', tx: '#8e6a00' },
  onTrack: { bg: '#f4f4f4', bd: '#c6c6c6', tx: '#525252' },
  done:    { bg: '#f4f4f4', bd: '#e0e0e0', tx: '#a8a8a8' },
}

export const SPACE_COLORS = [
  '#0f62fe','#0e6027','#6929c4','#b28600',
  '#da1e28','#1192e8','#9f1853','#005d5d',
]

// ─── Helpers ───────────────────────────────────────────────────
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function getDelay(t) {
  if (t.status === 'done') return { st: 'done', d: 0 }
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(t.due_date + 'T00:00:00')
  const diff = Math.floor((due - now) / 864e5)
  if (diff < 0) return { st: 'overdue', d: Math.abs(diff) }
  if (diff <= 7) return { st: 'warning', d: diff }
  return { st: 'onTrack', d: diff }
}

export function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtShort(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function urgencySort(a, b) {
  const ia = getDelay(a), ib = getDelay(b)
  const o = { overdue: 0, warning: 1, onTrack: 2, done: 3 }
  if (o[ia.st] !== o[ib.st]) return o[ia.st] - o[ib.st]
  if (ia.st === 'overdue') return ib.d - ia.d
  return new Date(a.due_date) - new Date(b.due_date)
}
