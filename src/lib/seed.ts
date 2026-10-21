/**
 * Seed script: seeds 22 course videos and 30-day shift schedule into MongoDB.
 * Run with: npx ts-node --project tsconfig.json src/lib/seed.ts
 * Or via the API route: POST /api/seed
 */

import { connectDB } from './mongodb'
import { CourseVideoModel } from '@/models/CourseVideo'
import { ShiftScheduleModel } from '@/models/ShiftSchedule'
import { VideoProgressModel } from '@/models/VideoProgress'

const COURSE_VIDEOS = [
  { videoNumber: 1,  title: 'React Refresher Continuation',                     durationMinutes: 150, defaultPlannedDate: new Date('2026-10-22') },
  { videoNumber: 2,  title: 'React Native Init: Core Components',               durationMinutes: 150, defaultPlannedDate: new Date('2026-10-23') },
  { videoNumber: 3,  title: 'React Native: Core Components Continuation',       durationMinutes: 150, defaultPlannedDate: new Date('2026-10-24') },
  { videoNumber: 4,  title: 'React Navigation Masterclass',                     durationMinutes: 150, defaultPlannedDate: new Date('2026-10-25') },
  { videoNumber: 5,  title: 'Expo Router 101',                                  durationMinutes: 150, defaultPlannedDate: new Date('2026-10-26') },
  { videoNumber: 6,  title: 'Networking & Backend Integration',                 durationMinutes: 150, defaultPlannedDate: new Date('2026-10-27') },
  { videoNumber: 7,  title: 'Data Storage & Offline Support',                   durationMinutes: 150, defaultPlannedDate: new Date('2026-10-28') },
  { videoNumber: 8,  title: 'Sensors & Motion (Part 1)',                        durationMinutes: 150, defaultPlannedDate: new Date('2026-10-29') },
  { videoNumber: 9,  title: 'Sensors & Motion (Part 2)',                        durationMinutes: 150, defaultPlannedDate: new Date('2026-10-30') },
  { videoNumber: 10, title: 'Intro to Expo Application Services (EAS)',         durationMinutes: 150, defaultPlannedDate: new Date('2026-10-31') },
  { videoNumber: 11, title: 'Publishing to Playstore using EAS (Dev, Prod Builds)', durationMinutes: 150, defaultPlannedDate: new Date('2026-11-01') },
  { videoNumber: 12, title: 'Background Tasks and Deep Linking',                durationMinutes: 150, defaultPlannedDate: new Date('2026-11-02') },
  { videoNumber: 13, title: 'Expo Authentication',                              durationMinutes: 150, defaultPlannedDate: new Date('2026-11-03') },
  { videoNumber: 14, title: 'LeetCode for Mobile (Part 1)',                     durationMinutes: 150, defaultPlannedDate: new Date('2026-11-04') },
  { videoNumber: 15, title: 'LeetCode for Mobile (Part 2)',                     durationMinutes: 150, defaultPlannedDate: new Date('2026-11-05') },
  { videoNumber: 16, title: 'Camera, Media, Audio',                             durationMinutes: 150, defaultPlannedDate: new Date('2026-11-06') },
  { videoNumber: 17, title: 'Device & System APIs (Location, Battery, Haptics)', durationMinutes: 150, defaultPlannedDate: new Date('2026-11-07') },
  { videoNumber: 18, title: 'Expo Notifications',                               durationMinutes: 150, defaultPlannedDate: new Date('2026-11-08') },
  { videoNumber: 19, title: 'Additional Mobile Development Session 1',          durationMinutes: 150, defaultPlannedDate: new Date('2026-11-09') },
  { videoNumber: 20, title: 'Additional Mobile Development Session 2',          durationMinutes: 150, defaultPlannedDate: new Date('2026-11-10') },
  { videoNumber: 21, title: 'Additional Mobile Development Session 3',          durationMinutes: 150, defaultPlannedDate: new Date('2026-11-11') },
  { videoNumber: 22, title: 'Additional Mobile Development Session 4',          durationMinutes: 150, defaultPlannedDate: new Date('2026-11-12') },
]

type ShiftEntry = { date: string; shift: 'S1' | 'S2' | 'S3' | 'OFF' }

const SHIFT_SCHEDULE: ShiftEntry[] = [
  // 22–23 Oct: no office shift yet, study at home
  { date: '2026-10-22', shift: 'S2' }, // Day 1 — study day (office starts 24th)
  { date: '2026-10-23', shift: 'S2' }, // Day 2
  // S2: 24–28 Oct
  { date: '2026-10-24', shift: 'S2' },
  { date: '2026-10-25', shift: 'S2' },
  { date: '2026-10-26', shift: 'S2' },
  { date: '2026-10-27', shift: 'S2' },
  { date: '2026-10-28', shift: 'S2' },
  // OFF: 29–30 Oct
  { date: '2026-10-29', shift: 'OFF' },
  { date: '2026-10-30', shift: 'OFF' },
  // S1: 31 Oct–4 Nov
  { date: '2026-10-31', shift: 'S1' },
  { date: '2026-11-01', shift: 'S1' },
  { date: '2026-11-02', shift: 'S1' },
  { date: '2026-11-03', shift: 'S1' },
  { date: '2026-11-04', shift: 'S1' },
  // OFF: 5–6 Nov
  { date: '2026-11-05', shift: 'OFF' },
  { date: '2026-11-06', shift: 'OFF' },
  // S3: 7–11 Nov
  { date: '2026-11-07', shift: 'S3' },
  { date: '2026-11-08', shift: 'S3' },
  { date: '2026-11-09', shift: 'S3' },
  { date: '2026-11-10', shift: 'S3' },
  { date: '2026-11-11', shift: 'S3' },
  // OFF: 12–13 Nov
  { date: '2026-11-12', shift: 'OFF' },
  { date: '2026-11-13', shift: 'OFF' },
  // S2: 14–18 Nov
  { date: '2026-11-14', shift: 'S2' },
  { date: '2026-11-15', shift: 'S2' },
  { date: '2026-11-16', shift: 'S2' },
  { date: '2026-11-17', shift: 'S2' },
  { date: '2026-11-18', shift: 'S2' },
  // OFF: 19–20 Nov
  { date: '2026-11-19', shift: 'OFF' },
  { date: '2026-11-20', shift: 'OFF' },
]

export async function seedDatabase() {
  await connectDB()

  // Seed course videos
  let videosSeeded = 0
  for (const video of COURSE_VIDEOS) {
    const exists = await CourseVideoModel.findOne({ videoNumber: video.videoNumber })
    if (!exists) {
      await CourseVideoModel.create(video)
      videosSeeded++
    }
  }

  // Seed shift schedule
  let shiftsSeeded = 0
  for (const entry of SHIFT_SCHEDULE) {
    const exists = await ShiftScheduleModel.findOne({ scheduleDate: new Date(entry.date) })
    if (!exists) {
      await ShiftScheduleModel.create({
        scheduleDate: new Date(entry.date),
        shiftCode: entry.shift,
      })
      shiftsSeeded++
    }
  }

  // Seed video progress records (one per video, status: not_started)
  const allVideos = await CourseVideoModel.find({}).sort({ videoNumber: 1 })
  let progressSeeded = 0
  for (const video of allVideos) {
    const exists = await VideoProgressModel.findOne({ videoId: video._id })
    if (!exists) {
      await VideoProgressModel.create({
        videoId: video._id,
        plannedDate: video.defaultPlannedDate,
        status: 'not_started',
      })
      progressSeeded++
    }
  }

  return { videosSeeded, shiftsSeeded, progressSeeded }
}
