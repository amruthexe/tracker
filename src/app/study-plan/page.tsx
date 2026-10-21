'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import {
  CheckCircle2, Circle, Clock, Plus, Trash2, RefreshCw, Timer, Play, Pause, Square
} from 'lucide-react'
import { getTodayIST, formatMinutes, getVideoForDate, getDayType } from '@/lib/dates'
import { format } from 'date-fns'

interface StudyRecord {
  studyDate: string
  taskVideoDone: boolean
  taskCodingDone: boolean
  taskNotesDone: boolean
  taskRevisionDone: boolean
  taskFeedbackDone: boolean
  actualMinutes: number
  dayType: string
}

interface TimeLog {
  _id: string
  logDate: string
  taskName: string
  durationMinutes: number
  notes?: string
  createdAt: string
}

export default function StudyPlanPage() {
  const [today] = useState(getTodayIST())
  const [record, setRecord] = useState<StudyRecord | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [saving, setSaving] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTask, setTimerTask] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStartRef = useRef<number | null>(null)

  // Log form
  const [logTaskName, setLogTaskName] = useState('')
  const [logMinutes, setLogMinutes] = useState('')
  const [logNotes, setLogNotes] = useState('')
  const [addingLog, setAddingLog] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)

  const videoNumber = getVideoForDate(today)
  const dayType = getDayType(today)

  const fetchData = useCallback(async () => {
    const [recRes, logsRes] = await Promise.all([
      fetch(`/api/study?date=${today}`),
      fetch(`/api/study-logs?date=${today}`),
    ])
    const recData = await recRes.json()
    const logsData = await logsRes.json()
    setRecord(recData)
    setLogs(logsData)
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerStartRef.current = Date.now() - timerSeconds * 1000
      timerRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - (timerStartRef.current ?? Date.now())) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning])

  const stopTimerAndLog = async () => {
    setTimerRunning(false)
    const minutes = Math.floor(timerSeconds / 60)
    if (minutes < 1) { setTimerSeconds(0); return }
    try {
      await fetch('/api/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: today,
          taskName: timerTask || 'Study Session',
          durationMinutes: minutes,
        }),
      })
      // Update actual minutes
      const newTotal = (record?.actualMinutes ?? 0) + minutes
      await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyDate: today, actualMinutes: newTotal }),
      })
      setTimerSeconds(0)
      setTimerTask('')
      await fetchData()
    } catch (e) { console.error(e) }
  }

  const handleTaskToggle = async (task: keyof StudyRecord) => {
    setSaving(true)
    try {
      await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyDate: today, [task]: !(record?.[task] ?? false) }),
      })
      await fetchData()
    } finally { setSaving(false) }
  }

  const handleAddLog = async () => {
    if (!logTaskName || !logMinutes) return
    setAddingLog(true)
    try {
      await fetch('/api/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: today,
          taskName: logTaskName,
          durationMinutes: parseInt(logMinutes),
          notes: logNotes,
        }),
      })
      // Update total
      const newTotal = (record?.actualMinutes ?? 0) + parseInt(logMinutes)
      await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyDate: today, actualMinutes: newTotal }),
      })
      setLogTaskName(''); setLogMinutes(''); setLogNotes('')
      setShowLogForm(false)
      await fetchData()
    } finally { setAddingLog(false) }
  }

  const handleDeleteLog = async (id: string, minutes: number) => {
    if (!confirm('Delete this log entry?')) return
    await fetch(`/api/study-logs?id=${id}`, { method: 'DELETE' })
    const newTotal = Math.max(0, (record?.actualMinutes ?? 0) - minutes)
    await fetch('/api/study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studyDate: today, actualMinutes: newTotal }),
    })
    await fetchData()
  }

  const tasks = [
    { key: 'taskVideoDone' as keyof StudyRecord, label: `📹 Watch video ${videoNumber ? `#${videoNumber}` : ''} (2h 30m)`, enabled: dayType === 'video' },
    { key: 'taskCodingDone' as keyof StudyRecord, label: '💻 Coding practice & implementation (1h)', enabled: true },
    { key: 'taskNotesDone' as keyof StudyRecord, label: '📝 Write notes (30m)', enabled: true },
    { key: 'taskRevisionDone' as keyof StudyRecord, label: '🔁 Revise & recall concepts (30m)', enabled: true },
    { key: 'taskFeedbackDone' as keyof StudyRecord, label: '📋 Submit daily feedback', enabled: true },
  ]

  const completedTasks = tasks.filter(t => record?.[t.key]).length
  const timerDisplay = `${String(Math.floor(timerSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#171717]">Study Plan</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {format(new Date(today), 'EEEE, d MMMM yyyy')} •{' '}
          <Badge variant={dayType === 'video' ? 'orange' : dayType === 'project' ? 'blue' : 'default'} size="sm">
            {dayType === 'video' ? `Video Day ${videoNumber ? `#${videoNumber}` : ''}` : dayType === 'project' ? 'Project Day' : 'Off Day'}
          </Badge>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#171717]">Today&apos;s Study Tasks</h2>
              <Badge variant={completedTasks === tasks.length ? 'success' : 'default'}>
                {completedTasks}/{tasks.length} done
              </Badge>
            </div>
            <div className="space-y-1 mb-4">
              {tasks.map(t => (
                <button
                  key={t.key}
                  onClick={() => t.enabled && handleTaskToggle(t.key)}
                  disabled={!t.enabled || saving}
                  className={`flex items-center gap-3 w-full py-3 px-2 rounded-xl hover:bg-[#F7F7F7] text-left transition-colors ${!t.enabled ? 'opacity-40' : ''}`}
                >
                  {record?.[t.key]
                    ? <CheckCircle2 size={20} className="text-[#EB4917] shrink-0" />
                    : <Circle size={20} className="text-[#D1D5DB] shrink-0" />
                  }
                  <span className={`text-sm ${record?.[t.key] ? 'line-through text-[#9CA3AF]' : 'text-[#171717]'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Actual time */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F7F7F7]">
              <div>
                <p className="text-xs text-[#9CA3AF]">Planned: 4h 00m</p>
                <p className="text-sm font-semibold text-[#171717]">Logged: {formatMinutes(record?.actualMinutes ?? 0)}</p>
              </div>
              <div className="w-32">
                <div className="w-full bg-[#F7F7F7] rounded-full h-2">
                  <div
                    className="h-2 bg-[#EB4917] rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((record?.actualMinutes ?? 0) / 240) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1 text-right">
                  {Math.min(100, Math.round(((record?.actualMinutes ?? 0) / 240) * 100))}%
                </p>
              </div>
            </div>
          </Card>

          {/* Timer */}
          <Card>
            <h2 className="font-semibold text-[#171717] mb-4 flex items-center gap-2">
              <Timer size={18} className="text-[#EB4917]" /> Study Timer
            </h2>
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl font-bold text-[#171717] font-mono tracking-wider">{timerDisplay}</div>
              <input
                type="text"
                placeholder="What are you working on?"
                value={timerTask}
                onChange={e => setTimerTask(e.target.value)}
                className="w-full max-w-xs text-sm text-center border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
              />
              <div className="flex gap-3">
                {!timerRunning ? (
                  <Button onClick={() => setTimerRunning(true)} leftIcon={<Play size={16} />}>Start</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setTimerRunning(false)} leftIcon={<Pause size={16} />}>Pause</Button>
                )}
                {timerSeconds > 0 && (
                  <Button variant="danger" onClick={stopTimerAndLog} leftIcon={<Square size={16} />}>Stop & Log</Button>
                )}
              </div>
            </div>
          </Card>

          {/* Time Logs */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#171717]">Time Logs</h2>
              <Button size="sm" variant="secondary" onClick={() => setShowLogForm(!showLogForm)} leftIcon={<Plus size={14} />}>
                Add Log
              </Button>
            </div>

            {showLogForm && (
              <div className="bg-[#F7F7F7] rounded-xl p-4 mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Task name *"
                  value={logTaskName}
                  onChange={e => setLogTaskName(e.target.value)}
                  className="w-full text-sm border border-[#E8E8E8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917]"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Duration (mins) *"
                    value={logMinutes}
                    onChange={e => setLogMinutes(e.target.value)}
                    className="flex-1 text-sm border border-[#E8E8E8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  className="w-full text-sm border border-[#E8E8E8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917]"
                />
                <div className="flex gap-2">
                  <Button size="sm" loading={addingLog} onClick={handleAddLog}>Save Log</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowLogForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {logs.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Clock size={32} className="text-[#E8E8E8]" />
                <p className="text-sm text-[#9CA3AF]">No time logs for today yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log._id} className="flex items-center gap-3 py-2 px-3 bg-[#F7F7F7] rounded-xl">
                    <Clock size={14} className="text-[#EB4917] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171717] truncate">{log.taskName}</p>
                      {log.notes && <p className="text-xs text-[#9CA3AF] truncate">{log.notes}</p>}
                    </div>
                    <Badge variant="orange">{formatMinutes(log.durationMinutes)}</Badge>
                    <button
                      onClick={() => handleDeleteLog(log._id, log.durationMinutes)}
                      className="p-1 hover:bg-red-100 rounded-lg text-[#9CA3AF] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-right text-[#9CA3AF] pt-1">
                  Total: {formatMinutes(logs.reduce((s, l) => s + l.durationMinutes, 0))}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Info */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-[#171717] mb-3">Today&apos;s Target</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">📹 Video</span>
                <span className="font-medium">2h 30m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">💻 Coding</span>
                <span className="font-medium">1h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">📝 Notes</span>
                <span className="font-medium">30m</span>
              </div>
              <div className="border-t border-[#F7F7F7] pt-2 flex justify-between text-sm font-semibold">
                <span className="text-[#171717]">Total</span>
                <span className="text-[#EB4917]">4h 00m</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-[#171717] mb-3">Refresh Data</h2>
            <Button variant="secondary" size="sm" onClick={fetchData} leftIcon={<RefreshCw size={14} />}>
              Reload
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
