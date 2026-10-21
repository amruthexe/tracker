import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CourseVideoModel } from '@/models/CourseVideo'
import { VideoProgressModel } from '@/models/VideoProgress'
import { format } from 'date-fns'

export async function GET() {
  try {
    await connectDB()

    const videos = await CourseVideoModel.find({}).sort({ videoNumber: 1 }).lean()
    const progresses = await VideoProgressModel.find({}).lean()

    const progressMap = new Map(
      progresses.map(p => [p.videoId.toString(), p])
    )

    const result = videos.map(v => {
      const progress = progressMap.get(v._id.toString())
      return {
        _id: v._id.toString(),
        videoNumber: v.videoNumber,
        title: v.title,
        durationMinutes: v.durationMinutes,
        defaultPlannedDate: format(v.defaultPlannedDate, 'yyyy-MM-dd'),
        progress: progress ? {
          _id: progress._id.toString(),
          plannedDate: progress.plannedDate ? format(progress.plannedDate, 'yyyy-MM-dd') : null,
          status: progress.status,
          completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
          actualDurationMinutes: progress.actualDurationMinutes,
          notes: progress.notes,
        } : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Videos GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
