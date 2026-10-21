'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Clock, AlertTriangle, Bell, Check, Loader2, Sparkles } from 'lucide-react'
import { getTodayIST, getDefaultShift, getShiftLabel } from '@/lib/dates'
import { format } from 'date-fns'

interface TimetableEntry {
  time: string
  activity: string
  type: 'shift' | 'study' | 'gym' | 'meal' | 'sleep' | 'buffer'
  notifTime?: string
  notifDesc?: string
}

const S2_TIMETABLE: TimetableEntry[] = [
  { time: '7:30 – 8:00 AM', activity: 'Wake up & breakfast', type: 'meal' },
  { time: '8:00 – 10:30 AM', activity: '📹 Watch one course video (2h 30m)', type: 'study', notifTime: '8:30 AM', notifDesc: 'Study session check-in' },
  { time: '10:30 – 10:45 AM', activity: '☕ Break', type: 'buffer' },
  { time: '10:45 AM – 12:15 PM', activity: '💻 Code along & revise (1h 30m)', type: 'study', notifTime: '10:45 AM', notifDesc: 'Coding practice reminder' },
  { time: '12:15 – 1:45 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym', notifTime: '12:15 PM', notifDesc: 'Gym workout reminder' },
  { time: '1:45 – 2:00 PM', activity: '🎒 Preparation & commute buffer', type: 'buffer', notifTime: '1:30 PM', notifDesc: 'Office shift starting soon' },
  { time: '2:00 – 10:30 PM', activity: '🏢 Office shift (S2)', type: 'shift' },
  { time: 'After 10:30 PM', activity: '🌙 Commute, wind down & sleep', type: 'sleep', notifTime: '10:45 PM', notifDesc: 'Daily journal reflection' },
]

const S1_TIMETABLE: TimetableEntry[] = [
  { time: '4:45 – 5:30 AM', activity: '⏰ Wake up & get ready', type: 'meal' },
  { time: '6:00 AM – 2:00 PM', activity: '🏢 Office shift (S1)', type: 'shift' },
  { time: '2:00 – 3:30 PM', activity: '🚗 Commute, lunch & rest', type: 'buffer' },
  { time: '3:30 – 6:00 PM', activity: '📹 Watch one course video (2h 30m)', type: 'study', notifTime: '3:30 PM', notifDesc: 'Afternoon study session' },
  { time: '6:00 – 6:15 PM', activity: '☕ Break', type: 'buffer' },
  { time: '6:15 – 7:45 PM', activity: '💻 Code along & revise (1h 30m)', type: 'study', notifTime: '6:15 PM', notifDesc: 'Coding practice' },
  { time: '7:45 – 9:15 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym', notifTime: '7:45 PM', notifDesc: 'Gym workout reminder' },
  { time: '9:15 PM onward', activity: '🍽️ Dinner & early sleep', type: 'sleep', notifTime: '9:30 PM', notifDesc: 'Daily journal reflection' },
]

const S3_TIMETABLE: TimetableEntry[] = [
  { time: '6:30 AM – 2:30 PM', activity: '🌙 Commute, wind down & sleep', type: 'sleep' },
  { time: '2:30 – 3:00 PM', activity: '🌅 Wake up & eat', type: 'meal' },
  { time: '3:00 – 5:30 PM', activity: '📹 Watch one course video (2h 30m)', type: 'study', notifTime: '3:00 PM', notifDesc: 'Wake-up study session' },
  { time: '5:30 – 5:45 PM', activity: '☕ Break', type: 'buffer' },
  { time: '5:45 – 7:15 PM', activity: '💻 Code along & revise (1h 30m)', type: 'study', notifTime: '5:45 PM', notifDesc: 'Coding practice' },
  { time: '7:15 – 8:45 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym', notifTime: '7:15 PM', notifDesc: 'Gym workout reminder' },
  { time: '8:45 – 9:30 PM', activity: '🍽️ Dinner, preparation & commute', type: 'buffer', notifTime: '9:30 PM', notifDesc: 'Night shift prep' },
  { time: '10:00 PM – 6:30 AM', activity: '🏢 Office shift (S3)', type: 'shift' },
]

const OFF_TIMETABLE: TimetableEntry[] = [
  { time: 'Morning', activity: '🌅 Wake up naturally, breakfast', type: 'meal' },
  {
    time: '9:00 – 11:30 AM',
    activity: '📹 Study session 1 (video or revision)',
    type: 'study',
    notifTime: '9:30 AM',
    notifDesc: 'Study reminder sent to your device',
  },
  { time: '11:30 AM – 12:00 PM', activity: '☕ Break', type: 'buffer' },
  { time: '12:00 – 1:30 PM', activity: '💻 Coding practice (1h 30m)', type: 'study', notifTime: '12:00 PM', notifDesc: 'Hands-on coding session' },
  { time: '1:30 – 2:30 PM', activity: '🍽️ Lunch & rest', type: 'meal' },
  { time: '2:30 – 4:00 PM', activity: '🏋️ Gym — 1 hour 30 minutes', type: 'gym', notifTime: '2:30 PM', notifDesc: 'Gym workout reminder' },
  { time: '4:00 – 5:00 PM', activity: '📝 Notes & revision (1h)', type: 'study', notifTime: '4:00 PM', notifDesc: 'Review and notes' },
  { time: '5:00 – 6:30 PM', activity: '🔨 Project work or extra study', type: 'study' },
  { time: 'Evening', activity: '📋 Submit daily journal & prepare for next shift', type: 'buffer', notifTime: '9:00 PM', notifDesc: 'Daily journal reminder' },
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

const SHIFT_OPTIONS: Array<{ code: 'OFF' | 'S1' | 'S2' | 'S3'; label: string; desc: string }> = [
  { code: 'OFF', label: 'Day Off', desc: 'No office shift • Self-study' },
  { code: 'S1', label: 'Morning (S1)', desc: '6:00 AM – 2:00 PM' },
  { code: 'S2', label: 'Afternoon (S2)', desc: '2:00 PM – 10:30 PM' },
  { code: 'S3', label: 'Night (S3)', desc: '10:00 PM – 6:30 AM' },
]

export default function TimetablePage() {
  const today = getTodayIST()
  const [selectedDate, setSelectedDate] = useState(today)
  const [dbShift, setDbShift] = useState<string | null>(null)
  const [savingShift, setSavingShift] = useState(false)
  const [testingNotif, setTestingNotif] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchShift = useCallback(async (date: string) => {
    try {
      const res = await fetch('/api/shifts')
      const all = await res.json()
      if (Array.isArray(all)) {
        const match = all.find((s: { scheduleDate: string }) => s.scheduleDate === date)
        setDbShift(match?.shiftCode ?? null)
      }
    } catch {
      // fallback handled below
    }
  }, [])

  useEffect(() => {
    fetchShift(selectedDate)
  }, [selectedDate, fetchShift])

  const shift = (dbShift ?? getDefaultShift(selectedDate)) as 'S1' | 'S2' | 'S3' | 'OFF'
  const timetable = SHIFT_TABLES[shift] ?? OFF_TIMETABLE

  const shiftBadgeVariant =
    shift === 'S1' ? 'blue' : shift === 'S2' ? 'orange' : shift === 'S3' ? 'purple' : 'green'

  const handleShiftSelect = async (newShift: 'OFF' | 'S1' | 'S2' | 'S3') => {
    if (newShift === shift) return
    setSavingShift(true)
    try {
      await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleDate: selectedDate,
          shiftCode: newShift,
          overrideNote: 'Manual override by user',
        }),
      })
      setDbShift(newShift)
      localStorage.setItem(`shift_${selectedDate}`, newShift)
      showToast(`Shift updated to ${newShift === 'OFF' ? 'Day Off' : newShift}!`)
    } catch {
      showToast('Failed to update shift.')
    } finally {
      setSavingShift(false)
    }
  }

  // Quick test for the 9:30 AM notification
  const handleTest930Notification = async () => {
    setTestingNotif(true)
    try {
      // 1. Try local service worker notification first
      if ('Notification' in window) {
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission()
        }
        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          reg.showNotification('📹 Study Session 1 (9:00 – 11:30 AM)', {
            body: "Day Off Study Reminder: Time to watch today's React Native video or revise concepts! 🚀",
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-192.svg',
            tag: 'test-study-930',
            data: { url: '/videos' },
          })
        }
      }

      // 2. Also send push notification via API
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'study_off_morning',
          title: '📹 Study Session 1 (9:00 – 11:30 AM)',
          message: "Day Off Study Reminder: Time to watch today's React Native video or revise concepts! 🚀",
          url: '/videos',
        }),
      })
      const data = await res.json()
      if (data.sent > 0) {
        showToast('🔔 9:30 AM notification sent successfully!')
      } else {
        showToast('🔔 Notification triggered on this device!')
      }
    } catch {
      showToast('Failed to send test notification.')
    } finally {
      setTestingNotif(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">Daily Timetable</h1>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-0.5">
              Shift-specific schedule templates & automatic notification reminders
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTest930Notification}
            loading={testingNotif}
            leftIcon={<Bell size={13} className="text-[#EB4917]" />}
            className="self-start sm:self-auto text-xs"
          >
            Test 9:30 AM Alert
          </Button>
        </div>

        {/* Date Selector & Shift Override Card */}
        <Card className="p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7F7F7] pb-3">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min="2026-10-22"
                    max="2026-11-20"
                    onChange={e => setSelectedDate(e.target.value)}
                    className="text-sm border border-[#E8E8E8] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#EB4917] bg-white font-medium"
                  />
                </div>
                {selectedDate === today && (
                  <div className="mt-5">
                    <Badge variant="success" size="sm">📌 Today</Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">Current Shift:</span>
                <Badge variant={shiftBadgeVariant as 'blue' | 'orange' | 'purple' | 'green'} size="md">
                  {shift === 'OFF' ? '🏖️ Day Off' : `${shift}: ${getShiftLabel(shift)}`}
                </Badge>
              </div>
            </div>

            {/* Shift Override Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#6B7280]">
                  Override Shift for {format(new Date(selectedDate), 'd MMM')}:
                </p>
                {savingShift && (
                  <span className="text-xs text-[#EB4917] flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SHIFT_OPTIONS.map(opt => {
                  const active = shift === opt.code
                  return (
                    <button
                      key={opt.code}
                      onClick={() => handleShiftSelect(opt.code)}
                      disabled={savingShift}
                      className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                        active
                          ? 'border-[#EB4917] bg-orange-50/60 shadow-xs'
                          : 'border-[#E8E8E8] bg-white hover:bg-[#F9F9F9]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold ${active ? 'text-[#EB4917]' : 'text-[#171717]'}`}>
                          {opt.label}
                        </span>
                        {active && <Check size={14} className="text-[#EB4917]" />}
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] leading-tight">{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Warning for S3 sleep */}
        {shift === 'S3' && (
          <div className="flex items-start gap-2.5 p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-yellow-800 leading-snug">
              Night shift (S3): Sleep is protected during morning hours after office work. Do not sacrifice this sleep window for study.
            </p>
          </div>
        )}

        {/* Timetable Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#F7F7F7]">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#EB4917]" />
              <h2 className="font-bold text-[#171717] text-sm sm:text-base">
                {shift === 'OFF' ? 'Day Off Timetable' : `${shift} Timetable`} — {format(new Date(selectedDate), 'EEEE, d MMMM')}
              </h2>
            </div>
            {shift === 'OFF' && (
              <span className="text-xs bg-orange-100 text-[#EB4917] font-semibold px-2.5 py-1 rounded-lg self-start sm:self-auto flex items-center gap-1">
                <Bell size={12} /> 9:30 AM Study Alert Scheduled
              </span>
            )}
          </div>

          <div className="space-y-2">
            {timetable.map((entry, i) => (
              <div
                key={i}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 rounded-xl transition-all ${TYPE_STYLES[entry.type]}`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="shrink-0 w-32 sm:w-36">
                    <p className="text-xs font-bold text-[#171717]">{entry.time}</p>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-[#171717]">{entry.activity}</p>
                </div>

                {/* Scheduled Notification badge */}
                {entry.notifTime && (
                  <div className="self-start sm:self-auto shrink-0 mt-1 sm:mt-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EB4917] bg-white/90 border border-orange-200 px-2 py-0.5 rounded-lg shadow-2xs">
                      <Bell size={10} className="text-[#EB4917]" />
                      <span>Alert at {entry.notifTime}</span>
                    </span>
                  </div>
                )}
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

        {/* Helpful Info Box */}
        <div className="p-3.5 bg-white border border-[#E8E8E8] rounded-xl flex items-start gap-2.5">
          <Sparkles size={16} className="text-[#EB4917] shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Automatic notifications are scheduled according to your timetable. On <strong>Day Off</strong>, you will receive an alert at <strong>9:30 AM</strong> for Study Session 1 (9:00 – 11:30 AM). If you ever swap shifts or have an unexpected schedule change, simply select your shift above to update your timetable and reminders immediately.
          </p>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#171717] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
            {toastMessage}
          </div>
        )}
      </div>
    </AppShell>
  )
}
