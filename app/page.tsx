'use client'

import { useState, useEffect } from 'react'

type Mode = 'MORNING_MISSION' | 'NIGHT_WATCH' | 'EMERGENCY_CALL' | 'HOME_NURSING'
type ChildLevel = 'ANGEL' | 'MOODY' | 'DEMON'

interface Task {
  id: string
  text: string
  checked: boolean
}

const MODES = [
  { id: 'MORNING_MISSION' as Mode, label: '朝の部',    tag: '通常', accent: '#2563EB', accentBg: '#EFF6FF' },
  { id: 'NIGHT_WATCH'     as Mode, label: '夜の部',    tag: '通常', accent: '#EA580C', accentBg: '#FFF7ED' },
  { id: 'EMERGENCY_CALL'  as Mode, label: 'お迎え要請', tag: '緊急', accent: '#DC2626', accentBg: '#FEF2F2' },
  { id: 'HOME_NURSING'    as Mode, label: '病児欠勤',  tag: '停戦', accent: '#059669', accentBg: '#ECFDF5' },
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

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function buildDefaults(mode: Mode): Task[] {
  return DEFAULT_TASKS[mode].map((text) => ({ id: uid(), text, checked: false }))
}

export default function Home() {
  const [mode, setMode]               = useState<Mode>('MORNING_MISSION')
  const [childLevel, setChildLevel]   = useState<ChildLevel>('ANGEL')
  const [tasks, setTasks]             = useState<Record<Mode, Task[]> | null>(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('ikusaba_tasks')
    const savedChild = localStorage.getItem('ikusaba_child') as ChildLevel | null

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    } else {
      const init = {} as Record<Mode, Task[]>
      for (const m of MODES) init[m.id] = buildDefaults(m.id)
      setTasks(init)
    }
    if (savedChild) setChildLevel(savedChild)
  }, [])

  useEffect(() => {
    if (tasks) localStorage.setItem('ikusaba_tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('ikusaba_child', childLevel)
  }, [childLevel])

  if (!tasks) return null

  const cur          = MODES.find((m) => m.id === mode)!
  const currentTasks = tasks[mode] ?? []
  const checkedCount = currentTasks.filter((t) => t.checked).length
  const allChecked   = currentTasks.length > 0 && checkedCount === currentTasks.length
  const isDemon      = childLevel === 'DEMON'
  const progress     = currentTasks.length > 0 ? (checkedCount / currentTasks.length) * 100 : 0

  const toggleTask = (id: string) =>
    setTasks((prev) => ({
      ...prev!,
      [mode]: prev![mode].map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)),
    }))

  const deleteTask = (id: string) =>
    setTasks((prev) => ({
      ...prev!,
      [mode]: prev![mode].filter((t) => t.id !== id),
    }))

  const addTask = () => {
    const text = newTaskText.trim()
    if (!text) return
    setTasks((prev) => ({
      ...prev!,
      [mode]: [...prev![mode], { id: uid(), text, checked: false }],
    }))
    setNewTaskText('')
  }

  const resetMode = () => {
    setTasks((prev) => ({ ...prev!, [mode]: buildDefaults(mode) }))
    setShowCompletion(false)
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setShowCompletion(false)
  }

  return (
    <div className={isDemon ? 'shake-screen' : ''} style={{ minHeight: '100vh', backgroundColor: 'white' }}>

      {/* Demon banner */}
      {isDemon && (
        <div style={{
          backgroundColor: '#111',
          color: 'white',
          textAlign: 'center',
          padding: '8px',
          fontSize: '11px',
          letterSpacing: '0.25em',
          fontWeight: 600,
        }}>
          戦え、親よ
        </div>
      )}

      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${cur.accentBg}`,
        padding: '40px 24px 28px',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>
            Parenting Survival Quest
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', margin: 0 }}>
            育児サバイバル
          </h1>
          <p style={{ fontSize: 13, color: cur.accent, marginTop: 4 }}>
            {cur.tag} — {cur.label}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px 96px' }}>

        {/* ── Mode selector ── */}
        <section style={{ padding: '32px 0', borderBottom: '1px solid #F3F4F6' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 16 }}>
            Status
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {MODES.map((m) => {
              const active = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    border: `1px solid ${active ? m.accent : '#E5E7EB'}`,
                    backgroundColor: active ? m.accentBg : 'white',
                    color: active ? m.accent : '#9CA3AF',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 500, display: 'block', marginBottom: 4, opacity: 0.7 }}>
                    {m.tag}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Child condition ── */}
        <section style={{ padding: '32px 0', borderBottom: '1px solid #F3F4F6' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 16 }}>
            Child Condition
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {CHILD_CONDITIONS.map((c) => {
              const active = childLevel === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setChildLevel(c.id)}
                  style={{
                    flex: 1,
                    padding: '16px 8px',
                    border: `1px solid ${active ? '#111' : '#E5E7EB'}`,
                    backgroundColor: active ? '#111' : 'white',
                    color: active ? 'white' : '#6B7280',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{c.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, display: 'block' }}>{c.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.5, display: 'block' }}>{c.level}</span>
                </button>
              )
            })}
          </div>
          {isDemon && (
            <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', fontWeight: 700, color: '#DC2626', letterSpacing: '0.05em' }}>
              ⚠ 最大戦闘態勢で臨め
            </p>
          )}
        </section>

        {/* ── Task list ── */}
        <section style={{ paddingTop: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase' }}>
              Quest Items
            </p>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
              {checkedCount} / {currentTasks.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 24 }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: cur.accent,
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Tasks */}
          <div>
            {currentTasks.map((task) => (
              <div
                key={task.id}
                className="task-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: '1px solid #F9FAFB',
                }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: 20,
                    height: 20,
                    border: `1px solid ${task.checked ? cur.accent : '#D1D5DB'}`,
                    backgroundColor: task.checked ? cur.accent : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    padding: 0,
                  }}
                  aria-label="チェック"
                >
                  {task.checked && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: task.checked ? '#D1D5DB' : '#1F2937',
                  textDecoration: task.checked ? 'line-through' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {task.text}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="delete-btn"
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D1D5DB',
                    cursor: 'pointer',
                    fontSize: 18,
                    border: 'none',
                    backgroundColor: 'transparent',
                    padding: 0,
                    opacity: 0,
                    transition: 'opacity 0.15s, color 0.15s',
                  }}
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add task */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, paddingTop: 8 }}>
            <div style={{
              width: 20,
              height: 20,
              border: '1px dashed #D1D5DB',
              flexShrink: 0,
            }} />
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="タスクを追加..."
              style={{
                flex: 1,
                fontSize: 14,
                color: '#374151',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: '8px 0',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={addTask}
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: 'transparent',
                padding: '8px',
                fontFamily: 'inherit',
              }}
            >
              追加
            </button>
          </div>
        </section>

        {/* ── Complete button ── */}
        {allChecked && !showCompletion && (
          <button
            onClick={() => setShowCompletion(true)}
            style={{
              width: '100%',
              padding: '20px',
              backgroundColor: cur.accent,
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.2em',
              border: 'none',
              cursor: 'pointer',
              marginTop: 32,
              fontFamily: 'inherit',
            }}
          >
            クエスト完了
          </button>
        )}

        {/* ── Completion message ── */}
        {showCompletion && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '1px solid #F3F4F6',
            marginTop: 32,
          }}>
            <p style={{ fontSize: 11, letterSpacing: '0.25em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 24 }}>
              Quest Complete
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.3 }}>
              {COMPLETION[mode].main}
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 40 }}>
              {COMPLETION[mode].sub}
            </p>
            <button
              onClick={resetMode}
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              リセットして次の任務へ
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
