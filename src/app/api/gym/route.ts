import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { GymSessionModel } from '@/models/GymSession'
import { z } from 'zod'
import { format } from 'date-fns'

const GymSchema = z.object({
  sessionDate: z.string(),
  actualMinutes: z.number().min(0).optional(),
  workoutType: z.string().optional(),
  exercises: z.string().optional(),
  energyLevel: z.number().min(1).max(5).optional(),
  isRecoveryDay: z.boolean().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const query = date ? { sessionDate: new Date(date) } : {}
    const sessions = await GymSessionModel.find(query).sort({ sessionDate: -1 }).lean()
    return NextResponse.json(sessions.map(s => ({
      ...s,
      _id: s._id.toString(),
      sessionDate: format(s.sessionDate, 'yyyy-MM-dd'),
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gym sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = GymSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { sessionDate, completed, ...rest } = parsed.data
    const update: Record<string, unknown> = { ...rest }
    if (completed) update.completedAt = new Date()
    else if (completed === false) update.completedAt = null

    const session = await GymSessionModel.findOneAndUpdate(
      { sessionDate: new Date(sessionDate) },
      { $set: update },
      { new: true, upsert: true }
    )

    return NextResponse.json({
      ...session.toObject(),
      _id: session._id.toString(),
      sessionDate: format(session.sessionDate, 'yyyy-MM-dd'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save gym session' }, { status: 500 })
  }
}
