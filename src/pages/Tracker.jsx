import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import * as db from '../lib/db'
import { supabase } from '../lib/supabase'
import {
  C, PLX, MON, STATUSES, STATUS_CFG, PHASES, PHASE_COLORS, PHASE_BG,
  DELAY, SPACE_COLORS, uid, getDelay, fmtDate, fmtShort, urgencySort,
} from '../lib/tokens'

// ─── Micro components ──────────────────────────────────────────
const Tag = ({ children, bg = '#e0e0e0', tx = C.textPri }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 8px', borderRadius: 24, background: bg, color: tx, fontSize: 12, fontWeight: 400, fontFamily: PLX, letterSpacing: '0.32px', whiteSpace: 'nowrap' }}>{children}</span>
)
const PhaseTag = ({ ph }) => <Tag bg={PHASE_BG[ph]} tx={PHASE_COLORS[ph]}>{PHASES[ph]}</Tag>
const DelayBadge = ({ task }) => {
  const i = getDelay(task)
  if (i.st === 'done') return <Tag bg="#defbe6" tx="#0e6027">Done</Tag>
  if (i.st === 'overdue') return <Tag bg="#fff1f1" tx="#da1e28">{i.d}d overdue</Tag>
  if (i.st === 'warning') return <Tag bg="#fdf6dd" tx="#8e6a00">Due in {i.d}d</Tag>
  return <span style={{ fontSize: 12, color: C.textSec, fontFamily: MON }}>{i.d}d</span>
}
const StatusDot = ({ status }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CFG[status]?.color }} /><span style={{ fontSize: 14, color: C.textSec }}>{STATUS_CFG[status]?.label}</span></span>

// ─── Sidebar ───────────────────────────────────────────────────
function SideNav({ tasks, spaces, folders, sel, onSel, col, onTog, onAddSpace, onAddFolder, onNavigateAdmin }) {
  const { profile, signOut } = useAuth()
  const [addingSpace, setAS] = useState(false)
  const [addingFolder, setAF] = useState(null)
  const [name, setName] = useState('')
  const ct = useMemo(() => {
    const c = {}; tasks.forEach(t => { c[t.space_id] = (c[t.space_id] || 0) + 1; c[t.folder_id] = (c[t.folder_id] || 0) + 1 }); return c
  }, [tasks])
  const isA = (ty, id) => sel.type === ty && sel.id === id

  const navBtn = (active, label, onClick, extra) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 32, padding: '0 16px', border: 'none', cursor: 'pointer', fontFamily: PLX, fontSize: 14, fontWeight: active ? 600 : 400, letterSpacing: '0.16px', background: active ? C.g100hover : 'transparent', color: active ? C.g100text : C.g100textSc, transition: 'background 0.1s' }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.g100hover }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? C.g100hover : 'transparent' }}>
      <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {extra}
    </button>
  )

  const inlineAdd = (placeholder, onSubmit, onCancel) => (
    <div style={{ padding: '4px 16px', display: 'flex', gap: 4 }}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSubmit(name.trim()); setName('') } if (e.key === 'Escape') onCancel() }}
        placeholder={placeholder}
        style={{ flex: 1, height: 28, padding: '0 8px', background: C.g100layer, border: `1px solid ${C.g100border}`, color: C.g100text, fontSize: 12, fontFamily: PLX, outline: 'none', minWidth: 0 }}
      />
      <button onClick={() => { if (name.trim()) { onSubmit(name.trim()); setName('') } }} style={{ height: 28, padding: '0 8px', background: C.interactive, color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: PLX }}>Add</button>
    </div>
  )

  return (
    <div style={{ width: 256, minWidth: 256, background: C.g100bg, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontFamily: PLX }}>
      <div style={{ height: 48, padding: '0 16px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.g100border}` }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.g100text }}>Games Delivery</span>
      </div>

      {/* User */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.g100border}` }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.interactive, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: PLX, flexShrink: 0 }}>
          {(profile?.display_name || 'U').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: C.g100text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.display_name || 'User'}</div>
          <div style={{ fontSize: 12, color: C.g100textPl }}>{profile?.role}</div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ padding: '4px 0' }}>
        {profile?.role === 'admin' && (
          <button onClick={onNavigateAdmin} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 32, padding: '0 16px', border: 'none', cursor: 'pointer', background: 'transparent', color: C.g100textSc, fontSize: 12, fontFamily: PLX, letterSpacing: '0.16px' }} onMouseEnter={e => e.currentTarget.style.background = C.g100hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            ⚙ Admin panel
          </button>
        )}
      </div>

      <div style={{ padding: '4px 0' }}>
        {navBtn(isA('all', null), 'All games', () => onSel({ type: 'all', id: null }),
          <span style={{ fontSize: 12, fontFamily: MON, color: C.g100textPl }}>{tasks.length}</span>
        )}
      </div>
      <div style={{ height: 1, background: C.g100border, margin: '0 16px' }} />

      {/* Spaces & folders */}
      <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {spaces.map(sp => {
          const flds = folders.filter(f => f.space_id === sp.id); const exp = !col[sp.id]
          const ov = tasks.filter(t => t.space_id === sp.id && getDelay(t).st === 'overdue').length
          return (
            <div key={sp.id}>
              <div style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 16px', gap: 8 }}>
                <button onClick={() => onTog(sp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.g100textSc, fontSize: 10, padding: 0 }}>
                  <span style={{ transform: exp ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
                </button>
                <button onClick={() => onSel({ type: 'space', id: sp.id })} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: sp.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: isA('space', sp.id) ? 600 : 400, color: isA('space', sp.id) ? C.g100text : C.g100textSc, fontFamily: PLX }}>{sp.name}</span>
                </button>
                {ov > 0 && <span style={{ fontSize: 12, fontFamily: MON, color: C.danger, fontWeight: 600 }}>{ov}</span>}
                <span style={{ fontSize: 12, fontFamily: MON, color: C.g100textPl }}>{ct[sp.id] || 0}</span>
              </div>
              {exp && <div style={{ paddingLeft: 16 }}>
                {flds.map(fl => {
                  const fA = isA('folder', fl.id); const fd = tasks.filter(t => t.folder_id === fl.id && t.status === 'done').length; const ft = tasks.filter(t => t.folder_id === fl.id).length
                  return <button key={fl.id} onClick={() => onSel({ type: 'folder', id: fl.id })} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', height: 32, padding: '0 16px', border: 'none', cursor: 'pointer', fontFamily: PLX, fontSize: 14, fontWeight: fA ? 600 : 400, background: fA ? C.g100hover : 'transparent', color: fA ? C.g100text : C.g100textSc }} onMouseEnter={e => { if (!fA) e.currentTarget.style.background = C.g100hover }} onMouseLeave={e => { if (!fA) e.currentTarget.style.background = fA ? C.g100hover : 'transparent' }}>
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fl.name}</span>
                    <span style={{ fontSize: 12, fontFamily: MON, color: C.g100textPl }}>{fd}/{ft}</span>
                  </button>
                })}
                {addingFolder === sp.id
                  ? inlineAdd('Folder name', n => { onAddFolder(sp.id, n); setAF(null) }, () => setAF(null))
                  : <button onClick={() => setAF(sp.id)} style={{ width: '100%', height: 28, padding: '0 16px', border: 'none', cursor: 'pointer', background: 'transparent', color: C.g100textPl, fontSize: 12, fontFamily: PLX, textAlign: 'left' }}>+ Add folder</button>
                }
              </div>}
            </div>
          )
        })}
        <div style={{ padding: '4px 16px', marginTop: 4 }}>
          {addingSpace
            ? inlineAdd('Project name', n => { onAddSpace(n); setAS(false) }, () => setAS(false))
            : <button onClick={() => setAS(true)} style={{ width: '100%', height: 32, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent', color: C.g100textPl, fontSize: 14, fontFamily: PLX, textAlign: 'left' }}>+ New project</button>
          }
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.g100border}` }}>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.g100textPl, fontSize: 12, fontFamily: PLX, cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  )
}

// ─── Tabs ──────────────────────────────────────────────────────
const Tabs = ({ tabs, active, onSet }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${C.borderSub}` }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onSet(t.key)} style={{ height: 40, padding: '0 16px', border: 'none', borderBottom: active === t.key ? `2px solid ${C.interactive}` : '2px solid transparent', marginBottom: -2, background: 'transparent', color: active === t.key ? C.textPri : C.textSec, fontSize: 14, fontWeight: active === t.key ? 600 : 400, fontFamily: PLX, cursor: 'pointer', letterSpacing: '0.16px' }} onMouseEnter={e => { if (active !== t.key) e.currentTarget.style.background = C.hoverUI }} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {t.label}
      </button>
    ))}
  </div>
)

// ─── List View ─────────────────────────────────────────────────
function ListView({ tasks, onEdit, folders }) {
  const [sk, sSk] = useState('due_date'); const [sa, sSa] = useState(true)
  const sorted = useMemo(() => [...tasks].sort((a, b) => {
    let c = 0
    if (sk === 'due_date') c = new Date(a.due_date) - new Date(b.due_date)
    else if (sk === 'assignee') c = a.assignee.localeCompare(b.assignee)
    else if (sk === 'status') c = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)
    else if (sk === 'delay') { const o = { overdue: 0, warning: 1, onTrack: 2, done: 3 }; c = o[getDelay(a).st] - o[getDelay(b).st] }
    else if (sk === 'game') c = (a.folder_id || '').localeCompare(b.folder_id || '')
    return sa ? c : -c
  }), [tasks, sk, sa])
  const ds = k => { if (sk === k) sSa(!sa); else { sSk(k); sSa(true) } }
  const TH = ({ l, k, w }) => (
    <th onClick={() => ds(k)} style={{ width: w, height: 48, padding: '0 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: C.textPri, fontFamily: PLX, cursor: 'pointer', borderBottom: `1px solid ${C.borderSub}`, background: C.layer01, whiteSpace: 'nowrap' }}>
      {l}{sk === k ? <span style={{ marginLeft: 4, fontSize: 12 }}>{sa ? '↑' : '↓'}</span> : ''}
    </th>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: PLX, fontSize: 14 }}>
        <thead><tr>
          <TH l="Status" k="status" w={100} />
          <th style={{ padding: '0 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: C.textPri, fontFamily: PLX, borderBottom: `1px solid ${C.borderSub}`, background: C.layer01, height: 48 }}>Milestone</th>
          <TH l="Game" k="game" w={160} />
          <TH l="Phase" k="due_date" w={120} />
          <TH l="Assignee" k="assignee" w={120} />
          <TH l="Due date" k="due_date" w={120} />
          <TH l="Status" k="delay" w={120} />
        </tr></thead>
        <tbody>{sorted.map((t, idx) => {
          const i = getDelay(t); const fl = folders.find(f => f.id === t.folder_id)
          return (
            <tr key={t.id} onClick={() => onEdit(t)} style={{ borderBottom: `1px solid ${C.borderSub}`, background: i.st === 'overdue' ? '#fff1f1' : idx % 2 === 0 ? 'transparent' : C.layer01, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = C.hoverUI} onMouseLeave={e => e.currentTarget.style.background = i.st === 'overdue' ? '#fff1f1' : idx % 2 === 0 ? 'transparent' : C.layer01}>
              <td style={{ padding: '12px 16px' }}><StatusDot status={t.status} /></td>
              <td style={{ padding: '12px 16px', fontWeight: 400, color: i.st === 'done' ? C.textPlc : C.textPri }}>
                {t.title}
                {t.notes && <span style={{ marginLeft: 8, fontSize: 12, color: C.textHlp, fontStyle: 'italic' }}>{t.notes}</span>}
              </td>
              <td style={{ padding: '12px 16px', color: C.textSec }}>{fl?.name}</td>
              <td style={{ padding: '12px 16px' }}><PhaseTag ph={t.phase} /></td>
              <td style={{ padding: '12px 16px', color: C.textSec }}>{t.assignee}</td>
              <td style={{ padding: '12px 16px', fontFamily: MON, fontSize: 12, color: C.textSec }}>{fmtDate(t.due_date)}</td>
              <td style={{ padding: '12px 16px' }}><DelayBadge task={t} /></td>
            </tr>
          )
        })}</tbody>
      </table>
    </div>
  )
}

// ─── Kanban View ───────────────────────────────────────────────
function KanbanView({ tasks, onEdit, onSC }) {
  const cols = useMemo(() => STATUSES.map(s => ({ s, cfg: STATUS_CFG[s], t: tasks.filter(t => t.status === s).sort(urgencySort) })), [tasks])
  const hD = useCallback((e, ns) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onSC(id, ns) }, [onSC])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: C.borderSub, border: `1px solid ${C.borderSub}` }}>
      {cols.map(({ s, cfg, t: ct }) => (
        <div key={s} onDragOver={e => e.preventDefault()} onDrop={e => hD(e, s)} style={{ background: C.bgUi, minHeight: 300 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: 8, background: C.layer01 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.textPri, fontFamily: PLX }}>{cfg.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontFamily: MON, color: C.textHlp }}>{ct.length}</span>
          </div>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ct.map(t => { const info = getDelay(t); const dl = DELAY[info.st]; return (
              <div key={t.id} onClick={() => onEdit(t)} draggable onDragStart={e => e.dataTransfer.setData('text/plain', t.id)} style={{ background: C.bgUi, border: `1px solid ${C.borderSub}`, borderLeft: `3px solid ${dl.bd}`, padding: '12px 16px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = C.hoverUI} onMouseLeave={e => e.currentTarget.style.background = C.bgUi}>
                <div style={{ fontSize: 14, color: C.textPri, marginBottom: 8, lineHeight: '20px', fontFamily: PLX }}>{t.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <PhaseTag ph={t.phase} /><DelayBadge task={t} />
                </div>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: C.textSec }}>{t.assignee}</span>
                  <span style={{ fontSize: 12, fontFamily: MON, color: C.textPlc }}>{fmtShort(t.due_date)}</span>
                </div>
              </div>
            ) })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Timeline View ─────────────────────────────────────────────
function TimelineView({ tasks, folders, spaces }) {
  const d = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const mn = new Date('2025-09-01T00:00:00'), mx = new Date('2027-04-01T00:00:00')
    const td = Math.ceil((mx - mn) / 864e5)
    const gr = {}
    tasks.forEach(t => {
      const fl = folders.find(f => f.id === t.folder_id); const sp = spaces.find(s => s.id === t.space_id)
      const k = `${sp?.name || '?'} / ${fl?.name || '?'}`
      if (!gr[k]) gr[k] = { c: sp?.color || C.interactive, t: [] }; gr[k].t.push(t)
    })
    Object.values(gr).forEach(g => g.t.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)))
    const ms = []; let dt = new Date(mn); dt.setDate(1)
    while (dt <= mx) { const o = Math.floor((dt - mn) / 864e5); if (o >= 0) ms.push({ l: dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), o }); dt.setMonth(dt.getMonth() + 1) }
    return { mn, td, gr, ms, to: Math.floor((now - mn) / 864e5) }
  }, [tasks, folders, spaces])
  const p = v => `${(v / d.td) * 100}%`
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${C.borderSub}` }}>
      <div style={{ minWidth: 1200, position: 'relative' }}>
        <div style={{ display: 'flex', marginLeft: 220, height: 32, borderBottom: `1px solid ${C.borderSub}`, background: C.layer01, position: 'relative', alignItems: 'center' }}>
          {d.ms.map((m, i) => <div key={i} style={{ position: 'absolute', left: p(m.o), fontSize: 12, fontFamily: MON, color: C.textSec }}>{m.l}</div>)}
        </div>
        <div style={{ position: 'absolute', left: `calc(220px + ${p(d.to)})`, top: 0, bottom: 0, width: 2, background: C.danger, opacity: .3, zIndex: 1 }} />
        {Object.entries(d.gr).map(([nm, { c, t: gt }]) => (
          <div key={nm}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${C.borderSub}`, background: C.layer01 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textPri, fontFamily: PLX }}>{nm}</span>
            </div>
            {gt.map(t => {
              const info = getDelay(t); const du = new Date(t.due_date + 'T00:00:00')
              const st = t.start_date ? new Date(t.start_date + 'T00:00:00') : new Date(du.getTime() - 14 * 864e5)
              const sO = Math.max(0, Math.floor((st - d.mn) / 864e5)); const eO = Math.floor((du - d.mn) / 864e5)
              const l = Math.max(0, sO); const r = Math.max(l + 2, eO)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', height: 32, borderBottom: `1px solid ${C.borderSub}` }} onMouseEnter={e => e.currentTarget.style.background = C.hoverUI} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 220, flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: PHASE_COLORS[t.phase], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.textSec, fontFamily: PLX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    <div style={{ position: 'absolute', top: 9, height: 14, background: DELAY[info.st].bd, opacity: info.st === 'done' ? .2 : .6, left: p(l), width: p(r - l), minWidth: 8 }} />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Task Modal ────────────────────────────────────────────────
function TaskModal({ task, sel, spaces, folders, assignees, onSave, onClose, onDel }) {
  const df = sel.type === 'folder' ? sel.id : folders[0]?.id || ''
  const dsp = folders.find(f => f.id === df)?.space_id || spaces[0]?.id || ''
  const [fm, sF] = useState(task || { title: '', space_id: dsp, folder_id: df, assignee: assignees[0] || 'PM', status: 'todo', due_date: '2026-06-01', phase: 'dev', duration: '', notes: '' })
  const isE = !!task; const s = (k, v) => sF(f => ({ ...f, [k]: v }))
  const sf = folders.filter(f => f.space_id === fm.space_id)

  const inp = { height: 40, padding: '0 16px', border: 'none', borderBottom: `1px solid ${C.borderStr}`, background: C.layer01, fontSize: 14, fontFamily: PLX, color: C.textPri, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: C.textSec, letterSpacing: '0.32px', display: 'block', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.overlay }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: C.bgUi, width: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: C.textPri, fontFamily: PLX }}>{isE ? 'Edit milestone' : 'New milestone'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.textSec, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div><label style={lbl}>Title</label><input value={fm.title} onChange={e => s('title', e.target.value)} placeholder="Milestone name" style={inp} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>Project</label><select value={fm.space_id} onChange={e => { s('space_id', e.target.value); const ff = folders.find(f => f.space_id === e.target.value); if (ff) s('folder_id', ff.id) }} style={{ ...inp, cursor: 'pointer' }}>{spaces.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
            <div><label style={lbl}>Game / Folder</label><select value={fm.folder_id} onChange={e => s('folder_id', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{sf.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>Phase</label><select value={fm.phase} onChange={e => s('phase', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{Object.entries(PHASES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label style={lbl}>Status</label><select value={fm.status} onChange={e => s('status', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{STATUSES.map(x => <option key={x} value={x}>{STATUS_CFG[x].label}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>Due date</label><input type="date" value={fm.due_date} onChange={e => s('due_date', e.target.value)} style={{ ...inp, fontFamily: MON, fontSize: 12 }} /></div>
            <div><label style={lbl}>Assignee</label><select value={fm.assignee} onChange={e => s('assignee', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{assignees.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label style={lbl}>Notes</label><input value={fm.notes || ''} onChange={e => s('notes', e.target.value)} placeholder="Optional" style={inp} /></div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.borderSub}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {isE && <button onClick={() => { onDel(task.id); onClose() }} style={{ height: 40, padding: '0 16px', border: 'none', background: C.danger, color: '#fff', fontSize: 14, fontFamily: PLX, cursor: 'pointer', marginRight: 'auto' }}>Delete</button>}
          <button onClick={onClose} style={{ height: 40, padding: '0 16px', border: 'none', background: 'transparent', color: C.interactive, fontSize: 14, fontFamily: PLX, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (!fm.title.trim()) return; onSave({ ...fm, id: fm.id || uid() }); onClose() }} disabled={!fm.title.trim()} style={{ height: 40, padding: '0 24px', border: 'none', background: fm.title.trim() ? C.interactive : '#c6c6c6', color: '#fff', fontSize: 14, fontFamily: PLX, cursor: fm.title.trim() ? 'pointer' : 'not-allowed' }}>
            {isE ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN TRACKER ──────────────────────────────────────────────
export default function Tracker() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [spaces, setSpaces] = useState([])
  const [folders, setFolders] = useState([])
  const [view, setView] = useState('list')
  const [sel, setSel] = useState({ type: 'all', id: null })
  const [col, setCol] = useState({})
  const [fPh, setFPh] = useState([])
  const [mt, setMt] = useState(null)
  const [sm, setSm] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const loadData = useCallback(async () => {
    setLoadError(false)
    setLoaded(false)
    try {
      const [sp, fl, ts] = await Promise.all([db.fetchSpaces(), db.fetchFolders(), db.fetchTasks()])
      if (sp.length) setSpaces(sp)
      if (fl.length) setFolders(fl)
      if (ts.length) setTasks(ts)
      setLoaded(true)
    } catch (err) {
      console.error('Failed to load data:', err)
      setLoadError(true)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const assignees = useMemo(() => {
    const s = new Set(tasks.map(t => t.assignee))
    if (profile) s.add(profile.display_name)
    ;['PM', 'Client', 'PM, Client'].forEach(x => s.add(x))
    return [...s].sort()
  }, [tasks, profile])

  const tSp = useCallback(id => setCol(c => ({ ...c, [id]: !c[id] })), [])

  const addSpace = useCallback(async name => {
    const color = SPACE_COLORS[spaces.length % SPACE_COLORS.length]
    if (supabase) {
      const s = await db.createSpace({ name, color })
      if (s) setSpaces(p => [...p, s])
    } else {
      setSpaces(p => [...p, { id: uid(), name, color }])
    }
  }, [spaces.length])

  const addFolder = useCallback(async (spaceId, name) => {
    if (supabase) {
      const f = await db.createFolder({ name, space_id: spaceId })
      if (f) setFolders(p => [...p, f])
    } else {
      setFolders(p => [...p, { id: uid(), name, space_id: spaceId }])
    }
  }, [])

  const filt = useMemo(() => {
    let o = tasks
    if (sel.type === 'space') o = o.filter(t => t.space_id === sel.id)
    else if (sel.type === 'folder') o = o.filter(t => t.folder_id === sel.id)
    if (fPh.length) o = o.filter(t => fPh.includes(t.phase))
    return o
  }, [tasks, sel, fPh])

  const hSave = useCallback(async task => {
    const existing = tasks.find(t => t.id === task.id)
    if (supabase && existing) {
      const { id, ...updates } = task
      const updated = await db.updateTask(id, updates)
      if (updated) setTasks(p => p.map(t => t.id === id ? updated : t))
    } else if (supabase && !existing) {
      const { id: _id, ...rest } = task // let Supabase generate UUID
      const created = await db.createTask(rest)
      if (created) setTasks(p => [...p, created])
    } else {
      setTasks(p => { const i = p.findIndex(t => t.id === task.id); if (i >= 0) { const n = [...p]; n[i] = task; return n } return [...p, task] })
    }
  }, [tasks])

  const hDel = useCallback(async id => {
    if (supabase) await db.deleteTask(id)
    setTasks(p => p.filter(t => t.id !== id))
  }, [])

  const hSC = useCallback(async (id, ns) => {
    if (supabase) await db.updateTask(id, { status: ns })
    setTasks(p => p.map(t => t.id === id ? { ...t, status: ns } : t))
  }, [])

  const bc = useMemo(() => {
    if (sel.type === 'all') return 'All games'
    if (sel.type === 'space') return spaces.find(s => s.id === sel.id)?.name || ''
    if (sel.type === 'folder') { const f = folders.find(fl => fl.id === sel.id); const s = spaces.find(sp => sp.id === f?.space_id); return `${s?.name || ''} / ${f?.name || ''}` }
    return ''
  }, [sel, spaces, folders])

  const stats = useMemo(() => {
    const o = filt.filter(t => getDelay(t).st === 'overdue').length
    const w = filt.filter(t => getDelay(t).st === 'warning').length
    const d = filt.filter(t => t.status === 'done').length
    return { o, w, d, t: filt.length }
  }, [filt])

  if (loadError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: PLX, color: C.textSec, gap: 16 }}>
      <div>無法連接到伺服器，請稍後再試</div>
      <button onClick={loadData} style={{ padding: '8px 24px', background: C.interactive, color: '#fff', border: 'none', borderRadius: 4, fontFamily: PLX, fontSize: 14, cursor: 'pointer' }}>重試</button>
    </div>
  )
  if (!loaded) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: PLX, color: C.textSec }}>連接中，請稍候…</div>

  const tabs = [{ key: 'list', label: 'List' }, { key: 'kanban', label: 'Board' }, { key: 'timeline', label: 'Timeline' }]

  return (
    <div style={{ fontFamily: PLX, display: 'flex', height: '100vh', background: C.bgUi, color: C.textPri }}>
      <SideNav tasks={tasks} spaces={spaces} folders={folders} sel={sel} onSel={setSel} col={col} onTog={tSp} onAddSpace={addSpace} onAddFolder={addFolder} onNavigateAdmin={() => navigate('/admin')} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 32px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: C.textPri, fontFamily: PLX }}>{bc}</h1>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                {stats.o > 0 && <span style={{ fontSize: 12, color: C.danger }}>{stats.o} overdue</span>}
                {stats.w > 0 && <span style={{ fontSize: 12, color: '#8e6a00' }}>{stats.w} due soon</span>}
                <span style={{ fontSize: 12, color: C.textHlp }}>{stats.d} of {stats.t} complete</span>
              </div>
            </div>
            <button onClick={() => { setMt(null); setSm(true) }} style={{ height: 40, padding: '0 24px', border: 'none', background: C.interactive, color: '#fff', fontSize: 14, fontFamily: PLX, cursor: 'pointer' }}>+ New milestone</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {Object.entries(PHASES).map(([k, v]) => {
              const active = fPh.includes(k)
              return <button key={k} onClick={() => setFPh(pr => pr.includes(k) ? pr.filter(x => x !== k) : [...pr, k])} style={{ height: 24, padding: '0 8px', borderRadius: 24, border: `1px solid ${active ? PHASE_COLORS[k] : C.borderStr}`, background: active ? PHASE_BG[k] : 'transparent', color: active ? PHASE_COLORS[k] : C.textSec, fontSize: 12, fontFamily: PLX, cursor: 'pointer' }}>{v}</button>
            })}
            {fPh.length > 0 && <button onClick={() => setFPh([])} style={{ height: 24, padding: '0 8px', border: 'none', background: 'transparent', color: C.interactive, fontSize: 12, fontFamily: PLX, cursor: 'pointer' }}>Clear</button>}
          </div>

          <Tabs tabs={tabs} active={view} onSet={setView} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 32px' }}>
          {view === 'list' && <ListView tasks={filt} onEdit={t => { setMt(t); setSm(true) }} folders={folders} />}
          {view === 'kanban' && <KanbanView tasks={filt} onEdit={t => { setMt(t); setSm(true) }} onSC={hSC} />}
          {view === 'timeline' && <TimelineView tasks={filt} folders={folders} spaces={spaces} />}
        </div>
      </div>

      {sm && <TaskModal task={mt} sel={sel} spaces={spaces} folders={folders} assignees={assignees} onSave={hSave} onClose={() => setSm(false)} onDel={hDel} />}
    </div>
  )
}
