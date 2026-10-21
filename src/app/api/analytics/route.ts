import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { DailyStudyRecordModel } from '@/models/DailyStudyRecord'
import { VideoProgressModel } from '@/models/VideoProgress'
import { GymSessionModel } from '@/models/GymSession'
import { JournalEntryModel } from '@/models/JournalEntry'
import { StudyTimeLogModel } from '@/models/StudyTimeLog'
import { format } from 'date-fns'
import { calculateStreaks } from '@/lib/dates'

export async function GET() {
  try {
    await connectDB()

    // Video analytics
    const allProgress = await VideoProgressModel.find({}).lean()
    const completedVideos = allProgress.filter(v => v.status === 'completed').length
    const inProgressVideos = allProgress.filter(v => v.status === 'in_progress').length

    // Study analytics
    const studyRecords = await DailyStudyRecordModel.find({}).sort({ studyDate: 1 }).lean()
    const totalActualMinutes = studyRecords.reduce((s, r) => s + r.actualMinutes, 0)
    const totalPlannedMinutes = studyRecords.length * 240
    const fullyCompletedDays = studyRecords.filter(r =>
      r.taskVideoDone && r.taskCodingDone && r.taskNotesDone
    ).length

    const studyDates = studyRecords
      .filter(r => r.taskVideoDone)
      .map(r => format(r.studyDate, 'yyyy-MM-dd'))

    const { current: currentStreak, longest: longestStreak } = calculateStreaks(studyDates)

    // Weekly breakdown (last 4 weeks)
    const weekly = []
    const now = new Date()
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (w + 1) * 7)
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - w * 7)
      const weekRecords = studyRecords.filter(r => r.studyDate >= weekStart && r.studyDate < weekEnd)
      weekly.push({
        week: `W${4 - w}`,
        actualMinutes: weekRecords.reduce((s, r) => s + r.actualMinutes, 0),
        completedDays: weekRecords.filter(r => r.taskVideoDone).length,
      })
    }

    // Gym analytics
    const gymSessions = await GymSessionModel.find({}).sort({ sessionDate: 1 }).lean()
    const completedGym = gymSessions.filter(g => g.completedAt).length
    const recoveryDays = gymSessions.filter(g => g.isRecoveryDay).length
    const gymDates = gymSessions.filter(g => g.completedAt).map(g => format(g.sessionDate, 'yyyy-MM-dd'))
    const gymStreaks = calculateStreaks(gymDates)

    // Journal analytics
    const journalEntries = await JournalEntryModel.find({}).sort({ entryDate: 1 }).lean()
    const moodCounts = { great: 0, good: 0, average: 0, hard: 0 }
    journalEntries.forEach(j => { moodCounts[j.mood]++ })

    // Study time logs
    const timeLogs = await StudyTimeLogModel.find({}).lean()
    const totalLoggedMinutes = timeLogs.reduce((s, l) => s + l.durationMinutes, 0)

    return NextResponse.json({
      videos: {
        completed: completedVideos,
        inProgress: inProgressVideos,
        notStarted: 22 - completedVideos - inProgressVideos,
        total: 22,
        completionPercent: Math.round((completedVideos / 22) * 100),
      },
      study: {
        totalActualMinutes,
        totalPlannedMinutes: 30 * 240,
        totalLoggedMinutes,
        fullyCompletedDays,
        totalDays: 30,
        currentStreak,
        longestStreak,
        weekly,
      },
      gym: {
        completedSessions: completedGym,
        recoveryDays,
        totalTracked: gymSessions.length,
        totalDays: 30,
        currentStreak: gymStreaks.current,
        longestStreak: gymStreaks.longest,
      },
      journal: {
        totalEntries: journalEntries.length,
        moodCounts,
        completionPercent: Math.round((journalEntries.length / 30) * 100),
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
