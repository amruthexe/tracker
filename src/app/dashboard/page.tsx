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
  Calendar, ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react'
import { formatDate, formatMinutes, getShiftLabel, getTodayIST } from '@/lib/dates'
import Link from 'next/link'

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
const MOOD_COLOR: Record<string, string> = {
  great: 'text-green-600', good: 'text-blue-600', average: 'text-yellow-600', hard: 'text-red-500'
}

function StatCard({ label, value, total, icon, color }: {
  label: string; value: number; total: number; icon: React.ReactNode; color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <Card className="flex-1">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-2xl font-bold text-[#171717]">{value}<span className="text-base font-normal text-[#9CA3AF]">/{total}</span></span>
      </div>
      <p className="text-sm text-[#6B7280] font-medium mb-2">{label}</p>
      <ProgressBar value={pct} color={color} size="sm" />
      <p className="text-xs text-[#9CA3AF] mt-1">{pct}% complete</p>
    </Card>
  )
}

function TaskItem({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full py-2 px-1 rounded-lg hover:bg-[#F7F7F7] text-left transition-colors"
    >
      {done
        ? <CheckCircle2 size={18} className="text-[#EB4917] shrink-0" />
        : <Circle size={18} className="text-[#D1D5DB] shrink-0" />
      }
      <span className={`text-sm ${done ? 'line-through text-[#9CA3AF]' : 'text-[#171717]'}`}>{label}</span>
    </button>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [savingTask, setSavingTask] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      const json = await res.json()
      setData(json)
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
    } finally {
      setSeeding(false)
    }
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
    } finally {
      setSavingTask(null)
    }
  }

  const handleGymToggle = async () => {
    if (!data) return
    setSavingTask('gym')
    try {
      const isCompleted = !!data.todayGymSession?.completedAt
      await fetch('/api/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: data.todayDate,
          completed: !isCompleted,
          actualMinutes: 90,
        }),
      })
      await fetchDashboard()
    } finally {
      setSavingTask(null)
    }
  }

  const today = getTodayIST()

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-[#6B7280]">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm">Loading your tracker...</span>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-[#171717] font-medium">Could not load dashboard</p>
          <p className="text-sm text-[#9CA3AF]">{error}</p>
          <Button onClick={fetchDashboard}>Retry</Button>
        </div>
      </AppShell>
    )
  }

  const isFirstLaunch = !data || (data.completedVideos === 0 && data.completedStudyDays === 0 && data.completedGymSessions === 0)

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sun size={20} className="text-[#EB4917]" />
            <h1 className="text-xl font-bold text-[#171717]">Hi, good day! 👋</h1>
          </div>
          <p className="text-[#6B7280] text-sm">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Badge variant={
              data.todayShift === 'S1' ? 'blue' :
              data.todayShift === 'S2' ? 'orange' :
              data.todayShift === 'S3' ? 'purple' : 'green'
            } size="md">
              {data.todayShift === 'OFF' ? '🏖️ Day Off' : `⏰ ${data.todayShift}: ${getShiftLabel(data.todayShift)}`}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={fetchDashboard}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* First launch empty state */}
      {isFirstLaunch && (
        <Card className="mb-6 border-dashed border-2 border-[#E8E8E8]">
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0EB] flex items-center justify-center">
              <Zap size={28} className="text-[#EB4917]" />
            </div>
            <h2 className="text-lg font-semibold text-[#171717]">Welcome to your 30-Day Tracker!</h2>
            <p className="text-sm text-[#6B7280] text-center max-w-md">
              Click <strong>Initialize Database</strong> to seed the 22 videos and shift schedule into MongoDB, then start tracking!
            </p>
            <Button onClick={handleSeed} loading={seeding} leftIcon={<Zap size={16} />}>
              Initialize Database
            </Button>
          </div>
        </Card>
      )}

      {/* Today's Video Banner */}
      {data?.todayVideo && (
        <Card className="mb-6 border-l-4 border-l-[#EB4917]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] flex items-center justify-center">
                <Video size={18} className="text-[#EB4917]" />
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] font-medium">TODAY&apos;S VIDEO</p>
                <p className="text-sm font-semibold text-[#171717]">
                  #{data.todayVideo.videoNumber} — {data.todayVideo.title}
                </p>
                <p className="text-xs text-[#6B7280]">⏱ {formatMinutes(data.todayVideo.durationMinutes)}</p>
              </div>
            </div>
            <Link href="/videos">
              <Button size="sm" variant="secondary">
                Go to Videos <ChevronRight size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats Row */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Videos Completed"
            value={data.completedVideos}
            total={data.totalVideos}
            icon={<Video size={20} />}
            color="#EB4917"
          />
          <StatCard
            label="Study Days"
            value={data.completedStudyDays}
            total={data.totalDays}
            icon={<TrendingUp size={20} />}
            color="#3B82F6"
          />
          <StatCard
            label="Gym Sessions"
            value={data.completedGymSessions}
            total={data.totalDays}
            icon={<Dumbbell size={20} />}
            color="#8B5CF6"
          />
          <StatCard
            label="Study Hours"
            value={Math.round(data.totalStudyMinutes / 60)}
            total={30 * 4}
            icon={<Clock size={20} />}
            color="#10B981"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#171717]">Today&apos;s Study Tasks</h2>
              <Link href="/study-plan">
                <Button size="sm" variant="ghost">View Plan <ChevronRight size={14} /></Button>
              </Link>
            </div>
            <div className="space-y-0.5">
              <TaskItem
                done={!!data?.todayStudyRecord?.taskVideoDone}
                label="📹 Watch today's video (2h 30m)"
                onToggle={() => handleTaskToggle('taskVideoDone', !!data?.todayStudyRecord?.taskVideoDone)}
              />
              <TaskItem
                done={!!data?.todayStudyRecord?.taskCodingDone}
                label="💻 Coding practice (1h)"
                onToggle={() => handleTaskToggle('taskCodingDone', !!data?.todayStudyRecord?.taskCodingDone)}
              />
              <TaskItem
                done={!!data?.todayStudyRecord?.taskNotesDone}
                label="📝 Write notes (30m)"
                onToggle={() => handleTaskToggle('taskNotesDone', !!data?.todayStudyRecord?.taskNotesDone)}
              />
              <TaskItem
                done={!!data?.todayStudyRecord?.taskRevisionDone}
                label="🔁 Revise concepts (30m)"
                onToggle={() => handleTaskToggle('taskRevisionDone', !!data?.todayStudyRecord?.taskRevisionDone)}
              />
              <TaskItem
                done={!!data?.todayStudyRecord?.taskFeedbackDone}
                label="📋 Submit daily feedback"
                onToggle={() => handleTaskToggle('taskFeedbackDone', !!data?.todayStudyRecord?.taskFeedbackDone)}
              />
            </div>
            {savingTask && (
              <p className="text-xs text-[#9CA3AF] mt-3 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Saving...
              </p>
            )}
          </Card>

          {/* Gym Card */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  data?.todayGymSession?.completedAt ? 'bg-purple-100' : 'bg-[#F7F7F7]'
                }`}>
                  <Dumbbell size={18} className={data?.todayGymSession?.completedAt ? 'text-purple-600' : 'text-[#9CA3AF]'} />
                </div>
                <div>
                  <p className="font-medium text-[#171717] text-sm">Today&apos;s Gym Session</p>
                  <p className="text-xs text-[#9CA3AF]">Target: 90 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data?.todayGymSession?.completedAt && (
                  <Badge variant="success">Done ✓</Badge>
                )}
                <Button
                  size="sm"
                  variant={data?.todayGymSession?.completedAt ? 'secondary' : 'primary'}
                  onClick={handleGymToggle}
                  loading={savingTask === 'gym'}
                >
                  {data?.todayGymSession?.completedAt ? 'Undo' : 'Mark Done'}
                </Button>
                <Link href="/fitness">
                  <Button size="sm" variant="ghost">Log <ChevronRight size={14} /></Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Journal Status */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  data?.todayJournalEntry ? 'bg-green-100' : 'bg-[#F7F7F7]'
                }`}>
                  <BookMarked size={18} className={data?.todayJournalEntry ? 'text-green-600' : 'text-[#9CA3AF]'} />
                </div>
                <div>
                  <p className="font-medium text-[#171717] text-sm">Daily Journal</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {data?.todayJournalEntry
                      ? `Mood: ${MOOD_EMOJI[data.todayJournalEntry.mood]} ${data.todayJournalEntry.mood}`
                      : 'Not submitted yet'}
                  </p>
                </div>
              </div>
              <Link href="/journal">
                <Button size="sm" variant={data?.todayJournalEntry ? 'secondary' : 'primary'}>
                  {data?.todayJournalEntry ? 'Edit Entry' : 'Write Journal'}
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Streaks */}
          {data && (
            <Card>
              <h2 className="font-semibold text-[#171717] mb-4">Streaks 🔥</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B7280]">Current streak</span>
                  <div className="flex items-center gap-1.5">
                    <Flame size={16} className="text-[#EB4917]" />
                    <span className="font-bold text-[#171717]">{data.currentStreak} days</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B7280]">Longest streak</span>
                  <div className="flex items-center gap-1.5">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="font-bold text-[#171717]">{data.longestStreak} days</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B7280]">Study hours</span>
                  <span className="font-bold text-[#171717]">{formatMinutes(data.totalStudyMinutes)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Overall Progress */}
          {data && (
            <Card>
              <h2 className="font-semibold text-[#171717] mb-4">30-Day Progress</h2>
              <div className="space-y-4">
                <div>
                  <ProgressBar
                    value={Math.round((data.completedVideos / data.totalVideos) * 100)}
                    label="Videos"
                    color="#EB4917"
                    showPercent
                  />
                </div>
                <div>
                  <ProgressBar
                    value={Math.round((data.completedStudyDays / data.totalDays) * 100)}
                    label="Study Days"
                    color="#3B82F6"
                    showPercent
                  />
                </div>
                <div>
                  <ProgressBar
                    value={Math.round((data.completedGymSessions / data.totalDays) * 100)}
                    label="Gym Sessions"
                    color="#8B5CF6"
                    showPercent
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Recent Journal */}
          {data?.recentJournalEntries && data.recentJournalEntries.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[#171717]">Recent Journal</h2>
                <Link href="/journal">
                  <Button size="sm" variant="ghost"><ChevronRight size={14} /></Button>
                </Link>
              </div>
              <div className="space-y-2">
                {data.recentJournalEntries.map(entry => (
                  <div key={entry._id} className="flex items-start gap-2 py-2 border-b border-[#F7F7F7] last:border-0">
                    <span className="text-lg">{MOOD_EMOJI[entry.mood]}</span>
                    <div>
                      <p className="text-xs font-medium text-[#171717]">{entry.entryDate}</p>
                      <p className={`text-xs ${MOOD_COLOR[entry.mood]}`}>{entry.mood}</p>
                      {entry.whatLearned && (
                        <p className="text-xs text-[#9CA3AF] line-clamp-1">{entry.whatLearned}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <h2 className="font-semibold text-[#171717] mb-3">Quick Links</h2>
            <div className="space-y-1">
              {[
                { href: '/videos', label: 'Course Videos', icon: <Video size={14} /> },
                { href: '/timetable', label: 'Daily Timetable', icon: <Calendar size={14} /> },
                { href: '/analytics', label: 'Analytics', icon: <TrendingUp size={14} /> },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-[#F7F7F7] text-sm text-[#6B7280] hover:text-[#171717] transition-colors"
                >
                  {item.icon} {item.label}
                  <ChevronRight size={12} className="ml-auto" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
