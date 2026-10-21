'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import {
  CheckCircle2, Circle, Clock, Video, ChevronDown, ChevronUp,
  PlayCircle, Filter, RefreshCw, Edit3, Save, X
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
    <Card className={`border-l-4 transition-all ${
      status === 'completed' ? 'border-l-green-400' :
      status === 'in_progress' ? 'border-l-yellow-400' :
      'border-l-[#E8E8E8]'
    }`} padding="none">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Number */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
          status === 'completed' ? 'bg-green-100 text-green-700' :
          status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
          'bg-[#F7F7F7] text-[#9CA3AF]'
        }`}>
          {status === 'completed' ? <CheckCircle2 size={18} /> : video.videoNumber}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${status === 'completed' ? 'line-through text-[#9CA3AF]' : 'text-[#171717]'}`}>
            {video.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
              <Clock size={11} /> {formatMinutes(video.durationMinutes)}
            </span>
            <span className="text-xs text-[#9CA3AF]">📅 {video.progress?.plannedDate ?? video.defaultPlannedDate}</span>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant={cfg.badgeVariant} size="sm">{cfg.label}</Badge>
        {expanded ? <ChevronUp size={16} className="text-[#9CA3AF] shrink-0" /> : <ChevronDown size={16} className="text-[#9CA3AF] shrink-0" />}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F7F7F7] pt-4 space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={status === 'completed' ? 'secondary' : 'primary'}
              loading={saving}
              onClick={(e) => { e.stopPropagation(); handleStatusChange(status === 'completed' ? 'not_started' : 'completed') }}
            >
              {status === 'completed' ? '↩ Mark Incomplete' : '✓ Mark Complete'}
            </Button>
            {status !== 'in_progress' && status !== 'completed' && (
              <Button
                size="sm"
                variant="secondary"
                loading={saving}
                onClick={(e) => { e.stopPropagation(); handleStatusChange('in_progress') }}
              >
                <PlayCircle size={14} /> Start Watching
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditing(!editing) }}>
              <Edit3 size={14} /> {editing ? 'Cancel Edit' : 'Edit Notes'}
            </Button>
          </div>

          {/* Edit form */}
          {editing && (
            <div className="space-y-3 bg-[#F7F7F7] rounded-xl p-3" onClick={e => e.stopPropagation()}>
              <div>
                <label className="text-xs font-medium text-[#6B7280] block mb-1">Actual Duration (minutes)</label>
                <input
                  type="number"
                  value={actualMin}
                  onChange={e => setActualMin(e.target.value)}
                  placeholder="e.g. 145"
                  className="w-full text-sm border border-[#E8E8E8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7280] block mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes about this video..."
                  rows={3}
                  className="w-full text-sm border border-[#E8E8E8] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#EB4917] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={saving} onClick={handleSaveNotes} leftIcon={<Save size={13} />}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} leftIcon={<X size={13} />}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Existing notes */}
          {!editing && video.progress?.notes && (
            <div className="bg-[#F7F7F7] rounded-xl p-3">
              <p className="text-xs font-medium text-[#6B7280] mb-1">Notes</p>
              <p className="text-sm text-[#171717] whitespace-pre-wrap">{video.progress.notes}</p>
            </div>
          )}

          {video.progress?.completedAt && (
            <p className="text-xs text-[#9CA3AF]">✅ Completed: {new Date(video.progress.completedAt).toLocaleDateString()}</p>
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

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setVideos(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const filtered = filter === 'all' ? videos : videos.filter(v => (v.progress?.status ?? 'not_started') === filter)
  const completed = videos.filter(v => v.progress?.status === 'completed').length
  const inProgress = videos.filter(v => v.progress?.status === 'in_progress').length
  const nextIncomplete = videos.find(v => (v.progress?.status ?? 'not_started') !== 'completed')

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${videos.length})` },
    { key: 'not_started', label: `Not Started (${videos.length - completed - inProgress})` },
    { key: 'in_progress', label: `In Progress (${inProgress})` },
    { key: 'completed', label: `Completed (${completed})` },
  ]

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Course Videos</h1>
          <p className="text-[#6B7280] text-sm mt-1">22-video React Native masterclass</p>
        </div>
        <Button size="sm" variant="secondary" onClick={fetchVideos}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Progress Summary */}
      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#171717]">Overall Progress</span>
            <span className="text-sm font-bold text-[#EB4917]">{completed}/22 videos</span>
          </div>
          <ProgressBar value={Math.round((completed / 22) * 100)} color="#EB4917" showPercent />
          <div className="flex gap-3 pt-1">
            <div className="flex-1 text-center bg-green-50 rounded-xl py-2">
              <p className="text-xl font-bold text-green-600">{completed}</p>
              <p className="text-[10px] text-[#9CA3AF]">Done</p>
            </div>
            <div className="flex-1 text-center bg-yellow-50 rounded-xl py-2">
              <p className="text-xl font-bold text-yellow-600">{inProgress}</p>
              <p className="text-[10px] text-[#9CA3AF]">In Progress</p>
            </div>
            <div className="flex-1 text-center bg-[#F7F7F7] rounded-xl py-2">
              <p className="text-xl font-bold text-[#9CA3AF]">{22 - completed - inProgress}</p>
              <p className="text-[10px] text-[#9CA3AF]">Remaining</p>
            </div>
          </div>
        </div>

        {/* Resume banner */}
        {nextIncomplete && (
          <div className="mt-4 pt-4 border-t border-[#F7F7F7] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <PlayCircle size={18} className="text-[#EB4917]" />
              <span className="text-sm text-[#171717]">Next up: <strong>#{nextIncomplete.videoNumber} {nextIncomplete.title}</strong></span>
            </div>
            <Button size="sm" onClick={() => {
              // Scroll to that video
              document.getElementById(`video-${nextIncomplete.videoNumber}`)?.scrollIntoView({ behavior: 'smooth' })
            }}>
              Resume
            </Button>
          </div>
        )}
      </Card>

      {/* Filters — horizontal scroll on mobile */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        <Filter size={14} className="text-[#9CA3AF] shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#EB4917] text-white'
                : 'bg-white text-[#6B7280] border border-[#E8E8E8] active:bg-[#F7F7F7]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Video List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-[#EB4917]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Video size={40} className="text-[#E8E8E8]" />
          <p className="text-[#9CA3AF]">No videos match this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(video => (
            <div key={video._id} id={`video-${video.videoNumber}`}>
              <VideoCard video={video} onUpdate={fetchVideos} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
