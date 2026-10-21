import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { JournalEntryModel } from '@/models/JournalEntry'
import { z } from 'zod'
import { format } from 'date-fns'

const JournalSchema = z.object({
  entryDate: z.string(),
  mood: z.enum(['great', 'good', 'average', 'hard']),
  whatLearned: z.string().optional(),
  whatCompleted: z.string().optional(),
  whatWentWell: z.string().optional(),
  problemsFaced: z.string().optional(),
  improveTomorrow: z.string().optional(),
  freeNotes: z.string().optional(),
})

function serializeEntry(e: Record<string, unknown>) {
  return {
    ...e,
    _id: (e._id as { toString(): string }).toString(),
    entryDate: format(e.entryDate as Date, 'yyyy-MM-dd'),
    createdAt: (e.createdAt as Date)?.toISOString(),
    updatedAt: (e.updatedAt as Date)?.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const mood = searchParams.get('mood')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const query: Record<string, unknown> = {}
    if (mood && mood !== 'all') query.mood = mood
    if (startDate || endDate) {
      query.entryDate = {}
      if (startDate) (query.entryDate as Record<string, Date>).$gte = new Date(startDate)
      if (endDate) (query.entryDate as Record<string, Date>).$lte = new Date(endDate)
    }

    const entries = await JournalEntryModel.find(query).sort({ entryDate: -1 }).lean()
    return NextResponse.json(entries.map(serializeEntry))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = JournalSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { entryDate, ...rest } = parsed.data
    const entry = await JournalEntryModel.findOneAndUpdate(
      { entryDate: new Date(entryDate) },
      { $set: rest },
      { new: true, upsert: true }
    )

    return NextResponse.json(serializeEntry(entry.toObject()), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save journal entry' }, { status: 500 })
  }
}
