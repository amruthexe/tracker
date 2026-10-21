'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  Sun, Flame, Dumbbell, BookMarked, Video,
  TrendingUp, CheckCircle2, Circle, Clock, Zap,
  ChevronRight, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react'
import { formatDate, formatMinutes, getShiftLabel, getTodayIST } from '@/lib/dates'
import Link from 'next/link'
import NotificationBell from '@/components/notifications/NotificationBell'

interface DashboardData {
  todayDate: string
  todayShift: string
  completedVideos: number
  totalVideos: number
  completedStudyDays: number
  totalDays: number
  completedGymSessions: number
  totalStudyMinutes: number
  recentJournalEntries: Array<{ _id: string; entryDate: string; mood: string; whatLearned?: string }>
  currentStreak: number
  longestStreak: number
  todayStudyRecord?: {
    taskVideoDone: boolean; taskCodingDone: boolean; taskNotesDone: boolean
    taskRevisionDone: boolean; taskFeedbackDone: boolean; actualMinutes: number
  } | null
  todayGymSession?: { completedAt?: string; actualMinutes?: number } | null
  todayJournalEntry?: { _id: string; mood: string } | null
  todayVideo?: { videoNumber: number; title: string; durationMinutes: number } | null
}

const MOOD_EMOJI: Record<string, string> = { great: '🤩', good: '😊', average: '😐', hard: '😓' }

const SHIFT_STYLE: Record<string, { badge: 'blue' | 'orange' | 'purple' | 'green'; emoji: string }> = {
  S1:  { badge: 'blue',   emoji: '🌅' },
  S2:  { badge: 'orange', emoji: '☀️' },
  S3:  { badge: 'purple', emoji: '🌙' },
  OFF: { badge: 'green',  emoji: '🏖️' },
}

/* ── Mini stat tile ── */
function StatTile({ label, value, total, icon, color, href }: {
  label: string; value: number; total: number
  icon: React.ReactNode; color: string; href: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 active:scale-[.98] transition-transform">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <span className="text-lg font-bold text-[#171717]">{value}<span className="text-xs font-normal text-[#9CA3AF]">/{total}</span></span>
        </div>
        <p className="text-xs text-[#6B7280] font-medium mb-2 leading-tight">{label}</p>
        <ProgressBar value={pct} color={color} size="sm" />
      </div>
    </Link>
  )
}

/* ── Task row ── */
function TaskRow({ done, label, onToggle, saving }: {
  done: boolean; label: string; onToggle: () => void; saving: boolean
}) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      className="flex items-center gap-3 w-full py-3 px-2 rounded-xl active:bg-[#F7F7F7] text-left transition-colors"
    >
      {done
        ? <CheckCircle2 size={20} className="text-[#EB4917] shrink-0" />
        : <Circle size={20} className="text-[#D1D5DB] shrink-0" />}
      <span className={`text-sm leading-snug ${done ? 'line-through text-[#9CA3AF]' : 'text-[#171717]'}`}>{label}</span>
    </button>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [savingTask, setSavingTask] = useState<string | null>(null)

  const today = getTodayIST()

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      await fetchDashboard()
    } finally { setSeeding(false) }
  }

  const handleTaskToggle = async (task: string, currentValue: boolean) => {
    if (!data) return
    setSavingTask(task)
    try {
      await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyDate: data.todayDate, [task]: !currentValue }),
      })
      await fetchDashboard()
    } finally { setSavingTask(null) }
  }

  const handleGymToggle = async () => {
    if (!data) return
    setSavingTask('gym')
    try {
      await fetch('/api/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: data.todayDate,
          completed: !data.todayGymSession?.completedAt,
          actualMinutes: 90,
        }),
      })
      await fetchDashboard()
    } finally { setSavingTask(null) }
  }

  /* ── Loading ── */
  if (loading) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] flex items-center justify-center">
          <RefreshCw size={22} className="text-[#EB4917] animate-spin" />
        </div>
        <p className="text-sm text-[#6B7280]">Loading your tracker…</p>
      </div>
    </AppShell>
  )

  /* ── Error ── */
  if (error) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <AlertCircle size={40} className="text-red-400" />
        <p className="font-semibold text-[#171717]">Could not load dashboard</p>
        <p className="text-sm text-[#9CA3AF]">{error}</p>
        <Button onClick={fetchDashboard}>Retry</Button>
      </div>
    </AppShell>
  )

  const isFirstLaunch = data && data.completedVideos === 0 && data.completedStudyDays === 0

  const shiftStyle = SHIFT_STYLE[data?.todayShift ?? 'S2']
  const completedTasks = [
    data?.todayStudyRecord?.taskVideoDone,
    data?.todayStudyRecord?.taskCodingDone,
    data?.todayStudyRecord?.taskNotesDone,
    data?.todayStudyRecord?.taskRevisionDone,
    data?.todayStudyRecord?.taskFeedbackDone,
  ].filter(Boolean).length

  return (
    <AppShell>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sun size={18} className="text-[#EB4917]" />
            <h1 className="text-lg sm:text-xl font-bold text-[#171717]">Hi, good day! 👋</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          <button onClick={fetchDashboard} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-[#9CA3AF]">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── SHIFT BADGE ── */}
      {data && (
        <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <Badge variant={shiftStyle.badge} size="md">
              {shiftStyle.emoji} {data.todayShift === 'OFF' ? 'Day Off (No Office Shift)' : `${data.todayShift} — ${getShiftLabel(data.todayShift)}`}
            </Badge>
            {data.todayShift === 'OFF' && (
              <span className="text-xs text-[#EB4917] font-semibold bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                ⏰ 9:30 AM Study Alert
              </span>
            )}
          </div>
          <Link href="/timetable" className="text-xs font-semibold text-[#EB4917] hover:underline flex items-center gap-1">
            View Today&apos;s Timetable →
          </Link>
        </div>
      )}

      {/* ── FIRST LAUNCH ── */}
      {isFirstLaunch && (
        <div className="mb-5 bg-white border-2 border-dashed border-[#E8E8E8] rounded-2xl p-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0EB] flex items-center justify-center">
              <Sparkles size={26} className="text-[#EB4917]" />
            </div>
            <h2 className="font-bold text-[#171717]">Welcome! 🎉</h2>
            <p className="text-sm text-[#6B7280] max-w-xs">
              Initialize the database to seed your 22 videos and shift schedule.
            </p>
            <Button onClick={handleSeed} loading={seeding} leftIcon={<Zap size={15} />}>
              Initialize Database
            </Button>
          </div>
        </div>
      )}

      {/* ── TODAY'S VIDEO BANNER ── */}
      {data?.todayVideo && (
        <Link href="/videos">
          <div className="mb-5 bg-white rounded-2xl border border-[#E8E8E8] border-l-4 border-l-[#EB4917] p-4 active:scale-[.99] transition-transform">
            <p className="text-[10px] font-bold tracking-widest text-[#EB4917] uppercase mb-1">Today's Video</p>
            <p className="text-sm font-semibold text-[#171717] leading-snug">
              #{data.todayVideo.videoNumber} — {data.todayVideo.title}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">⏱ {formatMinutes(data.todayVideo.durationMinutes)}</p>
          </div>
        </Link>
      )}

      {/* ── STAT GRID: 2×2 on mobile, 4 cols on lg ── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatTile label="Videos Done"   value={data.completedVideos}     total={data.totalVideos} icon={<Video size={17}/>}     color="#EB4917" href="/videos"     />
          <StatTile label="Study Days"    value={data.completedStudyDays}  total={data.totalDays}   icon={<TrendingUp size={17}/>} color="#3B82F6" href="/study-plan" />
          <StatTile label="Gym Sessions"  value={data.completedGymSessions}total={data.totalDays}   icon={<Dumbbell size={17}/>}  color="#8B5CF6" href="/fitness"    />
          <StatTile label="Study Hours"   value={Math.round(data.totalStudyMinutes/60)} total={30*4} icon={<Clock size={17}/>}    color="#10B981" href="/analytics"  />
        </div>
      )}

      {/* ── STREAKS ROW ── */}
      {data && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 flex items-center gap-3">
            <Flame size={22} className="text-[#EB4917] shrink-0" />
            <div>
              <p className="text-xl font-bold text-[#171717]">{data.currentStreak}<span className="text-xs font-normal text-[#9CA3AF]"> days</span></p>
              <p className="text-xs text-[#9CA3AF]">Current streak</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-4 flex items-center gap-3">
            <Zap size={22} className="text-yellow-500 shrink-0" />
            <div>
              <p className="text-xl font-bold text-[#171717]">{data.longestStreak}<span className="text-xs font-normal text-[#9CA3AF]"> days</span></p>
              <p className="text-xs text-[#9CA3AF]">Best streak</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT GRID: stacked on mobile, 3-col on lg ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Tasks + Gym + Journal — takes 2 cols on lg */}
        <div className="lg:col-span-2 space-y-4">

          {/* Study Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#171717] text-sm sm:text-base">Today&apos;s Tasks</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{completedTasks}/5</span>
                <Link href="/study-plan">
                  <button className="text-xs text-[#EB4917] font-medium flex items-center gap-0.5">
                    View <ChevronRight size={12} />
                  </button>
                </Link>
              </div>
            </div>

            {/* Progress mini-bar */}
            <div className="mb-3">
              <ProgressBar value={(completedTasks / 5) * 100} color="#EB4917" size="sm" />
            </div>

            <div className="space-y-0">
              <TaskRow done={!!data?.todayStudyRecord?.taskVideoDone}    label="📹 Watch today's video (2h 30m)"   onToggle={() => handleTaskToggle('taskVideoDone',    !!data?.todayStudyRecord?.taskVideoDone)}    saving={savingTask === 'taskVideoDone'} />
              <TaskRow done={!!data?.todayStudyRecord?.taskCodingDone}   label="💻 Coding practice (1h)"           onToggle={() => handleTaskToggle('taskCodingDone',   !!data?.todayStudyRecord?.taskCodingDone)}   saving={savingTask === 'taskCodingDone'} />
              <TaskRow done={!!data?.todayStudyRecord?.taskNotesDone}    label="📝 Write notes (30m)"              onToggle={() => handleTaskToggle('taskNotesDone',    !!data?.todayStudyRecord?.taskNotesDone)}    saving={savingTask === 'taskNotesDone'} />
              <TaskRow done={!!data?.todayStudyRecord?.taskRevisionDone} label="🔁 Revise concepts (30m)"          onToggle={() => handleTaskToggle('taskRevisionDone', !!data?.todayStudyRecord?.taskRevisionDone)} saving={savingTask === 'taskRevisionDone'} />
              <TaskRow done={!!data?.todayStudyRecord?.taskFeedbackDone} label="📋 Submit daily feedback"          onToggle={() => handleTaskToggle('taskFeedbackDone', !!data?.todayStudyRecord?.taskFeedbackDone)} saving={savingTask === 'taskFeedbackDone'} />
            </div>
          </Card>

          {/* Gym + Journal — side by side on sm+ */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Gym */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${data?.todayGymSession?.completedAt ? 'bg-purple-100' : 'bg-[#F7F7F7]'}`}>
                  <Dumbbell size={18} className={data?.todayGymSession?.completedAt ? 'text-purple-600' : 'text-[#9CA3AF]'} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#171717] truncate">Gym Session</p>
                  <p className="text-xs text-[#9CA3AF]">Target: 90 min</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={data?.todayGymSession?.completedAt ? 'secondary' : 'primary'}
                  onClick={handleGymToggle}
                  loading={savingTask === 'gym'}
                  className="flex-1"
                >
                  {data?.todayGymSession?.completedAt ? 'Undo ✓' : 'Mark Done'}
                </Button>
                <Link href="/fitness" className="flex-1">
                  <Button size="sm" variant="ghost" className="w-full">Log Details</Button>
                </Link>
              </div>
            </Card>

            {/* Journal */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${data?.todayJournalEntry ? 'bg-green-100' : 'bg-[#F7F7F7]'}`}>
                  <BookMarked size={18} className={data?.todayJournalEntry ? 'text-green-600' : 'text-[#9CA3AF]'} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#171717] truncate">Daily Journal</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {data?.todayJournalEntry
                      ? `${MOOD_EMOJI[data.todayJournalEntry.mood]} ${data.todayJournalEntry.mood}`
                      : 'Not written yet'}
                  </p>
                </div>
              </div>
              <Link href="/journal" className="block">
                <Button size="sm" variant={data?.todayJournalEntry ? 'secondary' : 'primary'} className="w-full">
                  {data?.todayJournalEntry ? 'Edit Entry' : 'Write Journal'}
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* 30-Day Progress */}
          {data && (
            <Card>
              <h2 className="font-semibold text-[#171717] mb-4 text-sm sm:text-base">30-Day Progress</h2>
              <div className="space-y-4">
                <ProgressBar value={Math.round((data.completedVideos / data.totalVideos) * 100)}      label="Videos"      color="#EB4917" showPercent />
                <ProgressBar value={Math.round((data.completedStudyDays / data.totalDays) * 100)}    label="Study Days"  color="#3B82F6" showPercent />
                <ProgressBar value={Math.round((data.completedGymSessions / data.totalDays) * 100)} label="Gym"         color="#8B5CF6" showPercent />
              </div>
            </Card>
          )}

          {/* Recent Journal */}
          {data?.recentJournalEntries && data.recentJournalEntries.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[#171717] text-sm sm:text-base">Recent Journal</h2>
                <Link href="/journal">
                  <button className="text-xs text-[#EB4917] font-medium flex items-center gap-0.5">
                    All <ChevronRight size={12} />
                  </button>
                </Link>
              </div>
              <div className="space-y-2">
                {data.recentJournalEntries.map(entry => (
                  <div key={entry._id} className="flex items-center gap-2 py-1.5 border-b border-[#F7F7F7] last:border-0">
                    <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#171717]">{entry.entryDate}</p>
                      {entry.whatLearned && (
                        <p className="text-xs text-[#9CA3AF] truncate">{entry.whatLearned}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
