import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { UserProfileModel } from '@/models/UserProfile'
import { z } from 'zod'

export async function GET() {
  try {
    await connectDB()
    let profile = await UserProfileModel.findOne({}).lean()
    if (!profile) {
      profile = (await UserProfileModel.create({})).toObject()
    }
    return NextResponse.json({ ...profile, _id: (profile._id as { toString(): string }).toString() })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

const SettingsSchema = z.object({
  displayName: z.string().optional(),
  timezone: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dailyStudyTargetMinutes: z.number().min(30).max(600).optional(),
  gymTargetMinutes: z.number().min(10).max(300).optional(),
  preferredSleepHours: z.number().min(4).max(12).optional(),
  commuteMinutes: z.number().min(0).max(240).optional(),
  notificationStudy: z.boolean().optional(),
  notificationGym: z.boolean().optional(),
  notificationJournal: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  shiftConfigs: z.object({
    S1: z.object({ startTime: z.string(), endTime: z.string(), crossesMidnight: z.boolean() }).optional(),
    S2: z.object({ startTime: z.string(), endTime: z.string(), crossesMidnight: z.boolean() }).optional(),
    S3: z.object({ startTime: z.string(), endTime: z.string(), crossesMidnight: z.boolean() }).optional(),
  }).optional(),
  workOffDays: z.array(z.number().min(0).max(6)).optional(),
})

export async function PUT(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = SettingsSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const profile = await UserProfileModel.findOneAndUpdate(
      {},
      { $set: parsed.data },
      { new: true, upsert: true }
    )

    return NextResponse.json({ ...profile.toObject(), _id: profile._id.toString() })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
