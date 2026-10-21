'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import {
  CheckCircle2, Clock, Video, ChevronDown, ChevronUp,
  PlayCircle, RefreshCw, Edit3, Save, X, Calendar, Search, Loader2,
  FileText
} from 'lucide-react'
import { formatMinutes } from '@/lib/dates'

type VideoStatus = 'not_started' | 'in_progress' | 'completed'
type FilterType = 'all' | VideoStatus

interface VideoItem {
  _id: string
  videoNumber: number
  title: string
  durationMinutes: number
  defaultPlannedDate: string
  progress: {
    _id: string
    plannedDate: string | null
    status: VideoStatus
    completedAt: string | null
    actualDurationMinutes: number | null
    notes: string | null
  } | null
}

const STATUS_CONFIG: Record<VideoStatus, { label: string; color: string; badgeVariant: 'success' | 'warning' | 'default' }> = {
  completed: { label: 'Completed', color: 'text-green-600', badgeVariant: 'success' },
  in_progress: { label: 'In Progress', color: 'text-yellow-600', badgeVariant: 'warning' },
  not_started: { label: 'Not Started', color: 'text-[#9CA3AF]', badgeVariant: 'default' },
}

function VideoCard({ video, onUpdate }: { video: VideoItem; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(video.progress?.notes ?? '')
  const [actualMin, setActualMin] = useState(video.progress?.actualDurationMinutes?.toString() ?? '')

  // Keep local notes and minutes synced when video prop updates
  useEffect(() => {
    setNotes(video.progress?.notes ?? '')
    setActualMin(video.progress?.actualDurationMinutes?.toString() ?? '')
  }, [video.progress?.notes, video.progress?.actualDurationMinutes])

  const status = video.progress?.status ?? 'not_started'
  const cfg = STATUS_CONFIG[status]

  const handleStatusChange = async (newStatus: VideoStatus) => {
    setSaving(true)
    try {
      await fetch(`/api/videos/${video.videoNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      await fetch(`/api/videos/${video.videoNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          actualDurationMinutes: actualMin ? parseInt(actualMin) : undefined,
        }),
      })
      setEditing(false)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      className={`border-l-4 transition-all hover:shadow-sm ${
        status === 'completed'
          ? 'border-l-green-500 bg-white'
          : status === 'in_progress'
          ? 'border-l-amber-500 bg-white'
          : 'border-l-[#E8E8E8] bg-white'
      }`}
      padding="none"
    >
      {/* Card Header clickable area */}
      <div
        className="flex items-start sm:items-center gap-2.5 sm:gap-4 p-3.5 sm:p-4 cursor-pointer select-none transition-colors active:bg-[#FAFAFA]"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Quick status button: toggle on tap */}
        <button
          type="button"
          title={status === 'completed' ? 'Click to mark incomplete' : 'Click to mark completed'}
          disabled={saving}
          onClick={(e) => {
            e.stopPropagation()
            handleStatusChange(status === 'completed' ? 'not_started' : 'completed')
          }}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold transition-all active:scale-90 ${
            status === 'completed'
              ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-xs'
              : status === 'in_progress'
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-[#F7F7F7] text-[#6B7280] hover:bg-[#EAEAEA] border border-[#E8E8E8]'
          }`}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin text-[#EB4917]" />
          ) : status === 'completed' ? (
            <CheckCircle2 size={19} className="text-green-600" />
          ) : (
            <span>#{video.videoNumber}</span>
          )}
        </button>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm sm:text-base font-semibold leading-snug line-clamp-2 sm:line-clamp-1 ${
                status === 'completed' ? 'line-through text-[#9CA3AF]' : 'text-[#171717]'
              }`}
            >
              {video.title}
            </h3>

            {/* Badge & expand chevron */}
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              <Badge variant={cfg.badgeVariant} size="sm">
                {cfg.label}
              </Badge>
              <span className="text-[#9CA3AF] p-0.5">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-1 text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1 font-medium text-[#6B7280]">
              <Clock size={12} className="shrink-0" />
              {formatMinutes(video.durationMinutes)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} className="shrink-0" />
              <span>Planned: {video.progress?.plannedDate ?? video.defaultPlannedDate}</span>
            </span>
            {video.progress?.actualDurationMinutes ? (
              <>
                <span className="hidden xs:inline">•</span>
                <span className="text-green-600 font-medium">
                  Actual: {formatMinutes(video.progress.actualDurationMinutes)}
                </span>
              </>
            ) : null}
            {video.progress?.notes && !expanded && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-[#EB4917] font-medium flex items-center gap-1">
                  <FileText size={11} className="shrink-0" /> Notes
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      {expanded && (
        <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 border-t border-[#F7F7F7] pt-3 sm:pt-4 space-y-3.5 bg-white">
          {/* Action buttons — stacked on mobile, inline on tablet/desktop */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant={status === 'completed' ? 'secondary' : 'primary'}
              loading={saving}
              className="w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation()
                handleStatusChange(status === 'completed' ? 'not_started' : 'completed')
              }}
            >
              {status === 'completed' ? '↩ Mark Incomplete' : '✓ Mark Completed'}
            </Button>

            {status !== 'in_progress' && status !== 'completed' && (
              <Button
                size="sm"
                variant="secondary"
                loading={saving}
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange('in_progress')
                }}
              >
                <PlayCircle size={14} /> Start Watching
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto border border-[#E8E8E8] sm:border-transparent"
              onClick={(e) => {
                e.stopPropagation()
                setEditing(!editing)
              }}
            >
              <Edit3 size={14} /> {editing ? 'Cancel Edit' : 'Edit Notes & Time'}
            </Button>
          </div>

          {/* Edit Form */}
          {editing && (
            <div
              className="space-y-3 bg-[#F9F9F9] rounded-xl p-3 sm:p-4 border border-[#E8E8E8]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1">
                    Actual Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={actualMin}
                    onChange={(e) => setActualMin(e.target.value)}
                    placeholder={`e.g. ${video.durationMinutes}`}
                    className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1">
                    Target Planned Duration
                  </label>
                  <div className="text-sm font-semibold text-[#171717] px-3 py-2 bg-white/80 border border-[#E8E8E8] rounded-xl">
                    {formatMinutes(video.durationMinutes)} ({video.durationMinutes} mins)
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6B7280] block mb-1">
                  Study Notes & Key Takeaways
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key concepts, architecture patterns, code snippets..."
                  rows={3}
                  className="w-full text-sm border border-[#E8E8E8] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917] resize-none transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  size="sm"
                  loading={saving}
                  onClick={handleSaveNotes}
                  leftIcon={<Save size={13} />}
                  className="w-full sm:w-auto"
                >
                  Save Details
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  leftIcon={<X size={13} />}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Notes Display */}
          {!editing && video.progress?.notes && (
            <div className="bg-[#F9F9F9] rounded-xl p-3 sm:p-4 border border-[#E8E8E8]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-[#6B7280] flex items-center gap-1.5">
                  <FileText size={13} className="text-[#EB4917]" />
                  Study Notes
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditing(true)
                  }}
                  className="text-xs text-[#EB4917] hover:underline font-medium flex items-center gap-1"
                >
                  <Edit3 size={11} /> Edit
                </button>
              </div>
              <p className="text-sm text-[#171717] whitespace-pre-wrap leading-relaxed">
                {video.progress.notes}
              </p>
            </div>
          )}

          {/* Completion Timestamp */}
          {video.progress?.completedAt && (
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] pt-0.5">
              <CheckCircle2 size={13} className="text-green-600 shrink-0" />
              <span>
                Completed on{' '}
                <strong className="text-[#6B7280]">
                  {new Date(video.progress.completedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load videos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Computed metrics
  const totalVideos = videos.length || 22
  const completed = useMemo(() => videos.filter(v => v.progress?.status === 'completed').length, [videos])
  const inProgress = useMemo(() => videos.filter(v => v.progress?.status === 'in_progress').length, [videos])
  const remaining = Math.max(0, totalVideos - completed - inProgress)
  const progressPercent = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0

  const totalCourseMinutes = useMemo(() => videos.reduce((acc, v) => acc + (v.durationMinutes || 0), 0), [videos])
  const watchedMinutes = useMemo(() => {
    return videos.reduce((acc, v) => {
      if (v.progress?.status === 'completed') {
        return acc + (v.progress?.actualDurationMinutes || v.durationMinutes || 0)
      }
      return acc
    }, 0)
  }, [videos])

  const nextIncomplete = useMemo(() => {
    return videos.find(v => (v.progress?.status ?? 'not_started') !== 'completed')
  }, [videos])

  // Filtered & searched videos
  const filtered = useMemo(() => {
    return videos.filter(v => {
      const status = v.progress?.status ?? 'not_started'
      if (filter !== 'all' && status !== filter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesNumber = v.videoNumber.toString().includes(q)
        const matchesTitle = v.title.toLowerCase().includes(q)
        const matchesNotes = v.progress?.notes?.toLowerCase().includes(q)
        if (!matchesNumber && !matchesTitle && !matchesNotes) return false
      }
      return true
    })
  }, [videos, filter, searchQuery])

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${videos.length})` },
    { key: 'not_started', label: `Not Started (${remaining})` },
    { key: 'in_progress', label: `In Progress (${inProgress})` },
    { key: 'completed', label: `Completed (${completed})` },
  ]

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">Course Videos</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#EB4917]">
                22 Videos
              </span>
            </div>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-0.5 sm:mt-1">
              React Native masterclass • 30-Day Tracker
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchVideos}
              loading={loading}
              leftIcon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress Summary Card */}
        <Card className="p-4 sm:p-5">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
              <div>
                <span className="text-sm sm:text-base font-bold text-[#171717]">Overall Progress</span>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {formatMinutes(watchedMinutes)} watched of ~{formatMinutes(totalCourseMinutes)} total
                </p>
              </div>
              <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
                <span className="text-xl sm:text-2xl font-extrabold text-[#EB4917]">{completed}</span>
                <span className="text-xs sm:text-sm text-[#9CA3AF] font-medium">/ {totalVideos} videos ({progressPercent}%)</span>
              </div>
            </div>

            <ProgressBar value={progressPercent} color="#EB4917" showPercent={false} />

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
              <div className="text-center bg-green-50 rounded-xl py-2 px-1 border border-green-100">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{completed}</p>
                <p className="text-[10px] sm:text-xs text-green-700 font-medium">Done</p>
              </div>
              <div className="text-center bg-amber-50 rounded-xl py-2 px-1 border border-amber-100">
                <p className="text-lg sm:text-2xl font-bold text-amber-600">{inProgress}</p>
                <p className="text-[10px] sm:text-xs text-amber-700 font-medium">In Progress</p>
              </div>
              <div className="text-center bg-[#F7F7F7] rounded-xl py-2 px-1 border border-[#E8E8E8]">
                <p className="text-lg sm:text-2xl font-bold text-[#6B7280]">{remaining}</p>
                <p className="text-[10px] sm:text-xs text-[#9CA3AF] font-medium">Remaining</p>
              </div>
            </div>
          </div>

          {/* Up Next / Resume banner */}
          {nextIncomplete && (
            <div className="mt-4 pt-4 border-t border-[#F7F7F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] p-3 sm:p-3.5 rounded-xl border border-[#EFEFEF]">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 text-[#EB4917] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <PlayCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#EB4917] uppercase tracking-wider">Up Next to Watch</p>
                  <p className="text-xs sm:text-sm font-semibold text-[#171717] line-clamp-1">
                    #{nextIncomplete.videoNumber}: {nextIncomplete.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] flex items-center gap-2 mt-0.5">
                    <span>⏱️ {formatMinutes(nextIncomplete.durationMinutes)}</span>
                    <span>•</span>
                    <span>📅 Planned: {nextIncomplete.progress?.plannedDate ?? nextIncomplete.defaultPlannedDate}</span>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full sm:w-auto shrink-0 shadow-xs"
                onClick={() => {
                  const el = document.getElementById(`video-${nextIncomplete.videoNumber}`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                Resume Video
              </Button>
            </div>
          )}
        </Card>

        {/* Search & Filter Controls */}
        <div className="space-y-2.5">
          {/* Responsive Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by video #, title, or notes..."
              className="w-full pl-9 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm bg-white border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#EB4917] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#171717] p-1"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills with horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filter === f.key
                    ? 'bg-[#EB4917] text-white shadow-xs'
                    : 'bg-white text-[#6B7280] border border-[#E8E8E8] hover:bg-[#F7F7F7] active:scale-95'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw size={24} className="animate-spin text-[#EB4917]" />
            <p className="text-xs text-[#9CA3AF]">Loading course videos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white rounded-2xl border border-[#E8E8E8]">
            <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center text-[#9CA3AF] mb-3">
              <Video size={24} />
            </div>
            <h3 className="text-sm font-semibold text-[#171717]">No videos match your criteria</h3>
            <p className="text-xs text-[#9CA3AF] max-w-xs mt-1 mb-4">
              {searchQuery
                ? `No videos found matching "${searchQuery}".`
                : 'No videos found with the selected filter.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSearchQuery('')
                  setFilter('all')
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {filtered.map(video => (
              <div key={video._id} id={`video-${video.videoNumber}`}>
                <VideoCard video={video} onUpdate={fetchVideos} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
