'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import { RefreshCw, TrendingUp, Video, Dumbbell, BookMarked, Flame, BarChart2, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { formatMinutes } from '@/lib/dates'

interface AnalyticsData {
  videos: { completed: number; inProgress: number; notStarted: number; total: number; completionPercent: number }
  study: { totalActualMinutes: number; totalPlannedMinutes: number; totalLoggedMinutes: number; fullyCompletedDays: number; totalDays: number; currentStreak: number; longestStreak: number; weekly: Array<{ week: string; actualMinutes: number; completedDays: number }> }
  gym: { completedSessions: number; recoveryDays: number; totalTracked: number; totalDays: number; currentStreak: number; longestStreak: number }
  journal: { totalEntries: number; moodCounts: Record<string, number>; completionPercent: number }
}

const COLORS = { great: '#22C55E', good: '#3B82F6', average: '#EAB308', hard: '#EF4444' }
const VIDEO_COLORS = ['#EB4917', '#EAB308', '#E8E8E8']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics')
      setData(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = async (type: 'json' | 'csv') => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?type=${type}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tracker-export.${type}`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw size={24} className="animate-spin text-[#EB4917]" />
        </div>
      </AppShell>
    )
  }

  if (!data) return <AppShell><p className="text-[#9CA3AF]">No data available.</p></AppShell>

  const moodChartData = Object.entries(data.journal.moodCounts).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1), value: val
  })).filter(d => d.value > 0)

  const videoPieData = [
    { name: 'Completed', value: data.videos.completed },
    { name: 'In Progress', value: data.videos.inProgress },
    { name: 'Remaining', value: data.videos.notStarted },
  ].filter(d => d.value > 0)

  return (
    <AppShell>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Analytics</h1>
          <p className="text-[#6B7280] text-sm mt-1">Progress insights from real data</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-[#E8E8E8] rounded-xl hover:bg-[#F7F7F7] text-[#6B7280] transition-colors"
          >
            <Download size={13} /> Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-[#E8E8E8] rounded-xl hover:bg-[#F7F7F7] text-[#6B7280] transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
          <button onClick={fetchData} className="p-2 bg-white border border-[#E8E8E8] rounded-xl hover:bg-[#F7F7F7]">
            <RefreshCw size={14} className="text-[#6B7280]" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Videos Done', value: `${data.videos.completed}/22`, icon: <Video size={18} />, color: '#EB4917', pct: data.videos.completionPercent },
          { label: 'Study Days', value: `${data.study.fullyCompletedDays}/30`, icon: <TrendingUp size={18} />, color: '#3B82F6', pct: Math.round((data.study.fullyCompletedDays / 30) * 100) },
          { label: 'Gym Sessions', value: `${data.gym.completedSessions}/30`, icon: <Dumbbell size={18} />, color: '#8B5CF6', pct: Math.round((data.gym.completedSessions / 30) * 100) },
          { label: 'Journal Days', value: `${data.journal.totalEntries}/30`, icon: <BookMarked size={18} />, color: '#10B981', pct: data.journal.completionPercent },
        ].map(card => (
          <Card key={card.label}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: card.color }}>{card.icon}</span>
              <span className="text-xs text-[#9CA3AF]">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#171717] mb-2">{card.value}</p>
            <ProgressBar value={card.pct} color={card.color} size="sm" />
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Streaks */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4 flex items-center gap-2">
            <Flame size={18} className="text-[#EB4917]" /> Streaks & Hours
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Study Streak', value: data.study.currentStreak, unit: 'days', color: '#EB4917' },
              { label: 'Longest Streak', value: data.study.longestStreak, unit: 'days', color: '#EAB308' },
              { label: 'Gym Streak', value: data.gym.currentStreak, unit: 'days', color: '#8B5CF6' },
              { label: 'Study Logged', value: formatMinutes(data.study.totalLoggedMinutes), unit: '', color: '#3B82F6' },
            ].map(s => (
              <div key={s.label} className="p-3 bg-[#F7F7F7] rounded-xl">
                <p className="text-xs text-[#9CA3AF] mb-1">{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                {s.unit && <p className="text-xs text-[#9CA3AF]">{s.unit}</p>}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#6B7280]">Planned study time</span>
              <span className="font-medium">{formatMinutes(data.study.totalPlannedMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6B7280]">Actual logged time</span>
              <span className="font-medium text-[#EB4917]">{formatMinutes(data.study.totalLoggedMinutes)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6B7280]">Recovery days</span>
              <span className="font-medium">{data.gym.recoveryDays}</span>
            </div>
          </div>
        </Card>

        {/* Video Pie */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4 flex items-center gap-2">
            <Video size={18} className="text-[#EB4917]" /> Video Progress
          </h2>
          {videoPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={videoPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {videoPieData.map((_, index) => (
                    <Cell key={index} fill={VIDEO_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2">
              <BarChart2 size={36} className="text-[#E8E8E8]" />
              <p className="text-sm text-[#9CA3AF]">No video data yet. Initialize the database first.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Study Chart */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#3B82F6]" /> Weekly Study Minutes
          </h2>
          {data.study.weekly.some(w => w.actualMinutes > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.study.weekly} barSize={28}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${Number(val)} min`, 'Logged']} />
                <Bar dataKey="actualMinutes" fill="#EB4917" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2">
              <BarChart2 size={36} className="text-[#E8E8E8]" />
              <p className="text-sm text-[#9CA3AF]">Log study time to see weekly chart</p>
            </div>
          )}
        </Card>

        {/* Mood Distribution */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4 flex items-center gap-2">
            <BookMarked size={18} className="text-[#10B981]" /> Journal Mood Distribution
          </h2>
          {moodChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={moodChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {moodChartData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] ?? '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2">
              <BookMarked size={36} className="text-[#E8E8E8]" />
              <p className="text-sm text-[#9CA3AF]">Submit journal entries to see mood chart</p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
