import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DailyStudyRecordModel } from '@/models/DailyStudyRecord'
import { VideoProgressModel } from '@/models/VideoProgress'
import { GymSessionModel } from '@/models/GymSession'
import { JournalEntryModel } from '@/models/JournalEntry'
import { StudyTimeLogModel } from '@/models/StudyTimeLog'
import { CourseVideoModel } from '@/models/CourseVideo'
import { format } from 'date-fns'

function flattenDoc(doc: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(doc)) {
    if (v instanceof Date) result[k] = format(v, 'yyyy-MM-dd HH:mm:ss')
    else if (v && typeof v === 'object' && '_id' in v) result[k] = (v as { toString(): string }).toString()
    else result[k] = v
  }
  return result
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') ? `"${str}"` : str
    }).join(','))
  }
  return lines.join('\n')
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'json'

    const [study, videos, gym, journal, logs, courseVideos] = await Promise.all([
      DailyStudyRecordModel.find({}).lean(),
      VideoProgressModel.find({}).lean(),
      GymSessionModel.find({}).lean(),
      JournalEntryModel.find({}).lean(),
      StudyTimeLogModel.find({}).lean(),
      CourseVideoModel.find({}).lean(),
    ])

    const data = {
      studyRecords: study.map(d => flattenDoc(d as unknown as Record<string, unknown>)),
      videoProgress: videos.map(d => flattenDoc(d as unknown as Record<string, unknown>)),
      gymSessions: gym.map(d => flattenDoc(d as unknown as Record<string, unknown>)),
      journalEntries: journal.map(d => flattenDoc(d as unknown as Record<string, unknown>)),
      studyLogs: logs.map(d => flattenDoc(d as unknown as Record<string, unknown>)),
      courseVideos: courseVideos.map(d => flattenDoc(d as unknown as Record<string, unknown>)),
      exportedAt: new Date().toISOString(),
    }

    if (type === 'csv') {
      const csvParts = [
        '=== Study Records ===\n' + toCSV(data.studyRecords),
        '=== Video Progress ===\n' + toCSV(data.videoProgress),
        '=== Gym Sessions ===\n' + toCSV(data.gymSessions),
        '=== Journal Entries ===\n' + toCSV(data.journalEntries),
      ].join('\n\n')

      return new NextResponse(csvParts, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        },
      })
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tracker-export-${format(new Date(), 'yyyy-MM-dd')}.json"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
