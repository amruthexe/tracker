'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Clock, AlertTriangle } from 'lucide-react'
import { getTodayIST, getDefaultShift } from '@/lib/dates'
import { format } from 'date-fns'

interface TimetableEntry {
  time: string
  activity: string
  type: 'shift' | 'study' | 'gym' | 'meal' | 'sleep' | 'buffer'
}

const S2_TIMETABLE: TimetableEntry[] = [
  { time: '7:30 – 8:00 AM', activity: 'Wake up & breakfast', type: 'meal' },
  { time: '8:00 – 10:30 AM', activity: '📹 Watch one course video (2h 30m)', type: 'study' },
  { time: '10:30 – 10:45 AM', activity: '☕ Break', type: 'buffer' },
  { time: '10:45 AM – 12:15 PM', activity: '💻 Code along & revise (1h 30m)', type: 'study' },
  { time: '12:15 – 1:45 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym' },
  { time: '1:45 – 2:00 PM', activity: '🎒 Preparation & commute buffer', type: 'buffer' },
  { time: '2:00 – 10:30 PM', activity: '🏢 Office shift (S2)', type: 'shift' },
  { time: 'After 10:30 PM', activity: '🌙 Commute, wind down & sleep', type: 'sleep' },
]

const S1_TIMETABLE: TimetableEntry[] = [
  { time: '4:45 – 5:30 AM', activity: '⏰ Wake up & get ready', type: 'meal' },
  { time: '6:00 AM – 2:00 PM', activity: '🏢 Office shift (S1)', type: 'shift' },
  { time: '2:00 – 3:30 PM', activity: '🚗 Commute, lunch & rest', type: 'buffer' },
  { time: '3:30 – 6:00 PM', activity: '📹 Watch one course video (2h 30m)', type: 'study' },
  { time: '6:00 – 6:15 PM', activity: '☕ Break', type: 'buffer' },
  { time: '6:15 – 7:45 PM', activity: '💻 Code along & revise (1h 30m)', type: 'study' },
  { time: '7:45 – 9:15 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym' },
  { time: '9:15 PM onward', activity: '🍽️ Dinner & early sleep', type: 'sleep' },
]

const S3_TIMETABLE: TimetableEntry[] = [
  { time: '6:30 AM – 2:30 PM', activity: '🌙 Commute, wind down & sleep', type: 'sleep' },
  { time: '2:30 – 3:00 PM', activity: '🌅 Wake up & eat', type: 'meal' },
  { time: '3:00 – 5:30 PM', activity: '📹 Watch one course video (2h 30m)', type: 'study' },
  { time: '5:30 – 5:45 PM', activity: '☕ Break', type: 'buffer' },
  { time: '5:45 – 7:15 PM', activity: '💻 Code along & revise (1h 30m)', type: 'study' },
  { time: '7:15 – 8:45 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym' },
  { time: '8:45 – 9:30 PM', activity: '🍽️ Dinner, preparation & commute', type: 'buffer' },
  { time: '10:00 PM – 6:30 AM', activity: '🏢 Office shift (S3)', type: 'shift' },
]

const OFF_TIMETABLE: TimetableEntry[] = [
  { time: 'Morning', activity: '🌅 Wake up naturally, breakfast', type: 'meal' },
  { time: '9:00 – 11:30 AM', activity: '📹 Study session 1 (video or revision)', type: 'study' },
  { time: '11:30 AM – 12:00 PM', activity: '☕ Break', type: 'buffer' },
  { time: '12:00 – 1:30 PM', activity: '💻 Coding practice (1h 30m)', type: 'study' },
  { time: '1:30 – 2:30 PM', activity: '🍽️ Lunch & rest', type: 'meal' },
  { time: '2:30 – 4:00 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym' },
  { time: '4:00 – 5:00 PM', activity: '📝 Notes & revision (1h)', type: 'study' },
  { time: '5:00 – 6:30 PM', activity: '🔨 Project work or extra study', type: 'study' },
  { time: 'Evening', activity: '📋 Submit daily journal & prepare for next shift', type: 'buffer' },
  { time: 'Night', activity: '😴 Sleep (7–8 hours recommended)', type: 'sleep' },
]

const SHIFT_TABLES: Record<string, TimetableEntry[]> = {
  S1: S1_TIMETABLE,
  S2: S2_TIMETABLE,
  S3: S3_TIMETABLE,
  OFF: OFF_TIMETABLE,
}

const TYPE_STYLES: Record<string, string> = {
  shift: 'bg-blue-50 border-l-4 border-l-blue-400',
  study: 'bg-orange-50 border-l-4 border-l-[#EB4917]',
  gym: 'bg-purple-50 border-l-4 border-l-purple-400',
  meal: 'bg-green-50 border-l-4 border-l-green-400',
  sleep: 'bg-indigo-50 border-l-4 border-l-indigo-300',
  buffer: 'bg-gray-50 border-l-4 border-l-gray-300',
}

export default function TimetablePage() {
  const today = getTodayIST()
  const [selectedDate, setSelectedDate] = useState(today)
  const [dbShift, setDbShift] = useState<string | null>(null)

  const fetchShift = useCallback(async (date: string) => {
    const res = await fetch('/api/shifts')
    const all = await res.json()
    const match = all.find((s: { scheduleDate: string }) => s.scheduleDate === date)
    setDbShift(match?.shiftCode ?? null)
  }, [])

  useEffect(() => { fetchShift(selectedDate) }, [selectedDate, fetchShift])

  const shift = dbShift ?? getDefaultShift(selectedDate)
  const timetable = SHIFT_TABLES[shift] ?? S2_TIMETABLE

  const shiftBadgeVariant = shift === 'S1' ? 'blue' : shift === 'S2' ? 'orange' : shift === 'S3' ? 'purple' : 'green'
  const shiftLabel = shift === 'S1' ? 'Morning 6AM–2PM' : shift === 'S2' ? 'Afternoon 2PM–10:30PM' : shift === 'S3' ? 'Night 10PM–6:30AM' : 'Day Off'

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#171717]">Daily Timetable</h1>
        <p className="text-[#6B7280] text-sm mt-1">Shift-specific schedule templates</p>
      </div>

      {/* Date selector */}
      <Card className="mb-6">
        <div className="flex items-center flex-wrap gap-4">
          <div>
            <label className="text-xs font-medium text-[#6B7280] block mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              min="2026-10-22"
              max="2026-11-20"
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917] bg-white"
            />
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-1">Detected Shift</p>
            <Badge variant={shiftBadgeVariant as 'blue' | 'orange' | 'purple' | 'green'} size="md">
              {shift}: {shiftLabel}
            </Badge>
          </div>
          {selectedDate === today && (
            <Badge variant="success" size="md">📌 Today</Badge>
          )}
        </div>
      </Card>

      {/* Warning for S3 sleep */}
      {shift === 'S3' && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Night shift (S3): You sleep during the morning hours after returning from work. Protect this sleep — don&apos;t sacrifice it for study.
          </p>
        </div>
      )}

      {/* Timetable */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-[#EB4917]" />
          <h2 className="font-semibold text-[#171717]">
            {shift} Timetable — {format(new Date(selectedDate), 'EEEE, d MMM')}
          </h2>
        </div>

        <div className="space-y-2">
          {timetable.map((entry, i) => (
            <div key={i} className={`flex gap-4 p-3 rounded-xl ${TYPE_STYLES[entry.type]}`}>
              <div className="shrink-0 w-36 sm:w-40">
                <p className="text-xs font-semibold text-[#6B7280]">{entry.time}</p>
              </div>
              <p className="text-sm text-[#171717]">{entry.activity}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#F7F7F7]">
          <p className="text-xs text-[#9CA3AF] font-medium mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            {[
              { color: 'bg-blue-400', label: 'Office Shift' },
              { color: 'bg-[#EB4917]', label: 'Study' },
              { color: 'bg-purple-400', label: 'Gym' },
              { color: 'bg-green-400', label: 'Meals' },
              { color: 'bg-indigo-300', label: 'Sleep' },
              { color: 'bg-gray-300', label: 'Buffer / Break' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                <span className="text-xs text-[#6B7280]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Note */}
      <div className="mt-4 p-3 bg-[#F7F7F7] rounded-xl">
        <p className="text-xs text-[#9CA3AF]">
          📌 These are <strong>templates</strong>, not mandatory fixed schedules. Adjust based on energy levels and workload.
          If 4 hours of study + 90 minutes of gym cannot reasonably fit around your shift, prioritize sleep and move tasks to the next day.
        </p>
      </div>
    </AppShell>
  )
}
