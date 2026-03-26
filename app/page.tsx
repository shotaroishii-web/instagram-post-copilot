'use client'

import { useState, useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────
type Mode = 'MORNING_MISSION' | 'NIGHT_WATCH' | 'EMERGENCY_CALL' | 'HOME_NURSING'
type ChildLevel = 'ANGEL' | 'MOODY' | 'DEMON'

interface Task          { id: string; text: string; checked: boolean }
interface CalendarEvent { id: string; date: string; text: string }
interface NewsItem      { title: string; link: string; pubDate: string }
interface Stats {
  demonCount: number
  completedQuests: number
  modeUsage: Record<Mode, number>
}

// ── Constants ─────────────────────────────────────────────────────────
const MODES = [
  { id: 'MORNING_MISSION' as Mode, label: '朝の部',    tag: '通常', accent: '#3B82F6', accentBg: '#EFF6FF' },
  { id: 'NIGHT_WATCH'     as Mode, label: '夜の部',    tag: '通常', accent: '#F97316', accentBg: '#FFF7ED' },
  { id: 'EMERGENCY_CALL'  as Mode, label: 'お迎え要請', tag: '緊急', accent: '#EF4444', accentBg: '#FEF2F2' },
  { id: 'HOME_NURSING'    as Mode, label: '病児欠勤',  tag: '停戦', accent: '#10B981', accentBg: '#ECFDF5' },
]

const DEFAULT_TASKS: Record<Mode, string[]> = {
  MORNING_MISSION: ['検温', '連絡帳記入', '着替え確認', '朝食', '持ち物チェック', '出発時間確認'],
  NIGHT_WATCH:     ['お風呂', '歯磨き', '明日の準備', '検温', '寝かしつけ'],
  EMERGENCY_CALL:  ['職場に連絡', '保育園/学校に連絡', '受診セット準備', '診察券・保険証確認', '病院に電話'],
  HOME_NURSING:    ['職場に連絡', '保育園/学校に欠席連絡', '症状メモ', '薬の準備', '水分補給確認'],
}

const COMPLETION: Record<Mode, { main: string; sub: string }> = {
  MORNING_MISSION: { main: '爆速で出社せよ',           sub: 'よく戦った。行ってらっしゃい。' },
  NIGHT_WATCH:     { main: '大人の自由時間の開幕だ',   sub: '静かな夜を楽しめ。よく戦った。' },
  EMERGENCY_CALL:  { main: '今すぐ向かえ',             sub: 'よく動いた。子供が待っている。' },
  HOME_NURSING:    { main: '今日は休め。それが仕事だ', sub: '無理をするな。回復が最優先。' },
}

const CHILD_CONDITIONS = [
  { id: 'ANGEL' as ChildLevel, label: '天使',   level: 'Lv.1',  emoji: '😇' },
  { id: 'MOODY' as ChildLevel, label: '不機嫌', level: 'Lv.50', emoji: '😤' },
  { id: 'DEMON' as ChildLevel, label: '魔王',   level: 'Lv.99', emoji: '👿' },
]

const STOP_WORDS = new Set([
  'これ','この','その','あの','だ','です','ます','した','する','いる','いた',
  'ある','なる','から','まで','こと','ため','もの','など','について','による',
  'という','として','での','への','より','また','さらに','すでに','ただ',
])

const NEWS_URL =
  'https://api.rss2json.com/v1/api.json?rss_url=' +
  encodeURIComponent('https://news.google.com/rss/search?q=子育て+保育園+時短料理&hl=ja&gl=JP&ceid=JP:ja')

const DEFAULT_STATS: Stats = {
  demonCount: 0,
  completedQuests: 0,
  modeUsage: { MORNING_MISSION: 0, NIGHT_WATCH: 0, EMERGENCY_CALL: 0, HOME_NURSING: 0 },
}

// ── Helpers ───────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const todayStr = () => new Date().toISOString().slice(0, 10)
const buildDefaults = (mode: Mode): Task[] =>
  DEFAULT_TASKS[mode].map(text => ({ id: uid(), text, checked: false }))

function extractWords(titles: string[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {}
  const raw = titles.join(' ')
  const words = raw
    .split(/[\s「」【】『』、。！？・…＝×◆▶︎／|｜\-—–()（）[\]]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && w.length <= 10 && !STOP_WORDS.has(w) && !/^[\d０-９a-zA-Z]+$/.test(w))
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1
  return Object.entries(freq)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))
}

function parseEvent(input: string): { date: string; text: string } | null {
  const yr = new Date().getFullYear()
  const patterns: [RegExp, (m: RegExpMatchArray) => { date: string; text: string }][] = [
    [/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(.+)$/, m => ({ date: `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`, text: m[4] })],
    [/^(\d{1,2})\/(\d{1,2})\s+(.+)$/,        m => ({ date: `${yr}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`, text: m[3] })],
    [/^(\d{1,2})月(\d{1,2})日\s+(.+)$/,      m => ({ date: `${yr}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`, text: m[3] })],
  ]
  for (const [pat, fn] of patterns) {
    const m = input.match(pat)
    if (m) return fn(m)
  }
  return null
}

// ── Shared style helpers ──────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  backgroundColor: 'white',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  padding: '18px 20px',
  ...extra,
})

const secTitle = (color = '#9CA3AF'): React.CSSProperties => ({
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color,
  margin: '0 0 14px 0',
})

// ═════════════════════════════════════════════════════════════════════
export default function Home() {
  const [mode, setMode]               = useState<Mode>('MORNING_MISSION')
  const [childLevel, setChildLevel]   = useState<ChildLevel>('ANGEL')
  const [tasks, setTasks]             = useState<Record<Mode, Task[]> | null>(null)
  const [newTask, setNewTask]         = useState('')
  const [showDone, setShowDone]       = useState(false)
  const [events, setEvents]           = useState<CalendarEvent[]>([])
  const [evInput, setEvInput]         = useState('')
  const [stats, setStats]             = useState<Stats>(DEFAULT_STATS)
  const [news, setNews]               = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [wordRank, setWordRank]       = useState<{ word: string; count: number }[]>([])
  const [ready, setReady]             = useState(false)
  const prevLevel                     = useRef<ChildLevel>('ANGEL')

  // ── Load localStorage ────────────────────────────────────────────
  useEffect(() => {
    try {
      const t = localStorage.getItem('ikusaba_tasks')
      const c = localStorage.getItem('ikusaba_child') as ChildLevel | null
      const e = localStorage.getItem('ikusaba_events')
      const s = localStorage.getItem('ikusaba_stats')

      if (t) { setTasks(JSON.parse(t)) }
      else {
        const init = {} as Record<Mode, Task[]>
        MODES.forEach(m => { init[m.id] = buildDefaults(m.id) })
        setTasks(init)
      }
      if (c) { setChildLevel(c); prevLevel.current = c }
      if (e) setEvents(JSON.parse(e))
      if (s) setStats({ ...DEFAULT_STATS, ...JSON.parse(s) })
    } catch {/* ignore */}
    setReady(true)
  }, [])

  useEffect(() => { if (ready && tasks) localStorage.setItem('ikusaba_tasks',  JSON.stringify(tasks))  }, [tasks, ready])
  useEffect(() => { if (ready)          localStorage.setItem('ikusaba_child',   childLevel)             }, [childLevel, ready])
  useEffect(() => { if (ready)          localStorage.setItem('ikusaba_events',  JSON.stringify(events)) }, [events, ready])
  useEffect(() => { if (ready)          localStorage.setItem('ikusaba_stats',   JSON.stringify(stats))  }, [stats, ready])

  // ── Fetch news ───────────────────────────────────────────────────
  useEffect(() => {
    fetch(NEWS_URL)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.items)) {
          const items: NewsItem[] = data.items.slice(0, 15).map((it: Record<string, string>) => ({
            title:   (it.title ?? '').replace(/ - .*$/, '').trim(),
            link:    it.link    ?? '#',
            pubDate: it.pubDate ?? '',
          }))
          setNews(items)
          setWordRank(extractWords(items.map(i => i.title)))
        }
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false))
  }, [])

  // ── Track demon appearances ──────────────────────────────────────
  useEffect(() => {
    if (!ready) return
    if (childLevel === 'DEMON' && prevLevel.current !== 'DEMON') {
      setStats(s => ({ ...s, demonCount: s.demonCount + 1 }))
    }
    prevLevel.current = childLevel
  }, [childLevel, ready])

  // ── Loading ──────────────────────────────────────────────────────
  if (!ready || !tasks) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#F1F2F4' }}>
      <p style={{ color:'#9CA3AF', fontSize:14 }}>読み込み中…</p>
    </div>
  )

  // ── Derived state ────────────────────────────────────────────────
  const cur          = MODES.find(m => m.id === mode)!
  const curTasks     = tasks[mode] ?? []
  const checked      = curTasks.filter(t => t.checked).length
  const allDone      = curTasks.length > 0 && checked === curTasks.length
  const isDemon      = childLevel === 'DEMON'
  const progress     = curTasks.length > 0 ? (checked / curTasks.length) * 100 : 0
  const upcoming     = events.filter(e => e.date >= todayStr()).slice(0, 8)
  const maxMode      = Math.max(...Object.values(stats.modeUsage), 1)
  const maxWord      = wordRank[0]?.count ?? 1

  // ── Event handlers ───────────────────────────────────────────────
  const toggle   = (id: string) => setTasks(p => ({ ...p!, [mode]: p![mode].map(t => t.id === id ? { ...t, checked: !t.checked } : t) }))
  const delTask  = (id: string) => setTasks(p => ({ ...p!, [mode]: p![mode].filter(t => t.id !== id) }))
  const addTask  = () => { const v = newTask.trim(); if (!v) return; setTasks(p => ({ ...p!, [mode]: [...p![mode], { id: uid(), text: v, checked: false }] })); setNewTask('') }
  const reset    = () => { setTasks(p => ({ ...p!, [mode]: buildDefaults(mode) })); setShowDone(false) }
  const complete = () => { setShowDone(true); setStats(s => ({ ...s, completedQuests: s.completedQuests + 1, modeUsage: { ...s.modeUsage, [mode]: s.modeUsage[mode] + 1 } })) }
  const addEvent = () => { const p = parseEvent(evInput.trim()); if (!p) return; setEvents(prev => [...prev, { id: uid(), ...p }].sort((a, b) => a.date.localeCompare(b.date))); setEvInput('') }
  const delEvent = (id: string) => setEvents(p => p.filter(e => e.id !== id))
  const switchMode = (m: Mode) => { setMode(m); setShowDone(false) }

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F1F2F4', fontFamily:"'Inter',-apple-system,'Helvetica Neue',sans-serif" }}>

      {/* Demon banner */}
      {isDemon && (
        <div className="shake-screen" style={{ backgroundColor:'#DC2626', color:'white', textAlign:'center', padding:'9px 16px', fontSize:11, fontWeight:700, letterSpacing:'0.25em' }}>
          ⚠ 戦え、親よ — 魔王出現中 ⚠
        </div>
      )}

      {/* Top bar */}
      <header style={{ backgroundColor:'white', borderBottom:'1px solid #E5E7EB', padding:'0 20px', height:50, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, backgroundColor:cur.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🛡</div>
          <span style={{ fontSize:14, fontWeight:700, color:'#111', letterSpacing:'-0.02em' }}>育児サバイバル</span>
          <span style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase' }}>Dashboard</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, fontWeight:600, color:cur.accent, backgroundColor:cur.accentBg, padding:'4px 10px', borderRadius:20 }}>
            {cur.tag} — {cur.label}
          </span>
          <span style={{ fontSize:20 }}>{CHILD_CONDITIONS.find(c => c.id === childLevel)?.emoji}</span>
        </div>
      </header>

      {/* Grid layout */}
      <div className="dash-grid" style={{ maxWidth:1380, margin:'0 auto', padding:'18px 18px 48px', display:'grid', gridTemplateColumns:'250px 1fr 250px', gap:14 }}>

        {/* ══ LEFT ══════════════════════════════════════════ */}
        <div className="dash-left" style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Mode */}
          <div style={card()}>
            <p style={secTitle()}>Status</p>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {MODES.map(m => {
                const a = mode === m.id
                return (
                  <button key={m.id} onClick={() => switchMode(m.id)} style={{ textAlign:'left', padding:'9px 12px', borderRadius:8, border:`1.5px solid ${a ? m.accent : 'transparent'}`, backgroundColor: a ? m.accentBg : '#F9FAFB', color: a ? m.accent : '#6B7280', cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4, backgroundColor: a ? m.accent : '#E5E7EB', color: a ? 'white' : '#9CA3AF', letterSpacing:'0.05em' }}>{m.tag}</span>
                    <span style={{ fontSize:13, fontWeight: a ? 700 : 500 }}>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Child condition */}
          <div style={card()}>
            <p style={secTitle()}>Child Condition</p>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {CHILD_CONDITIONS.map(c => {
                const a = childLevel === c.id
                return (
                  <button key={c.id} onClick={() => setChildLevel(c.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, border:`1.5px solid ${a ? '#111' : 'transparent'}`, backgroundColor: a ? '#111' : '#F9FAFB', color: a ? 'white' : '#6B7280', cursor:'pointer', transition:'all 0.15s' }}>
                    <span style={{ fontSize:18 }}>{c.emoji}</span>
                    <div style={{ textAlign:'left' }}>
                      <span style={{ fontSize:12, fontWeight: a ? 700 : 500, display:'block' }}>{c.label}</span>
                      <span style={{ fontSize:10, opacity:0.5 }}>{c.level}</span>
                    </div>
                  </button>
                )
              })}
            </div>
            {isDemon && (
              <div style={{ marginTop:10, padding:'7px 12px', borderRadius:8, backgroundColor:'#FEF2F2', fontSize:11, fontWeight:700, color:'#DC2626', textAlign:'center' }}>
                ⚠ 最大戦闘態勢
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div style={card()}>
            <p style={secTitle()}>Quick Stats</p>
            {[{ label:'クエスト完了', val: stats.completedQuests, emoji:'✅', color:'#111' },
              { label:'魔王出現',    val: stats.demonCount,       emoji:'👿', color:'#DC2626' }].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #F9FAFB' }}>
                <span style={{ fontSize:12, color:'#6B7280' }}>{item.emoji} {item.label}</span>
                <span style={{ fontSize:20, fontWeight:700, color:item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CENTER ════════════════════════════════════════ */}
        <div className="dash-center" style={{ display:'flex', flexDirection:'column', gap:14, minWidth:0 }}>

          {/* Checklist */}
          <div style={card()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <p style={{ ...secTitle(cur.accent), margin:0 }}>Quest Items</p>
              <span style={{ fontSize:12, color:'#9CA3AF', fontVariantNumeric:'tabular-nums' }}>{checked} / {curTasks.length}</span>
            </div>
            {/* Progress bar */}
            <div style={{ height:3, backgroundColor:'#F3F4F6', borderRadius:99, marginBottom:14, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, backgroundColor:cur.accent, borderRadius:99, transition:'width 0.4s ease' }} />
            </div>
            {/* Tasks */}
            {curTasks.map(task => (
              <div key={task.id} className="task-row" style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:'1px solid #F9FAFB' }}>
                <button onClick={() => toggle(task.id)} style={{ width:17, height:17, borderRadius:4, border:`1.5px solid ${task.checked ? cur.accent : '#D1D5DB'}`, backgroundColor: task.checked ? cur.accent : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, transition:'all 0.15s' }}>
                  {task.checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <span style={{ flex:1, fontSize:13, color: task.checked ? '#D1D5DB' : '#1F2937', textDecoration: task.checked ? 'line-through' : 'none', transition:'all 0.15s' }}>{task.text}</span>
                <button onClick={() => delTask(task.id)} className="delete-btn" style={{ opacity:0, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', color:'#D1D5DB', cursor:'pointer', fontSize:15, border:'none', backgroundColor:'transparent', padding:0, transition:'opacity 0.15s' }}>×</button>
              </div>
            ))}
            {/* Add task */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="タスクを追加..." style={{ flex:1, fontSize:12, border:'none', outline:'none', backgroundColor:'transparent', color:'#374151', fontFamily:'inherit' }} />
              <button onClick={addTask} style={{ fontSize:11, fontWeight:600, color:cur.accent, border:'none', backgroundColor:'transparent', cursor:'pointer', fontFamily:'inherit', padding:'4px 6px' }}>追加</button>
            </div>
            {/* Complete button */}
            {allDone && !showDone && (
              <button onClick={complete} style={{ width:'100%', marginTop:14, padding:'13px', backgroundColor:cur.accent, color:'white', fontSize:12, fontWeight:700, letterSpacing:'0.15em', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>
                クエスト完了
              </button>
            )}
            {showDone && (
              <div style={{ textAlign:'center', marginTop:14, padding:'18px 16px', backgroundColor:cur.accentBg, borderRadius:8 }}>
                <p style={{ fontSize:17, fontWeight:700, color:'#111', margin:'0 0 4px' }}>{COMPLETION[mode].main}</p>
                <p style={{ fontSize:11, color:'#6B7280', margin:'0 0 12px' }}>{COMPLETION[mode].sub}</p>
                <button onClick={reset} style={{ fontSize:11, color:'#9CA3AF', textDecoration:'underline', textUnderlineOffset:3, border:'none', backgroundColor:'transparent', cursor:'pointer', fontFamily:'inherit' }}>リセットして次の任務へ</button>
              </div>
            )}
          </div>

          {/* News */}
          <div style={card()}>
            <p style={secTitle()}>育児ニュース</p>
            {newsLoading ? (
              <p style={{ color:'#9CA3AF', fontSize:12, textAlign:'center', padding:'16px 0' }}>取得中…</p>
            ) : news.length === 0 ? (
              <p style={{ color:'#9CA3AF', fontSize:12, textAlign:'center', padding:'16px 0' }}>ニュースを取得できませんでした</p>
            ) : news.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 0', borderBottom: i < news.length - 1 ? '1px solid #F9FAFB' : 'none', textDecoration:'none', color:'inherit' }}>
                <span style={{ fontSize:10, color:'#9CA3AF', flexShrink:0, marginTop:2, fontVariantNumeric:'tabular-nums', minWidth:16 }}>{String(i+1).padStart(2,'0')}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, color:'#1F2937', margin:0, lineHeight:1.55, display:'-webkit-box', overflow:'hidden', WebkitLineClamp:2, WebkitBoxOrient:'vertical' } as React.CSSProperties}>{item.title}</p>
                  {item.pubDate && <p style={{ fontSize:10, color:'#9CA3AF', margin:'2px 0 0' }}>{item.pubDate.slice(0,10)}</p>}
                </div>
              </a>
            ))}
          </div>

          {/* Calendar */}
          <div style={card()}>
            <p style={secTitle()}>イベントカレンダー</p>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <input type="text" value={evInput} onChange={e => setEvInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEvent()} placeholder="3/28 入園式　または　3月28日 運動会" style={{ flex:1, fontSize:12, padding:'7px 11px', border:'1px solid #E5E7EB', borderRadius:7, outline:'none', color:'#374151', backgroundColor:'#FAFAFA', fontFamily:'inherit' }} />
              <button onClick={addEvent} style={{ fontSize:11, fontWeight:700, padding:'7px 12px', backgroundColor:cur.accent, color:'white', border:'none', borderRadius:7, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>追加</button>
            </div>
            {upcoming.length === 0 ? (
              <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'12px 0' }}>予定がありません</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {upcoming.map(ev => {
                  const d = new Date(ev.date + 'T00:00:00')
                  const isToday = ev.date === todayStr()
                  const days = ['日','月','火','水','木','金','土']
                  return (
                    <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:8, backgroundColor: isToday ? cur.accentBg : '#F9FAFB', border:`1px solid ${isToday ? cur.accent + '40' : 'transparent'}` }}>
                      <div style={{ flexShrink:0, width:34, height:34, borderRadius:7, backgroundColor: isToday ? cur.accent : '#E5E7EB', color: isToday ? 'white' : '#6B7280', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:9, fontWeight:700, lineHeight:1.2 }}>{d.getMonth()+1}/{d.getDate()}</span>
                        <span style={{ fontSize:8, opacity:0.7, lineHeight:1 }}>{days[d.getDay()]}</span>
                      </div>
                      <span style={{ flex:1, fontSize:12, color:'#1F2937', fontWeight: isToday ? 600 : 400 }}>
                        {ev.text}{isToday && <span style={{ marginLeft:6, fontSize:9, color:cur.accent, fontWeight:700 }}>TODAY</span>}
                      </span>
                      <button onClick={() => delEvent(ev.id)} style={{ color:'#D1D5DB', fontSize:14, border:'none', backgroundColor:'transparent', cursor:'pointer', padding:2 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT ═════════════════════════════════════════ */}
        <div className="dash-right" style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Mode usage chart */}
          <div style={card()}>
            <p style={secTitle()}>サバイバル統計</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {MODES.map(m => {
                const cnt = stats.modeUsage[m.id]
                return (
                  <div key={m.id}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, color:'#6B7280' }}>{m.label}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#111' }}>{cnt}</span>
                    </div>
                    <div style={{ height:5, backgroundColor:'#F3F4F6', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(cnt / maxMode) * 100}%`, backgroundColor:m.accent, borderRadius:99, transition:'width 0.6s ease', minWidth: cnt > 0 ? 4 : 0 }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid #F3F4F6', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[{ label:'完了クエスト', val:stats.completedQuests, color:'#111' },
                { label:'魔王出現', val:stats.demonCount, color:'#DC2626' }].map(item => (
                <div key={item.label} style={{ textAlign:'center', padding:'8px', backgroundColor:'#F9FAFB', borderRadius:8 }}>
                  <p style={{ fontSize:22, fontWeight:700, color:item.color, margin:0 }}>{item.val}</p>
                  <p style={{ fontSize:9, color:'#9CA3AF', margin:'2px 0 0', letterSpacing:'0.05em' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Word ranking */}
          <div style={card()}>
            <p style={secTitle()}>話題ランキング</p>
            {newsLoading ? (
              <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'12px 0' }}>取得中…</p>
            ) : wordRank.length === 0 ? (
              <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'12px 0' }}>データなし</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {wordRank.map((item, i) => (
                  <div key={item.word} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:9, fontWeight:700, width:16, flexShrink:0, color: i < 3 ? cur.accent : '#9CA3AF' }}>{i+1}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:12, color:'#1F2937', fontWeight: i < 3 ? 600 : 400 }}>{item.word}</span>
                        <span style={{ fontSize:10, color:'#9CA3AF' }}>{item.count}</span>
                      </div>
                      <div style={{ height:3, backgroundColor:'#F3F4F6', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(item.count/maxWord)*100}%`, backgroundColor: i < 3 ? cur.accent : '#D1D5DB', borderRadius:99 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
