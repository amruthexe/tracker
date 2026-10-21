import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { JournalEntryModel } from '@/models/JournalEntry'
import { z } from 'zod'
import { format } from 'date-fns'

const UpdateSchema = z.object({
  mood: z.enum(['great', 'good', 'average', 'hard']).optional(),
  whatLearned: z.string().optional(),
  whatCompleted: z.string().optional(),
  whatWentWell: z.string().optional(),
  problemsFaced: z.string().optional(),
  improveTomorrow: z.string().optional(),
  freeNotes: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const entry = await JournalEntryModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    )
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ...entry.toObject(),
      _id: entry._id.toString(),
      entryDate: format(entry.entryDate, 'yyyy-MM-dd'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    await JournalEntryModel.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
