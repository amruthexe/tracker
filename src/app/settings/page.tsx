'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Settings, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react'

interface Profile {
  displayName: string
  timezone: string
  startDate: string
  endDate: string
  dailyStudyTargetMinutes: number
  gymTargetMinutes: number
  preferredSleepHours: number
  commuteMinutes: number
  notificationStudy: boolean
  notificationGym: boolean
  notificationJournal: boolean
  theme: 'light' | 'dark'
  shiftConfigs: {
    S1: { startTime: string; endTime: string; crossesMidnight: boolean }
    S2: { startTime: string; endTime: string; crossesMidnight: boolean }
    S3: { startTime: string; endTime: string; crossesMidnight: boolean }
  }
  workOffDays: number[]
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setProfile(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSuccess(false)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err.error))
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const update = (key: string, value: unknown) => {
    setProfile(prev => prev ? { ...prev, [key]: value } : prev)
  }

  const updateShift = (shift: 'S1' | 'S2' | 'S3', field: string, value: string | boolean) => {
    setProfile(prev => {
      if (!prev) return prev
      return {
        ...prev,
        shiftConfigs: {
          ...prev.shiftConfigs,
          [shift]: { ...prev.shiftConfigs[shift], [field]: value }
        }
      }
    })
  }

  const toggleWorkOff = (day: number) => {
    setProfile(prev => {
      if (!prev) return prev
      const days = prev.workOffDays.includes(day)
        ? prev.workOffDays.filter(d => d !== day)
        : [...prev.workOffDays, day].sort()
      return { ...prev, workOffDays: days }
    })
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

  if (!profile) return <AppShell><p className="text-[#9CA3AF]">Could not load settings.</p></AppShell>

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] flex items-center gap-2">
            <Settings size={22} /> Settings
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Configure your tracker preferences</p>
        </div>
        <Button onClick={handleSave} loading={saving} leftIcon={<Save size={16} />}>
          Save Settings
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
          <CheckCircle2 size={16} className="text-green-600" />
          <p className="text-sm text-green-600">Settings saved successfully!</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* General */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4">General</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#6B7280] block mb-1">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={e => update('displayName', e.target.value)}
                className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] block mb-1">Timezone</label>
              <select
                value={profile.timezone}
                onChange={e => update('timezone', e.target.value)}
                className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917] bg-white"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] block mb-1">Start Date</label>
              <input
                type="date"
                value={profile.startDate?.toString().substring(0, 10)}
                onChange={e => update('startDate', e.target.value)}
                className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280] block mb-1">End Date</label>
              <input
                type="date"
                value={profile.endDate?.toString().substring(0, 10)}
                onChange={e => update('endDate', e.target.value)}
                className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
              />
            </div>
          </div>
        </Card>

        {/* Targets */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4">Daily Targets</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Study Target (min)', key: 'dailyStudyTargetMinutes', min: 30, max: 600 },
              { label: 'Gym Target (min)', key: 'gymTargetMinutes', min: 10, max: 300 },
              { label: 'Sleep Goal (hours)', key: 'preferredSleepHours', min: 4, max: 12, step: 0.5 },
              { label: 'Commute (min)', key: 'commuteMinutes', min: 0, max: 240 },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium text-[#6B7280] block mb-1">{field.label}</label>
                <input
                  type="number"
                  value={profile[field.key as keyof Profile] as number}
                  onChange={e => update(field.key, parseFloat(e.target.value))}
                  min={field.min}
                  max={field.max}
                  step={(field as { step?: number }).step ?? 1}
                  className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917]"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Shift Timings */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-4">Shift Timings</h2>
          <div className="space-y-4">
            {(['S1', 'S2', 'S3'] as const).map(shift => (
              <div key={shift} className="grid sm:grid-cols-3 gap-3 p-3 bg-[#F7F7F7] rounded-xl">
                <div className="flex items-center">
                  <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                    shift === 'S1' ? 'bg-blue-100 text-blue-700' :
                    shift === 'S2' ? 'bg-orange-100 text-orange-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>{shift}</span>
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={profile.shiftConfigs[shift].startTime}
                    onChange={e => updateShift(shift, 'startTime', e.target.value)}
                    className="w-full text-sm border border-[#E8E8E8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#EB4917] bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] block mb-1">End Time</label>
                  <input
                    type="time"
                    value={profile.shiftConfigs[shift].endTime}
                    onChange={e => updateShift(shift, 'endTime', e.target.value)}
                    className="w-full text-sm border border-[#E8E8E8] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#EB4917] bg-white"
                  />
                </div>
                <label className="sm:col-span-3 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.shiftConfigs[shift].crossesMidnight}
                    onChange={e => updateShift(shift, 'crossesMidnight', e.target.checked)}
                    className="w-4 h-4 accent-[#EB4917]"
                  />
                  <span className="text-xs text-[#6B7280]">Crosses midnight (ends next day)</span>
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Work Off Days */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-3">Work-Off Days</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day, i) => (
              <button
                key={day}
                onClick={() => toggleWorkOff(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  profile.workOffDays.includes(i)
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-white text-[#6B7280] border-[#E8E8E8] hover:bg-[#F7F7F7]'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#9CA3AF] mt-2">
            Currently: {profile.workOffDays.map(d => DAYS_OF_WEEK[d]).join(', ') || 'None'}
          </p>
        </Card>

        {/* Notifications */}
        <Card>
          <h2 className="font-semibold text-[#171717] mb-3">In-App Reminders</h2>
          <p className="text-xs text-[#9CA3AF] mb-3">These are optional in-app notification preferences.</p>
          <div className="space-y-3">
            {[
              { key: 'notificationStudy', label: '📚 Study session reminders' },
              { key: 'notificationGym', label: '🏋️ Gym session reminders' },
              { key: 'notificationJournal', label: '📓 Daily journal reminders' },
            ].map(n => (
              <label key={n.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile[n.key as keyof Profile] as boolean}
                  onChange={e => update(n.key, e.target.checked)}
                  className="w-4 h-4 accent-[#EB4917]"
                />
                <span className="text-sm text-[#171717]">{n.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Save button bottom */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} leftIcon={<Save size={16} />} size="lg">
            Save All Settings
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
