import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { VideoProgressModel } from '@/models/VideoProgress'
import { CourseVideoModel } from '@/models/CourseVideo'
import { z } from 'zod'

const UpdateSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  notes: z.string().optional(),
  actualDurationMinutes: z.number().min(0).optional(),
  plannedDate: z.string().optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ videoNumber: string }> }
) {
  try {
    await connectDB()
    const { videoNumber } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const video = await CourseVideoModel.findOne({ videoNumber: parseInt(videoNumber) })
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.status === 'completed') {
      update.completedAt = new Date()
    } else if (parsed.data.status === 'not_started' || parsed.data.status === 'in_progress') {
      update.completedAt = null
    }
    if (parsed.data.plannedDate) {
      update.plannedDate = new Date(parsed.data.plannedDate)
    } else if (parsed.data.plannedDate === null) {
      update.plannedDate = null
    }

    const progress = await VideoProgressModel.findOneAndUpdate(
      { videoId: video._id },
      { $set: update },
      { new: true, upsert: true }
    )

    return NextResponse.json({
      _id: progress._id.toString(),
      videoId: progress.videoId.toString(),
      status: progress.status,
      completedAt: progress.completedAt?.toISOString() ?? null,
      notes: progress.notes,
      actualDurationMinutes: progress.actualDurationMinutes,
    })
  } catch (error) {
    console.error('Video PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}
