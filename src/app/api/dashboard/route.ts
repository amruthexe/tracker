import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CourseVideoModel } from '@/models/CourseVideo'
import { VideoProgressModel } from '@/models/VideoProgress'
import { DailyStudyRecordModel } from '@/models/DailyStudyRecord'
import { GymSessionModel } from '@/models/GymSession'
import { JournalEntryModel } from '@/models/JournalEntry'
import { ShiftScheduleModel } from '@/models/ShiftSchedule'
import { getTodayIST, calculateStreaks, getVideoForDate } from '@/lib/dates'
import { format } from 'date-fns'

export async function GET() {
  try {
    await connectDB()

    const today = getTodayIST()
    const todayDate = new Date(today)

    // Today's shift
    let todayShiftDoc = await ShiftScheduleModel.findOne({ scheduleDate: todayDate })
    // If today is Oct 22 or 23 and previously saved as S2 without override, correct to OFF
    if (
      (today === '2026-10-22' || today === '2026-10-23') &&
      (!todayShiftDoc || (todayShiftDoc.shiftCode === 'S2' && !todayShiftDoc.overrideNote))
    ) {
      await ShiftScheduleModel.findOneAndUpdate(
        { scheduleDate: todayDate },
        { $set: { shiftCode: 'OFF' } },
        { upsert: true, new: true }
      )
      todayShiftDoc = await ShiftScheduleModel.findOne({ scheduleDate: todayDate })
    }
    const todayShift = todayShiftDoc?.shiftCode ?? getDefaultShift(today)

    // Completed videos count
    const completedVideos = await VideoProgressModel.countDocuments({ status: 'completed' })

    // Completed study days
    const studyRecords = await DailyStudyRecordModel.find({
      taskVideoDone: true,
      taskCodingDone: true,
    }).sort({ studyDate: 1 })
    const completedStudyDays = studyRecords.length
    const studyDates = studyRecords.map(r => format(r.studyDate, 'yyyy-MM-dd'))

    // Streak calculations
    const { current: currentStreak, longest: longestStreak } = calculateStreaks(studyDates)

    // Total study minutes
    const allStudy = await DailyStudyRecordModel.find({})
    const totalStudyMinutes = allStudy.reduce((sum, r) => sum + (r.actualMinutes || 0), 0)

    // Completed gym sessions
    const completedGymSessions = await GymSessionModel.countDocuments({
      completedAt: { $exists: true, $ne: null },
      isRecoveryDay: false,
    })

    // Recent journal entries
    const recentJournalEntries = await JournalEntryModel.find({})
      .sort({ entryDate: -1 })
      .limit(3)
      .lean()

    // Today's records
    const todayStudyRecord = await DailyStudyRecordModel.findOne({ studyDate: todayDate }).lean()
    const todayGymSession = await GymSessionModel.findOne({ sessionDate: todayDate }).lean()
    const todayJournalEntry = await JournalEntryModel.findOne({ entryDate: todayDate }).lean()

    // Today's video
    const videoNum = getVideoForDate(today)
    let todayVideo = null
    if (videoNum) {
      todayVideo = await CourseVideoModel.findOne({ videoNumber: videoNum }).lean()
    }

    return NextResponse.json({
      todayDate: today,
      todayShift,
      completedVideos,
      totalVideos: 22,
      completedStudyDays,
      totalDays: 30,
      completedGymSessions,
      totalStudyMinutes,
      recentJournalEntries: recentJournalEntries.map(j => ({
        ...j,
        _id: j._id.toString(),
        entryDate: format(j.entryDate, 'yyyy-MM-dd'),
      })),
      currentStreak,
      longestStreak,
      todayStudyRecord: todayStudyRecord ? {
        ...todayStudyRecord,
        _id: todayStudyRecord._id.toString(),
        studyDate: format(todayStudyRecord.studyDate, 'yyyy-MM-dd'),
      } : null,
      todayGymSession: todayGymSession ? {
        ...todayGymSession,
        _id: todayGymSession._id.toString(),
        sessionDate: format(todayGymSession.sessionDate, 'yyyy-MM-dd'),
      } : null,
      todayJournalEntry: todayJournalEntry ? {
        ...todayJournalEntry,
        _id: todayJournalEntry._id.toString(),
        entryDate: format(todayJournalEntry.entryDate, 'yyyy-MM-dd'),
      } : null,
      todayVideo: todayVideo ? {
        ...todayVideo,
        _id: todayVideo._id.toString(),
        defaultPlannedDate: format(todayVideo.defaultPlannedDate, 'yyyy-MM-dd'),
      } : null,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
