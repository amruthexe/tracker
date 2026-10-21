import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ShiftScheduleModel } from '@/models/ShiftSchedule'
import { format } from 'date-fns'
import { z } from 'zod'

export async function GET() {
  try {
    await connectDB()
    // Auto-correct Oct 22 and Oct 23 previously seeded as S2 without user override
    await ShiftScheduleModel.updateMany(
      {
        scheduleDate: {
          $in: [
            new Date('2026-10-22T00:00:00.000Z'),
            new Date('2026-10-22'),
            new Date('2026-10-23T00:00:00.000Z'),
            new Date('2026-10-23'),
          ],
        },
        shiftCode: 'S2',
        overrideNote: { $exists: false },
      },
      { $set: { shiftCode: 'OFF' } }
    )

    const schedules = await ShiftScheduleModel.find({}).sort({ scheduleDate: 1 }).lean()
    return NextResponse.json(schedules.map(s => ({
      ...s,
      _id: s._id.toString(),
      scheduleDate: format(s.scheduleDate, 'yyyy-MM-dd'),
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

const ShiftSchema = z.object({
  scheduleDate: z.string(),
  shiftCode: z.enum(['S1', 'S2', 'S3', 'OFF']),
  isWfh: z.boolean().optional(),
  overrideNote: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = ShiftSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { scheduleDate, ...rest } = parsed.data
    const schedule = await ShiftScheduleModel.findOneAndUpdate(
      { scheduleDate: new Date(scheduleDate) },
      { $set: rest },
      { new: true, upsert: true }
    )

    return NextResponse.json({
      ...schedule.toObject(),
      _id: schedule._id.toString(),
      scheduleDate: format(schedule.scheduleDate, 'yyyy-MM-dd'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save shift' }, { status: 500 })
  }
}
