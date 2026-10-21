'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Dumbbell, CheckCircle2, RefreshCw, Plus, ChevronDown, ChevronUp, Star, Calendar } from 'lucide-react'
import { getTodayIST, formatMinutes } from '@/lib/dates'
import { format } from 'date-fns'

interface GymSession {
  _id: string
  sessionDate: string
  plannedMinutes: number
  actualMinutes?: number
  workoutType?: string
  exercises?: string
  energyLevel?: number
  isRecoveryDay: boolean
  notes?: string
  completedAt?: string
}

const WORKOUT_TYPES = ['Strength Training', 'Cardio', 'HIIT', 'Yoga', 'Calisthenics', 'Running', 'Swimming', 'Mixed']

export default function FitnessPage() {
  const today = getTodayIST()
  const [sessions, setSessions] = useState<GymSession[]>([])
  const [todaySession, setTodaySession] = useState<GymSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [selectedDate, setSelectedDate] = useState(today)
  const [actualMinutes, setActualMinutes] = useState('90')
  const [workoutType, setWorkoutType] = useState('')
  const [exercises, setExercises] = useState('')
  const [energyLevel, setEnergyLevel] = useState(3)
  const [notes, setNotes] = useState('')
  const [isRecovery, setIsRecovery] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [allRes, todayRes] = await Promise.all([
        fetch('/api/gym'),
        fetch(`/api/gym?date=${today}`),
      ])
      const allData = await allRes.json()
      const todayData = await todayRes.json()
      setSessions(allData)
      setTodaySession(Array.isArray(todayData) ? todayData[0] ?? null : null)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const handleQuickComplete = async () => {
    setSaving(true)
    try {
      await fetch('/api/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: today,
          completed: !todaySession?.completedAt,
          actualMinutes: 90,
        }),
      })
      await fetchData()
    } finally { setSaving(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await fetch('/api/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: selectedDate,
          actualMinutes: parseInt(actualMinutes) || 90,
          workoutType,
          exercises,
          energyLevel,
          notes,
          isRecoveryDay: isRecovery,
          completed: !isRecovery,
        }),
      })
      setShowForm(false)
      await fetchData()
    } finally { setSaving(false) }
  }

  const completedSessions = sessions.filter(s => s.completedAt && !s.isRecoveryDay)
  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.actualMinutes ?? 90), 0)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw size={24} className="animate-spin text-[#EB4917]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#171717]">Fitness Tracker</h1>
        <p className="text-[#6B7280] text-sm mt-1">Daily gym goal: 90 minutes</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Today's session card */}
          <Card className={`border-2 ${todaySession?.completedAt ? 'border-purple-200 bg-purple-50/30' : 'border-[#E8E8E8]'}`}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  todaySession?.completedAt ? 'bg-purple-100' : 'bg-[#F7F7F7]'
                }`}>
                  <Dumbbell size={24} className={todaySession?.completedAt ? 'text-purple-600' : 'text-[#9CA3AF]'} />
                </div>
                <div>
                  <h2 className="font-semibold text-[#171717]">Today&apos;s Gym Session</h2>
                  <p className="text-xs text-[#9CA3AF]">{format(new Date(today), 'EEEE, d MMM')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {todaySession?.isRecoveryDay && <Badge variant="info">Recovery Day</Badge>}
                {todaySession?.completedAt && <Badge variant="success">✅ Done</Badge>}
              </div>
            </div>

            {todaySession?.completedAt && (
              <div className="flex items-center gap-4 flex-wrap mb-4 p-3 bg-white rounded-xl border border-[#E8E8E8]">
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-600">{formatMinutes(todaySession.actualMinutes ?? 90)}</p>
                  <p className="text-xs text-[#9CA3AF]">Duration</p>
                </div>
                {todaySession.workoutType && (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#171717]">{todaySession.workoutType}</p>
                    <p className="text-xs text-[#9CA3AF]">Type</p>
                  </div>
                )}
                {todaySession.energyLevel && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < todaySession.energyLevel! ? 'text-yellow-400 fill-yellow-400' : 'text-[#E8E8E8]'} />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant={todaySession?.completedAt ? 'secondary' : 'primary'}
                size="sm"
                loading={saving}
                onClick={handleQuickComplete}
              >
                {todaySession?.completedAt ? '↩ Undo' : '✓ Quick Complete (90m)'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setSelectedDate(today); setShowForm(!showForm) }}>
                <Plus size={14} /> Log Details
              </Button>
            </div>
          </Card>

          {/* Detailed Log Form */}
          {showForm && (
            <Card>
              <h2 className="font-semibold text-[#171717] mb-4">Log Workout</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] block mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min="2026-10-22"
                      max="2026-11-20"
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#6B7280] block mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={actualMinutes}
                      onChange={e => setActualMinutes(e.target.value)}
                      className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B7280] block mb-1">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={e => setWorkoutType(e.target.value)}
                    className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917] bg-white"
                  >
                    <option value="">Select type...</option>
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B7280] block mb-1">Exercises (optional)</label>
                  <textarea
                    value={exercises}
                    onChange={e => setExercises(e.target.value)}
                    placeholder="e.g. Squats 3x10, Bench 3x8..."
                    rows={2}
                    className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B7280] block mb-2">Energy Level</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setEnergyLevel(n)}>
                        <Star size={24} className={n <= energyLevel ? 'text-yellow-400 fill-yellow-400' : 'text-[#E8E8E8]'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#6B7280] block mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="How did it go?"
                    className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecovery}
                    onChange={e => setIsRecovery(e.target.checked)}
                    className="w-4 h-4 accent-[#EB4917]"
                  />
                  <span className="text-sm text-[#6B7280]">Mark as recovery / rest day</span>
                </label>

                <div className="flex gap-2">
                  <Button loading={saving} onClick={handleSubmit}>Save Session</Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Session History */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#171717]">Session History</h2>
              <Button size="sm" variant="ghost" onClick={fetchData}><RefreshCw size={14} /></Button>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Dumbbell size={36} className="text-[#E8E8E8]" />
                <p className="text-sm text-[#9CA3AF]">No gym sessions logged yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 10).map(s => (
                  <div key={s._id}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#F7F7F7] ${
                        s.completedAt ? 'bg-purple-50/40' : s.isRecoveryDay ? 'bg-blue-50/40' : 'bg-[#F7F7F7]'
                      }`}
                      onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        s.completedAt ? 'bg-purple-100' : s.isRecoveryDay ? 'bg-blue-100' : 'bg-[#E8E8E8]'
                      }`}>
                        <Dumbbell size={15} className={s.completedAt ? 'text-purple-600' : s.isRecoveryDay ? 'text-blue-600' : 'text-[#9CA3AF]'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#171717]">{s.sessionDate}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {s.isRecoveryDay ? 'Recovery Day' : s.completedAt ? `${formatMinutes(s.actualMinutes ?? 90)} ${s.workoutType ? '• ' + s.workoutType : ''}` : 'Not completed'}
                        </p>
                      </div>
                      {s.completedAt && <Badge variant="success">✓</Badge>}
                      {expandedId === s._id ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
                    </div>
                    {expandedId === s._id && (s.exercises || s.notes) && (
                      <div className="px-3 py-2 bg-[#F7F7F7] rounded-b-xl border-t border-[#E8E8E8]">
                        {s.exercises && <p className="text-xs text-[#6B7280] mb-1"><strong>Exercises:</strong> {s.exercises}</p>}
                        {s.notes && <p className="text-xs text-[#6B7280]"><strong>Notes:</strong> {s.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-[#171717] mb-4">Monthly Stats</h2>
            <div className="space-y-4">
              <div className="text-center py-3 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{completedSessions.length}</p>
                <p className="text-xs text-[#9CA3AF]">Sessions Completed</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center py-2 bg-[#F7F7F7] rounded-xl">
                  <p className="text-xl font-bold text-[#171717]">{Math.round(totalMinutes / 60)}h</p>
                  <p className="text-xs text-[#9CA3AF]">Total Time</p>
                </div>
                <div className="text-center py-2 bg-[#F7F7F7] rounded-xl">
                  <p className="text-xl font-bold text-[#171717]">{sessions.filter(s => s.isRecoveryDay).length}</p>
                  <p className="text-xs text-[#9CA3AF]">Rest Days</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1">30-Day Goal Progress</p>
                <div className="w-full bg-[#F7F7F7] rounded-full h-2.5">
                  <div
                    className="h-2.5 bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (completedSessions.length / 30) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">{completedSessions.length}/30 sessions</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[#EB4917]" />
              <h2 className="font-semibold text-[#171717]">Gym Tips</h2>
            </div>
            <ul className="space-y-2 text-xs text-[#6B7280]">
              <li>🏋️ Target: 90 min per session</li>
              <li>💧 Stay hydrated throughout</li>
              <li>😴 Protect sleep after S3 shift</li>
              <li>🔄 Recovery days are productive</li>
              <li>📊 Track energy to spot patterns</li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
