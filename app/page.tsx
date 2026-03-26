'use client'

import { useState, useEffect, useRef } from 'react'

// ══ Types ════════════════════════════════════════════════════════════
type TZ         = 'MORNING' | 'DAY' | 'EVENING'
type ChildLv    = 'ANGEL' | 'MOODY' | 'DEMON'
type Attendance = 'normal' | 'early' | 'absent'

interface Task        { id: string; text: string; checked: boolean }
interface NewsItem    { title: string; link: string; pubDate: string }
interface ReadLater   { id: string; title: string; link: string }
interface DailyRec    { id: string; date: string; cond: ChildLv; attend: Attendance; memo: string }
interface ChildInfo   { birthdate: string; name: string }
interface Stats       { demonCount: number; completedQuests: number }

// ══ Time helpers ══════════════════════════════════════════════════════
const getAutoTZ = (): TZ => {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'MORNING'
  if (h >= 11 && h < 17) return 'DAY'
  return 'EVENING'
}

const getMonthAge = (bd: string): number | null => {
  if (!bd) return null
  const b = new Date(bd), n = new Date()
  return Math.max(0, (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth())
}

const getNewsQuery = (m: number | null): string => {
  if (m === null) return '子育て 育児 幼稚園'
  if (m < 6)  return '赤ちゃん 育児 新生児'
  if (m < 12) return '離乳食 ハイハイ 赤ちゃん'
  if (m < 24) return '1歳 育児 離乳食'
  if (m < 36) return '2歳 イヤイヤ期 育児'
  if (m < 48) return '3歳 幼稚園 育児'
  if (m < 60) return '4歳 育児 遊び'
  if (m < 72) return '5歳 小学校準備'
  return '育児 小学生 子育て'
}

// ══ Development milestones ════════════════════════════════════════════
interface MS { title: string; guide: string[]; check: string[] }
const MILESTONES: Record<number, MS> = {
  0:  { title:'0ヶ月',     guide:['授乳は2〜3時間おき（1日8〜12回）','首はまだすわっていない','昼夜の区別はまだない'],             check:['うつぶせ練習（数分から）','沐浴を毎日の習慣に'] },
  1:  { title:'1ヶ月',     guide:['視力が発達中（20〜30cm先が見える）','声かけに反応し始める'],                                    check:['1ヶ月健診','ワクチンスケジュール確認'] },
  2:  { title:'2ヶ月',     guide:['あやすと声を出して笑う','追視できる'],                                                          check:['ワクチン接種開始（任意含む）'] },
  3:  { title:'3ヶ月',     guide:['首がすわってくる','寝返り準備期'],                                                              check:['うつぶせで頭を持ち上げる練習'] },
  4:  { title:'4ヶ月',     guide:['寝返りを打ち始める子も','おもちゃに興味'],                                                      check:['4ヶ月健診','ガラガラ・布絵本'] },
  5:  { title:'5ヶ月',     guide:['離乳食開始の目安（ゴックン期）','お座り準備中'],                                                 check:['10倍がゆひとさじから','アレルギー食材は1種類ずつ'] },
  6:  { title:'6ヶ月',     guide:['離乳食2回食へ','ずりばい開始の子も'],                                                          check:['果汁・野菜を少しずつ','ストローマグ練習開始'] },
  7:  { title:'7ヶ月',     guide:['ずりばい・お座り安定','離乳食もぐもぐ期（舌でつぶせる固さ）'],                                   check:['指で持てるおやき','カミカミ食材を少しずつ'] },
  8:  { title:'8ヶ月',     guide:['つかまり立ち準備','人見知りが本格化'],                                                          check:['安全対策（コンセント・角）','8ヶ月健診'] },
  9:  { title:'9ヶ月',     guide:['ハイハイ本格化','指先でつまむ動作'],                                                            check:['卵黄は9ヶ月〜','小さいものの誤飲注意'] },
  10: { title:'10ヶ月',    guide:['つたい歩き','バイバイ・パチパチ'],                                                              check:['コップ飲み練習','安全靴の準備'] },
  11: { title:'11ヶ月',    guide:['一人立ち目前','意思疎通が増える'],                                                              check:['卵白は1歳以降が目安','ファーストシューズ'] },
  12: { title:'1歳',       guide:['歩き始め（個人差あり）','牛乳・卵白・ハチミツ以外ほぼ解禁'],                                     check:['牛乳OK（加熱不要）','1歳健診','保育園申込確認'] },
  15: { title:'1歳3ヶ月',  guide:['走り始め','積み木2〜3個'],                                                                     check:['スプーン・フォーク練習','フォローアップミルク終了目安'] },
  18: { title:'1歳6ヶ月',  guide:['イヤイヤ期の兆候','2語文前（ワンワン来た等）'],                                                  check:['1歳6ヶ月健診','選択肢を2つ提示する関わり方'] },
  21: { title:'1歳9ヶ月',  guide:['走る・ジャンプ準備','自己主張が強くなる'],                                                      check:['トイレへの興味を確認','早寝早起きリズムを整える'] },
  24: { title:'2歳',       guide:['イヤイヤ期ピーク','2〜3語文が出る'],                                                            check:['トイトレ検討（おしっこ間隔2h以上が目安）','スプーンで自食'] },
  27: { title:'2歳3ヶ月',  guide:['トイトレ開始目安','感情の波が激しい'],                                                          check:['補助便座・踏み台を用意','成功したら大袈裟に褒める'] },
  30: { title:'2歳6ヶ月',  guide:['お箸練習開始目安','ひとりで着替えに興味'],                                                      check:['トレーニングパンツへ','アイス（市販）解禁の目安'] },
  33: { title:'2歳9ヶ月',  guide:['チョコレート解禁の目安','ルールのある遊びができる'],                                             check:['幼稚園説明会の季節','ひらがなへの興味'] },
  36: { title:'3歳',       guide:['生もの（刺身等）はまだ注意','友達への関心が高まる'],                                             check:['3歳健診','自転車（補助輪）','幼稚園入園'] },
  48: { title:'4歳',       guide:['ハサミ・のりを使える','ルールを守って遊べる'],                                                  check:['ひらがな読み書き準備','縄跳び・鉄棒チャレンジ'] },
  60: { title:'5歳',       guide:['文字の読み書き練習','縄跳び・ボール遊び'],                                                      check:['就学前健診の確認','時計の読み方'] },
  72: { title:'6歳',       guide:['小学校入学！','自己管理の力をつける時期'],                                                      check:['ランドセル準備（1年前から）','朝のルーティン確立'] },
}

const getMilestone = (m: number | null): MS | null => {
  if (m === null) return null
  const keys = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b)
  let best = keys[0]
  for (const k of keys) { if (k <= m) best = k }
  return MILESTONES[best]
}

// ══ Constants ═════════════════════════════════════════════════════════
const MODES = [
  { id: 'MORNING' as TZ, label:'朝の部', sub:'登園クエスト',  accent:'#3B82F6', accentBg:'#EFF6FF', emoji:'🌅' },
  { id: 'DAY'     as TZ, label:'昼の部', sub:'日中ニュース',  accent:'#F59E0B', accentBg:'#FFFBEB', emoji:'☀️' },
  { id: 'EVENING' as TZ, label:'夜の部', sub:'振り返り',      accent:'#8B5CF6', accentBg:'#F5F3FF', emoji:'🌙' },
]

const DEF_TASKS: Record<TZ, string[]> = {
  MORNING: ['検温','連絡帳記入','着替え確認','朝食','持ち物チェック','出発時間確認'],
  DAY:     ['お昼の連絡確認','早退対応準備','明日の予定確認'],
  EVENING: ['お風呂','歯磨き','明日の準備','検温','寝かしつけ'],
}

const CONDS = [
  { id:'ANGEL' as ChildLv, label:'天使',   lv:'Lv.1',  emoji:'😇' },
  { id:'MOODY' as ChildLv, label:'不機嫌', lv:'Lv.50', emoji:'😤' },
  { id:'DEMON' as ChildLv, label:'魔王',   lv:'Lv.99', emoji:'👿' },
]

const ATTENDS = [
  { id:'normal' as Attendance, label:'登園', color:'#1D4ED8', bg:'#DBEAFE', border:'#3B82F6' },
  { id:'early'  as Attendance, label:'早退', color:'#B45309', bg:'#FEF3C7', border:'#F59E0B' },
  { id:'absent' as Attendance, label:'欠勤', color:'#B91C1C', bg:'#FEE2E2', border:'#EF4444' },
]

const STOP = new Set(['これ','この','その','あの','だ','です','ます','した','する','いる','いた','ある','なる','から','まで','こと','ため','もの','など','について','による','という','として','での','への'])

// ══ Helpers ═══════════════════════════════════════════════════════════
const uid    = () => Math.random().toString(36).slice(2, 9)
const today  = () => new Date().toISOString().slice(0, 10)
const defTasks = (tz: TZ): Task[] => DEF_TASKS[tz].map(text => ({ id: uid(), text, checked: false }))
const newsUrl  = (q: string) => 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`)

function extractWords(titles: string[]): { word: string; count: number }[] {
  const freq: Record<string, number> = {}
  titles.join(' ').split(/[\s「」【】、。！？・…＝×◆|（）[\]\-—–]+/).map(w => w.trim())
    .filter(w => w.length >= 2 && w.length <= 10 && !STOP.has(w) && !/^[\d０-９a-zA-Z]+$/.test(w))
    .forEach(w => { freq[w] = (freq[w] ?? 0) + 1 })
  return Object.entries(freq).filter(([,c]) => c >= 2).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word,count]) => ({word,count}))
}

// ══ Style helpers ══════════════════════════════════════════════════════
const card = (ex?: React.CSSProperties): React.CSSProperties => ({ backgroundColor:'white', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.07)', padding:'16px 18px', ...ex })
const sec  = (color='#9CA3AF'): React.CSSProperties => ({ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase' as const, color, margin:'0 0 12px 0' })

// ══ Component ══════════════════════════════════════════════════════════
export default function Home() {
  const [tz, setTz]             = useState<TZ>(getAutoTZ())
  const [isAuto, setIsAuto]     = useState(true)
  const [cond, setCond]         = useState<ChildLv>('ANGEL')
  const [tasks, setTasks]       = useState<Record<TZ, Task[]> | null>(null)
  const [newTask, setNewTask]   = useState('')
  const [showDone, setShowDone] = useState(false)
  const [news, setNews]         = useState<NewsItem[]>([])
  const [newsOk, setNewsOk]     = useState(false)
  const [wordRank, setWordRank] = useState<{word:string;count:number}[]>([])
  const [rl, setRl]             = useState<ReadLater[]>([])
  const [recs, setRecs]         = useState<DailyRec[]>([])
  const [info, setInfo]         = useState<ChildInfo>({ birthdate:'', name:'' })
  const [stats, setStats]       = useState<Stats>({ demonCount:0, completedQuests:0 })
  const [night, setNight]       = useState<{ cond:ChildLv; attend:Attendance; memo:string }>({ cond:'ANGEL', attend:'normal', memo:'' })
  const [saved, setSaved]       = useState(false)
  const [clock, setClock]       = useState('')
  const [ready, setReady]       = useState(false)
  const prevCond                = useRef<ChildLv>('ANGEL')

  // Clock + auto-mode
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' }))
      if (isAuto) setTz(getAutoTZ())
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [isAuto])

  // Load localStorage
  useEffect(() => {
    try {
      const t  = localStorage.getItem('isv3_tasks')
      const c  = localStorage.getItem('isv3_cond') as ChildLv | null
      const s  = localStorage.getItem('isv3_stats')
      const r  = localStorage.getItem('isv3_rl')
      const rc = localStorage.getItem('isv3_recs')
      const i  = localStorage.getItem('isv3_info')
      if (t) setTasks(JSON.parse(t))
      else { const init = {} as Record<TZ,Task[]>; MODES.forEach(m => { init[m.id] = defTasks(m.id) }); setTasks(init) }
      if (c) { setCond(c); prevCond.current = c }
      if (s) setStats({ ...{ demonCount:0, completedQuests:0 }, ...JSON.parse(s) })
      if (r) setRl(JSON.parse(r))
      if (rc) setRecs(JSON.parse(rc))
      if (i) setInfo(JSON.parse(i))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => { if (ready && tasks) localStorage.setItem('isv3_tasks',  JSON.stringify(tasks)) }, [tasks, ready])
  useEffect(() => { if (ready)          localStorage.setItem('isv3_cond',   cond) }, [cond, ready])
  useEffect(() => { if (ready)          localStorage.setItem('isv3_stats',  JSON.stringify(stats)) }, [stats, ready])
  useEffect(() => { if (ready)          localStorage.setItem('isv3_rl',     JSON.stringify(rl)) }, [rl, ready])
  useEffect(() => { if (ready)          localStorage.setItem('isv3_recs',   JSON.stringify(recs)) }, [recs, ready])
  useEffect(() => { if (ready)          localStorage.setItem('isv3_info',   JSON.stringify(info)) }, [info, ready])

  // Demon tracking
  useEffect(() => {
    if (!ready) return
    if (cond === 'DEMON' && prevCond.current !== 'DEMON') setStats(s => ({ ...s, demonCount: s.demonCount + 1 }))
    prevCond.current = cond
  }, [cond, ready])

  // Fetch news
  const monthAge = getMonthAge(info.birthdate)
  const query    = getNewsQuery(monthAge)
  useEffect(() => {
    setNewsOk(false)
    fetch(newsUrl(query))
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.items)) {
          const items: NewsItem[] = d.items.slice(0, 15).map((it: Record<string,string>) => ({ title:(it.title ?? '').replace(/ - .*$/,'').trim(), link:it.link??'#', pubDate:it.pubDate??'' }))
          setNews(items)
          setWordRank(extractWords(items.map(i => i.title)))
          setNewsOk(true)
        }
      }).catch(() => {})
  }, [query])

  if (!ready || !tasks) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#F1F2F4' }}><p style={{ color:'#9CA3AF', fontSize:14 }}>読み込み中…</p></div>

  const cur        = MODES.find(m => m.id === tz)!
  const curTasks   = tasks[tz] ?? []
  const checked    = curTasks.filter(t => t.checked).length
  const allDone    = curTasks.length > 0 && checked === curTasks.length
  const isDemon    = cond === 'DEMON'
  const progress   = curTasks.length > 0 ? (checked / curTasks.length) * 100 : 0
  const milestone  = getMilestone(monthAge)
  const maxW       = wordRank[0]?.count ?? 1

  // 30-day attendance rate
  const att30 = (() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const cut = cutoff.toISOString().slice(0, 10)
    const r = recs.filter(r => r.date >= cut)
    if (!r.length) return null
    return Math.round((r.filter(r => r.attend === 'normal').length / r.length) * 100)
  })()

  // Calendar
  const cal = (() => {
    const now = new Date(), yr = now.getFullYear(), mo = now.getMonth()
    const fd = new Date(yr, mo, 1).getDay()
    const dim = new Date(yr, mo + 1, 0).getDate()
    const map: Record<string, DailyRec> = {}; recs.forEach(r => { map[r.date] = r })
    return { yr, mo, fd, dim, map }
  })()

  // Handlers
  const toggle    = (id: string) => setTasks(p => ({ ...p!, [tz]: p![tz].map(t => t.id === id ? { ...t, checked: !t.checked } : t) }))
  const delTask   = (id: string) => setTasks(p => ({ ...p!, [tz]: p![tz].filter(t => t.id !== id) }))
  const addTask   = () => { const v = newTask.trim(); if (!v) return; setTasks(p => ({ ...p!, [tz]: [...p![tz], { id:uid(), text:v, checked:false }] })); setNewTask('') }
  const complete  = () => { setShowDone(true); setStats(s => ({ ...s, completedQuests: s.completedQuests + 1 })) }
  const resetQ    = () => { setTasks(p => ({ ...p!, [tz]: defTasks(tz) })); setShowDone(false) }
  const saveNight = () => { const r: DailyRec = { id:uid(), date:today(), cond:night.cond, attend:night.attend, memo:night.memo }; setRecs(p => [...p.filter(r => r.date !== today()), r]); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const addRL     = (item: NewsItem) => setRl(p => p.some(r => r.link === item.link) ? p : [...p, { id:uid(), title:item.title, link:item.link }])
  const delRL     = (id: string) => setRl(p => p.filter(r => r.id !== id))
  const switchTZ  = (t: TZ) => { setTz(t); setIsAuto(false); setShowDone(false) }

  // Checklist UI (reusable inline)
  const Checklist = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div style={{ height: compact ? 2 : 3, backgroundColor:'#F3F4F6', borderRadius:99, marginBottom:compact ? 10 : 14, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${progress}%`, backgroundColor:cur.accent, borderRadius:99, transition:'width 0.4s ease' }} />
      </div>
      {curTasks.map(task => (
        <div key={task.id} className="task-row" style={{ display:'flex', alignItems:'center', gap:10, padding: compact ? '7px 0' : '9px 0', borderBottom:'1px solid #F9FAFB' }}>
          <button onClick={() => toggle(task.id)} style={{ width:17, height:17, borderRadius:4, border:`1.5px solid ${task.checked ? cur.accent : '#D1D5DB'}`, backgroundColor: task.checked ? cur.accent : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, transition:'all 0.15s' }}>
            {task.checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </button>
          <span style={{ flex:1, fontSize: compact ? 12 : 13, color: task.checked ? '#D1D5DB' : '#1F2937', textDecoration: task.checked ? 'line-through' : 'none' }}>{task.text}</span>
          {!compact && <button onClick={() => delTask(task.id)} className="delete-btn" style={{ opacity:0, fontSize:15, color:'#D1D5DB', cursor:'pointer', border:'none', backgroundColor:'transparent', padding:0, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity 0.15s' }}>×</button>}
        </div>
      ))}
    </>
  )

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F1F2F4', fontFamily:"'Inter',-apple-system,'Helvetica Neue',sans-serif" }}>

      {/* Demon banner */}
      {isDemon && <div className="shake-screen" style={{ backgroundColor:'#DC2626', color:'white', textAlign:'center', padding:'9px', fontSize:11, fontWeight:700, letterSpacing:'0.25em' }}>⚠ 戦え、親よ — 魔王出現中 ⚠</div>}

      {/* Header */}
      <header style={{ backgroundColor:'white', borderBottom:'1px solid #E5E7EB', padding:'0 20px', height:50, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, backgroundColor:cur.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🛡</div>
          <span style={{ fontSize:14, fontWeight:700, color:'#111', letterSpacing:'-0.02em' }}>育児サバイバル</span>
          <span style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.08em', textTransform:'uppercase' }}>Dashboard</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#9CA3AF' }}>{clock}</span>
          <span style={{ fontSize:11, fontWeight:600, color:cur.accent, backgroundColor:cur.accentBg, padding:'3px 9px', borderRadius:20, display:'flex', alignItems:'center', gap:4 }}>
            {isAuto && <span style={{ fontSize:8, letterSpacing:'0.05em' }}>AUTO</span>}
            {cur.emoji} {cur.label}
          </span>
          <span style={{ fontSize:20 }}>{CONDS.find(c => c.id === cond)?.emoji}</span>
        </div>
      </header>

      {/* Grid */}
      <div className="dash-grid" style={{ maxWidth:1380, margin:'0 auto', padding:'16px 16px 48px', display:'grid', gridTemplateColumns:'240px 1fr 240px', gap:14 }}>

        {/* ══ LEFT ══════════════════════════════════════════ */}
        <div className="dash-left" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Mode */}
          <div style={card()}>
            <p style={sec()}>Mode</p>
            {isAuto && <div style={{ marginBottom:10, padding:'5px 9px', borderRadius:7, backgroundColor:'#F0FDF4', fontSize:10, color:'#16A34A', fontWeight:600 }}>⚡ 現在時刻から自動設定中</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {MODES.map(m => {
                const a = tz === m.id
                return (
                  <button key={m.id} onClick={() => switchTZ(m.id)} style={{ textAlign:'left', padding:'9px 12px', borderRadius:8, border:`1.5px solid ${a ? m.accent : 'transparent'}`, backgroundColor: a ? m.accentBg : '#F9FAFB', color: a ? m.accent : '#6B7280', cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}>
                    <span style={{ fontSize:14 }}>{m.emoji}</span>
                    <div><span style={{ fontSize:12, fontWeight: a ? 700 : 500, display:'block' }}>{m.label}</span><span style={{ fontSize:10, opacity:0.6 }}>{m.sub}</span></div>
                  </button>
                )
              })}
            </div>
            {!isAuto && <button onClick={() => { setIsAuto(true); setTz(getAutoTZ()) }} style={{ width:'100%', marginTop:8, fontSize:10, color:'#9CA3AF', border:'1px dashed #E5E7EB', borderRadius:7, backgroundColor:'transparent', cursor:'pointer', padding:'6px', fontFamily:'inherit' }}>自動モードに戻す</button>}
          </div>

          {/* Condition */}
          <div style={card()}>
            <p style={sec()}>Condition</p>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {CONDS.map(c => {
                const a = cond === c.id
                return (
                  <button key={c.id} onClick={() => setCond(c.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:`1.5px solid ${a ? '#111' : 'transparent'}`, backgroundColor: a ? '#111' : '#F9FAFB', color: a ? 'white' : '#6B7280', cursor:'pointer', transition:'all 0.15s' }}>
                    <span style={{ fontSize:18 }}>{c.emoji}</span>
                    <div><span style={{ fontSize:12, fontWeight: a ? 700 : 500, display:'block' }}>{c.label}</span><span style={{ fontSize:10, opacity:0.5 }}>{c.lv}</span></div>
                  </button>
                )
              })}
            </div>
            {isDemon && <div style={{ marginTop:8, padding:'6px 10px', borderRadius:7, backgroundColor:'#FEF2F2', fontSize:11, fontWeight:700, color:'#DC2626', textAlign:'center' }}>⚠ 最大戦闘態勢</div>}
          </div>

          {/* Child info */}
          <div style={card()}>
            <p style={sec()}>Child Info</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <label style={{ fontSize:10, color:'#9CA3AF', display:'block', marginBottom:4 }}>お名前（任意）</label>
                <input type="text" value={info.name} onChange={e => setInfo(p => ({ ...p, name:e.target.value }))} placeholder="たろうくん" style={{ width:'100%', fontSize:12, padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:7, outline:'none', fontFamily:'inherit', color:'#374151' }} />
              </div>
              <div>
                <label style={{ fontSize:10, color:'#9CA3AF', display:'block', marginBottom:4 }}>生年月日</label>
                <input type="date" value={info.birthdate} onChange={e => setInfo(p => ({ ...p, birthdate:e.target.value }))} style={{ width:'100%', fontSize:12, padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:7, outline:'none', fontFamily:'inherit', color:'#374151' }} />
              </div>
              {monthAge !== null && (
                <div style={{ padding:'8px 10px', borderRadius:7, backgroundColor:cur.accentBg, textAlign:'center' }}>
                  <p style={{ fontSize:18, fontWeight:700, color:cur.accent, margin:0 }}>{monthAge}ヶ月</p>
                  <p style={{ fontSize:10, color:'#6B7280', margin:'2px 0 0' }}>{monthAge < 36 ? `${Math.floor(monthAge/12)}歳${monthAge%12}ヶ月` : `${Math.floor(monthAge/12)}歳`}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={card()}>
            <p style={sec()}>Stats</p>
            {[{ label:'クエスト完了', val:stats.completedQuests, emoji:'✅', color:'#111' },
              { label:'魔王撃破累計', val:stats.demonCount, emoji:'👿', color:'#DC2626' },
              { label:'登園率(30日)', val:att30 !== null ? `${att30}%` : '−', emoji:'📊', color:'#3B82F6' }
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #F9FAFB' }}>
                <span style={{ fontSize:11, color:'#6B7280' }}>{item.emoji} {item.label}</span>
                <span style={{ fontSize:16, fontWeight:700, color:item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CENTER ════════════════════════════════════════ */}
        <div className="dash-center" style={{ display:'flex', flexDirection:'column', gap:14, minWidth:0 }}>

          {/* ── MORNING: checklist first ── */}
          {tz === 'MORNING' && (
            <div style={card()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <p style={{ ...sec(cur.accent), margin:0 }}>🌅 登園クエスト</p>
                <span style={{ fontSize:12, color:'#9CA3AF' }}>{checked}/{curTasks.length}</span>
              </div>
              <Checklist />
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key==='Enter' && addTask()} placeholder="タスクを追加..." style={{ flex:1, fontSize:12, border:'none', outline:'none', backgroundColor:'transparent', color:'#374151', fontFamily:'inherit' }} />
                <button onClick={addTask} style={{ fontSize:11, fontWeight:600, color:cur.accent, border:'none', backgroundColor:'transparent', cursor:'pointer', fontFamily:'inherit', padding:'4px 6px' }}>追加</button>
              </div>
              {allDone && !showDone && (
                <button onClick={complete} style={{ width:'100%', marginTop:14, padding:'13px', backgroundColor:cur.accent, color:'white', fontSize:12, fontWeight:700, letterSpacing:'0.15em', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>
                  クエスト完了 — 爆速で出社せよ
                </button>
              )}
              {showDone && (
                <div style={{ textAlign:'center', marginTop:14, padding:'16px', backgroundColor:cur.accentBg, borderRadius:8 }}>
                  <p style={{ fontSize:16, fontWeight:700, color:'#111', margin:'0 0 4px' }}>爆速で出社せよ</p>
                  <p style={{ fontSize:11, color:'#6B7280', margin:'0 0 10px' }}>よく戦った。行ってらっしゃい。</p>
                  <button onClick={resetQ} style={{ fontSize:10, color:'#9CA3AF', textDecoration:'underline', border:'none', backgroundColor:'transparent', cursor:'pointer', fontFamily:'inherit' }}>リセット</button>
                </div>
              )}
            </div>
          )}

          {/* ── DAY: news first ── */}
          {tz === 'DAY' && (
            <div style={card()}>
              <p style={sec()}>☀️ 育児ニュース{monthAge !== null && <span style={{ color:cur.accent, marginLeft:6 }}>（{monthAge}ヶ月向け）</span>}</p>
              {!newsOk && news.length === 0 ? (
                <p style={{ color:'#9CA3AF', fontSize:12, textAlign:'center', padding:'14px 0' }}>取得中…</p>
              ) : news.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom: i < news.length-1 ? '1px solid #F9FAFB' : 'none' }}>
                  <span style={{ fontSize:10, color:'#9CA3AF', flexShrink:0, marginTop:2, minWidth:16 }}>{String(i+1).padStart(2,'0')}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                      <p style={{ fontSize:12, color:'#1F2937', margin:'0 0 2px', lineHeight:1.5, display:'-webkit-box', overflow:'hidden', WebkitLineClamp:2, WebkitBoxOrient:'vertical' } as React.CSSProperties}>{item.title}</p>
                    </a>
                    {item.pubDate && <p style={{ fontSize:10, color:'#9CA3AF', margin:0 }}>{item.pubDate.slice(0,10)}</p>}
                  </div>
                  <button onClick={() => addRL(item)} title="後で読む" onMouseOver={e => (e.currentTarget.style.color=cur.accent)} onMouseOut={e => (e.currentTarget.style.color='#D1D5DB')} style={{ fontSize:14, color:'#D1D5DB', border:'none', backgroundColor:'transparent', cursor:'pointer', flexShrink:0, padding:2, transition:'color 0.15s' }}>🔖</button>
                </div>
              ))}
            </div>
          )}

          {/* DAY: read later */}
          {tz === 'DAY' && rl.length > 0 && (
            <div style={card()}>
              <p style={sec()}>🔖 後で読む</p>
              {rl.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #F9FAFB' }}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ flex:1, fontSize:12, color:'#1F2937', textDecoration:'none', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{item.title}</a>
                  <button onClick={() => delRL(item.id)} style={{ color:'#D1D5DB', fontSize:14, border:'none', backgroundColor:'transparent', cursor:'pointer', padding:2 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* ── EVENING: night log ── */}
          {tz === 'EVENING' && (
            <div style={card()}>
              <p style={sec(cur.accent)}>🌙 今日の振り返り</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:10, color:'#9CA3AF', display:'block', marginBottom:8 }}>子供のコンディション</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {CONDS.map(c => (
                      <button key={c.id} onClick={() => setNight(p => ({ ...p, cond:c.id }))} style={{ flex:1, padding:'8px 4px', borderRadius:8, border:`1.5px solid ${night.cond===c.id ? '#111' : '#E5E7EB'}`, backgroundColor: night.cond===c.id ? '#111' : 'white', color: night.cond===c.id ? 'white' : '#6B7280', cursor:'pointer', textAlign:'center', fontSize:11, fontFamily:'inherit' }}>
                        <span style={{ display:'block', fontSize:18 }}>{c.emoji}</span>{c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:10, color:'#9CA3AF', display:'block', marginBottom:8 }}>登園状況</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {ATTENDS.map(a => (
                      <button key={a.id} onClick={() => setNight(p => ({ ...p, attend:a.id }))} style={{ flex:1, padding:'8px 4px', borderRadius:8, border:`1.5px solid ${night.attend===a.id ? a.border : '#E5E7EB'}`, backgroundColor: night.attend===a.id ? a.bg : 'white', color: night.attend===a.id ? a.color : '#6B7280', cursor:'pointer', textAlign:'center', fontSize:12, fontWeight: night.attend===a.id ? 700 : 400, fontFamily:'inherit' }}>{a.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:10, color:'#9CA3AF', display:'block', marginBottom:6 }}>一言メモ</label>
                  <textarea value={night.memo} onChange={e => setNight(p => ({ ...p, memo:e.target.value }))} placeholder="今日の出来事、気になったこと..." rows={3} style={{ width:'100%', fontSize:12, padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:8, outline:'none', resize:'vertical', fontFamily:'inherit', color:'#374151', lineHeight:1.6 }} />
                </div>
                <button onClick={saveNight} style={{ padding:'12px', backgroundColor: saved ? '#10B981' : cur.accent, color:'white', fontSize:12, fontWeight:700, letterSpacing:'0.1em', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', transition:'background-color 0.3s' }}>
                  {saved ? '✓ 保存しました' : '今日の記録を保存'}
                </button>
              </div>
            </div>
          )}

          {/* EVENING: checklist compact */}
          {tz === 'EVENING' && (
            <div style={card()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <p style={{ ...sec(), margin:0 }}>夜のクエスト</p>
                <span style={{ fontSize:11, color:'#9CA3AF' }}>{checked}/{curTasks.length}</span>
              </div>
              <Checklist compact />
              {allDone && <div style={{ marginTop:12, padding:'12px', backgroundColor:cur.accentBg, borderRadius:8, textAlign:'center' }}><p style={{ fontSize:14, fontWeight:700, color:'#111', margin:0 }}>大人の自由時間の開幕だ</p></div>}
            </div>
          )}

          {/* News compact (non-DAY) */}
          {tz !== 'DAY' && (
            <div style={card()}>
              <p style={sec()}>育児ニュース</p>
              {news.slice(0, 6).map((item, i) => (
                <div key={i} style={{ display:'flex', gap:8, padding:'7px 0', borderBottom: i < 5 ? '1px solid #F9FAFB' : 'none' }}>
                  <span style={{ fontSize:10, color:'#9CA3AF', flexShrink:0, marginTop:1, minWidth:16 }}>{String(i+1).padStart(2,'0')}</span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'#1F2937', textDecoration:'none', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical' } as React.CSSProperties}>{item.title}</a>
                </div>
              ))}
              {news.length === 0 && <p style={{ color:'#9CA3AF', fontSize:12, textAlign:'center', padding:'10px 0' }}>取得中…</p>}
            </div>
          )}
        </div>

        {/* ══ RIGHT ═════════════════════════════════════════ */}
        <div className="dash-right" style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Milestone guide */}
          {milestone ? (
            <div style={card({ borderLeft:`3px solid ${cur.accent}` })}>
              <p style={sec(cur.accent)}>今月の攻略ガイド</p>
              <p style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:10 }}>{info.name ? `${info.name}の` : ''}{milestone.title}</p>
              {milestone.guide.map((g, i) => (
                <p key={i} style={{ fontSize:11, color:'#374151', margin:'0 0 5px', display:'flex', gap:6, alignItems:'flex-start', lineHeight:1.55 }}>
                  <span style={{ color:cur.accent, flexShrink:0 }}>◆</span>{g}
                </p>
              ))}
              <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:10, marginTop:10 }}>
                <p style={{ fontSize:9, color:'#9CA3AF', margin:'0 0 6px', fontWeight:700, letterSpacing:'0.12em' }}>CHECK</p>
                {milestone.check.map((w, i) => (
                  <p key={i} style={{ fontSize:11, color:'#6B7280', margin:'0 0 4px', display:'flex', gap:6, alignItems:'flex-start', lineHeight:1.5 }}>
                    <span style={{ color:'#9CA3AF', flexShrink:0 }}>→</span>{w}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div style={card({ borderLeft:`3px solid ${cur.accent}` })}>
              <p style={sec(cur.accent)}>今月の攻略ガイド</p>
              <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', padding:'16px 0' }}>生年月日を入力すると<br />月齢に合わせたガイドが表示されます</p>
            </div>
          )}

          {/* Attendance calendar */}
          <div style={card()}>
            <p style={sec()}>{cal.yr}年{cal.mo+1}月</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
              {['日','月','火','水','木','金','土'].map((d, i) => (
                <div key={d} style={{ fontSize:9, fontWeight:600, textAlign:'center', color: i===0?'#EF4444':i===6?'#3B82F6':'#9CA3AF', padding:'2px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
              {Array.from({ length: cal.fd }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: cal.dim }).map((_, i) => {
                const d = i + 1
                const ds = `${cal.yr}-${String(cal.mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const rec = cal.map[ds]
                const isT = ds === today()
                const att = ATTENDS.find(a => a.id === rec?.attend)
                return (
                  <div key={d} title={rec?.memo} style={{ width:'100%', aspectRatio:'1', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight: isT ? 700 : 400, backgroundColor: att ? att.bg : (isT ? cur.accentBg : '#F9FAFB'), color: att ? att.color : (isT ? cur.accent : '#6B7280'), border: isT ? `1.5px solid ${cur.accent}` : '1.5px solid transparent', cursor: rec ? 'pointer' : 'default' }}>
                    {d}
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
              {ATTENDS.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:8, height:8, borderRadius:2, backgroundColor:a.bg, border:`1px solid ${a.border}40` }} />
                  <span style={{ fontSize:9, color:'#9CA3AF' }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word ranking */}
          <div style={card()}>
            <p style={sec()}>話題ランキング</p>
            {wordRank.length === 0 ? (
              <p style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', padding:'10px 0' }}>取得中…</p>
            ) : wordRank.map((item, i) => (
              <div key={item.word} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:9, fontWeight:700, width:14, flexShrink:0, color: i < 3 ? cur.accent : '#9CA3AF' }}>{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:'#1F2937', fontWeight: i < 3 ? 600 : 400 }}>{item.word}</span>
                    <span style={{ fontSize:10, color:'#9CA3AF' }}>{item.count}</span>
                  </div>
                  <div style={{ height:3, backgroundColor:'#F3F4F6', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(item.count/maxW)*100}%`, backgroundColor: i < 3 ? cur.accent : '#D1D5DB', borderRadius:99 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
