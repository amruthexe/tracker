import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DailyStudyRecordModel } from '@/models/DailyStudyRecord'
import { z } from 'zod'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (date) {
      const record = await DailyStudyRecordModel.findOne({ studyDate: new Date(date) }).lean()
      if (!record) return NextResponse.json(null)
      return NextResponse.json({
        ...record,
        _id: record._id.toString(),
        studyDate: format(record.studyDate, 'yyyy-MM-dd'),
      })
    }

    const records = await DailyStudyRecordModel.find({}).sort({ studyDate: 1 }).lean()
    return NextResponse.json(records.map(r => ({
      ...r,
      _id: r._id.toString(),
      studyDate: format(r.studyDate, 'yyyy-MM-dd'),
    })))
  } catch (error) {
    console.error('Study GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch study records' }, { status: 500 })
  }
}

const StudySchema = z.object({
  studyDate: z.string(),
  taskVideoDone: z.boolean().optional(),
  taskCodingDone: z.boolean().optional(),
  taskNotesDone: z.boolean().optional(),
  taskRevisionDone: z.boolean().optional(),
  taskFeedbackDone: z.boolean().optional(),
  actualMinutes: z.number().min(0).optional(),
  dayType: z.enum(['video', 'project', 'off']).optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = StudySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { studyDate, ...rest } = parsed.data
    const record = await DailyStudyRecordModel.findOneAndUpdate(
      { studyDate: new Date(studyDate) },
      { $set: rest },
      { new: true, upsert: true }
    )

    return NextResponse.json({
      ...record.toObject(),
      _id: record._id.toString(),
      studyDate: format(record.studyDate, 'yyyy-MM-dd'),
    })
  } catch (error) {
    console.error('Study POST error:', error)
    return NextResponse.json({ error: 'Failed to save study record' }, { status: 500 })
  }
}
