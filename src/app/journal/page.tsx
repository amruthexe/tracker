'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import {
  BookMarked, Edit3, Trash2, ChevronDown, ChevronUp,
  RefreshCw, Filter, CheckCircle2, AlertCircle
} from 'lucide-react'
import { getTodayIST } from '@/lib/dates'
import { format } from 'date-fns'

type Mood = 'great' | 'good' | 'average' | 'hard'

interface JournalEntry {
  _id: string
  entryDate: string
  mood: Mood
  whatLearned?: string
  whatCompleted?: string
  whatWentWell?: string
  problemsFaced?: string
  improveTomorrow?: string
  freeNotes?: string
  createdAt: string
  updatedAt: string
}

const MOODS: { value: Mood; emoji: string; label: string; color: string }[] = [
  { value: 'great', emoji: '🤩', label: 'Great', color: 'bg-green-100 border-green-300 text-green-700' },
  { value: 'good', emoji: '😊', label: 'Good', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { value: 'average', emoji: '😐', label: 'Average', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { value: 'hard', emoji: '😓', label: 'Hard Day', color: 'bg-red-100 border-red-300 text-red-700' },
]

const MOOD_BADGE: Record<Mood, 'success' | 'info' | 'warning' | 'danger'> = {
  great: 'success', good: 'info', average: 'warning', hard: 'danger'
}

function MoodSelector({ value, onChange }: { value: Mood | null; onChange: (m: Mood) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {MOODS.map(m => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all font-medium text-sm ${
            value === m.value
              ? m.color + ' border-current scale-105'
              : 'bg-white border-[#E8E8E8] text-[#6B7280] hover:bg-[#F7F7F7]'
          }`}
        >
          <span className="text-2xl">{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function JournalPage() {
  const today = getTodayIST()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [moodFilter, setMoodFilter] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form
  const [formDate, setFormDate] = useState(today)
  const [mood, setMood] = useState<Mood | null>(null)
  const [whatLearned, setWhatLearned] = useState('')
  const [whatCompleted, setWhatCompleted] = useState('')
  const [whatWentWell, setWhatWentWell] = useState('')
  const [problemsFaced, setProblemsFaced] = useState('')
  const [improveTomorrow, setImproveTomorrow] = useState('')
  const [freeNotes, setFreeNotes] = useState('')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const url = moodFilter === 'all' ? '/api/journal' : `/api/journal?mood=${moodFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setEntries(data)
    } finally { setLoading(false) }
  }, [moodFilter])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const resetForm = () => {
    setMood(null); setWhatLearned(''); setWhatCompleted(''); setWhatWentWell('')
    setProblemsFaced(''); setImproveTomorrow(''); setFreeNotes('')
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!mood) { setSubmitError('Please select your mood for the day.'); return }
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryDate: formDate, mood, whatLearned, whatCompleted, whatWentWell, problemsFaced, improveTomorrow, freeNotes }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message ?? 'Failed to save')
      }
      setSubmitSuccess(true)
      resetForm()
      await fetchEntries()
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Save failed. Your text is preserved.')
    } finally { setSubmitting(false) }
  }

  const handleEdit = (entry: JournalEntry) => {
    setFormDate(entry.entryDate)
    setMood(entry.mood)
    setWhatLearned(entry.whatLearned ?? '')
    setWhatCompleted(entry.whatCompleted ?? '')
    setWhatWentWell(entry.whatWentWell ?? '')
    setProblemsFaced(entry.problemsFaced ?? '')
    setImproveTomorrow(entry.improveTomorrow ?? '')
    setFreeNotes(entry.freeNotes ?? '')
    setEditingId(entry._id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdate = async () => {
    if (!editingId || !mood) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/journal/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, whatLearned, whatCompleted, whatWentWell, problemsFaced, improveTomorrow, freeNotes }),
      })
      if (!res.ok) throw new Error('Update failed')
      setSubmitSuccess(true)
      resetForm()
      await fetchEntries()
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Update failed')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      await fetchEntries()
    } finally { setDeletingId(null) }
  }

  const todayEntry = entries.find(e => e.entryDate === today)

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#171717]">Daily Journal</h1>
        <p className="text-[#6B7280] text-sm mt-1">Reflect on your day and track your progress</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#171717]">
                {editingId ? '✏️ Edit Entry' : '📝 New Entry'}
              </h2>
              {editingId && (
                <Button size="sm" variant="ghost" onClick={resetForm}>Cancel Edit</Button>
              )}
            </div>

            <div className="space-y-5">
              {/* Date */}
              <div>
                <label className="text-xs font-medium text-[#6B7280] block mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  min="2026-10-22"
                  max="2026-11-20"
                  className="text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917] bg-white"
                  disabled={!!editingId}
                />
              </div>

              {/* Mood */}
              <div>
                <label className="text-xs font-medium text-[#6B7280] block mb-2">How did the day go? *</label>
                <MoodSelector value={mood} onChange={setMood} />
              </div>

              {[
                { label: '💡 What did I learn today?', value: whatLearned, set: setWhatLearned, placeholder: 'Key concepts, topics, breakthroughs...' },
                { label: '✅ What did I complete?', value: whatCompleted, set: setWhatCompleted, placeholder: 'Tasks finished, milestones reached...' },
                { label: '🌟 What went well?', value: whatWentWell, set: setWhatWentWell, placeholder: 'Wins, positive moments...' },
                { label: '⚠️ Problems faced?', value: problemsFaced, set: setProblemsFaced, placeholder: 'Blockers, challenges, mistakes...' },
                { label: '🎯 What to improve tomorrow?', value: improveTomorrow, set: setImproveTomorrow, placeholder: 'Action items for tomorrow...' },
                { label: '📓 Additional notes (optional)', value: freeNotes, set: setFreeNotes, placeholder: 'Anything else on your mind...' },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-xs font-medium text-[#6B7280] block mb-1">{field.label}</label>
                  <textarea
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    rows={2}
                    className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#EB4917] resize-none"
                  />
                </div>
              ))}

              {/* Error/Success */}
              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
              {submitSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <p className="text-sm text-green-600">Entry saved successfully! ✓</p>
                </div>
              )}

              <Button
                onClick={editingId ? handleUpdate : handleSubmit}
                loading={submitting}
                className="w-full"
                leftIcon={<BookMarked size={16} />}
              >
                {editingId ? 'Update Entry' : 'Submit Feedback'}
              </Button>
            </div>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today status */}
          <Card className={`${todayEntry ? 'border-green-200 bg-green-50/30' : 'border-dashed border-2'}`}>
            <div className="flex items-center gap-2">
              {todayEntry
                ? <CheckCircle2 size={20} className="text-green-600" />
                : <BookMarked size={20} className="text-[#9CA3AF]" />
              }
              <div>
                <p className="text-sm font-medium text-[#171717]">
                  {todayEntry ? "Today's journal is submitted ✓" : "Today's journal pending"}
                </p>
                {todayEntry && (
                  <p className="text-xs text-[#9CA3AF]">Mood: {MOODS.find(m => m.value === todayEntry.mood)?.emoji} {todayEntry.mood}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-[#9CA3AF]" />
            {[{ value: 'all', label: 'All' }, ...MOODS.map(m => ({ value: m.value, label: m.emoji + ' ' + m.label }))].map(f => (
              <button
                key={f.value}
                onClick={() => setMoodFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  moodFilter === f.value
                    ? 'bg-[#EB4917] text-white'
                    : 'bg-white text-[#6B7280] border border-[#E8E8E8] hover:bg-[#F7F7F7]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Entries */}
          {loading ? (
            <div className="flex justify-center py-8"><RefreshCw size={20} className="animate-spin text-[#EB4917]" /></div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <BookMarked size={36} className="text-[#E8E8E8]" />
              <p className="text-sm text-[#9CA3AF]">No journal entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <Card key={entry._id} padding="sm">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MOODS.find(m => m.value === entry.mood)?.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-[#171717]">{format(new Date(entry.entryDate), 'EEE, d MMM')}</p>
                        <Badge variant={MOOD_BADGE[entry.mood]} size="sm">{entry.mood}</Badge>
                      </div>
                    </div>
                    {expandedId === entry._id ? <ChevronUp size={14} className="text-[#9CA3AF]" /> : <ChevronDown size={14} className="text-[#9CA3AF]" />}
                  </div>

                  {expandedId === entry._id && (
                    <div className="mt-3 space-y-2 border-t border-[#F7F7F7] pt-3">
                      {[
                        { label: '💡 Learned', value: entry.whatLearned },
                        { label: '✅ Completed', value: entry.whatCompleted },
                        { label: '🌟 Went well', value: entry.whatWentWell },
                        { label: '⚠️ Problems', value: entry.problemsFaced },
                        { label: '🎯 Improve', value: entry.improveTomorrow },
                        { label: '📓 Notes', value: entry.freeNotes },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label}>
                          <p className="text-xs font-medium text-[#9CA3AF]">{f.label}</p>
                          <p className="text-xs text-[#171717] whitespace-pre-wrap">{f.value}</p>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(entry)} leftIcon={<Edit3 size={12} />}>Edit</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={deletingId === entry._id}
                          onClick={() => handleDelete(entry._id)}
                          leftIcon={<Trash2 size={12} />}
                        >Delete</Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
