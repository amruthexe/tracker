import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { StudyTimeLogModel } from '@/models/StudyTimeLog'
import { z } from 'zod'
import { format } from 'date-fns'

const TimeLogSchema = z.object({
  logDate: z.string(),
  taskName: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().min(0),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const query = date ? { logDate: new Date(date) } : {}
    const logs = await StudyTimeLogModel.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json(logs.map(l => ({
      ...l,
      _id: l._id.toString(),
      logDate: format(l.logDate, 'yyyy-MM-dd'),
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = TimeLogSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const log = await StudyTimeLogModel.create({
      ...parsed.data,
      logDate: new Date(parsed.data.logDate),
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined,
      endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
    })

    return NextResponse.json({ ...log.toObject(), _id: log._id.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await StudyTimeLogModel.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
  }
}
