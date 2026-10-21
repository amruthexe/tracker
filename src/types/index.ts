// Shared TypeScript types for React Native Life Tracker

export type ShiftCode = 'S1' | 'S2' | 'S3' | 'OFF'
export type VideoStatus = 'not_started' | 'in_progress' | 'completed'
export type Mood = 'great' | 'good' | 'average' | 'hard'
export type DayType = 'video' | 'project' | 'off'

export interface CourseVideo {
  _id: string
  videoNumber: number
  title: string
  durationMinutes: number
  defaultPlannedDate: string // ISO date string
}

export interface VideoProgress {
  _id: string
  videoId: string | CourseVideo
  plannedDate?: string
  status: VideoStatus
  completedAt?: string
  actualDurationMinutes?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ShiftConfig {
  _id: string
  shiftCode: ShiftCode
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  crossesMidnight: boolean
  color: string
  label: string
}

export interface ShiftScheduleDay {
  _id: string
  scheduleDate: string
  shiftCode: ShiftCode
  isWfh: boolean
  overrideNote?: string
}

export interface DailyStudyRecord {
  _id: string
  studyDate: string
  taskVideoDone: boolean
  taskCodingDone: boolean
  taskNotesDone: boolean
  taskRevisionDone: boolean
  taskFeedbackDone: boolean
  plannedMinutes: number
  actualMinutes: number
  dayType: DayType
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StudyTimeLog {
  _id: string
  logDate: string
  taskName: string
  startTime?: string
  endTime?: string
  durationMinutes: number
  notes?: string
  createdAt: string
}

export interface GymSession {
  _id: string
  sessionDate: string
  plannedMinutes: number
  actualMinutes?: number
  workoutType?: string
  exercises?: string
  energyLevel?: number
  isRecoveryDay: boolean
  notes?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  _id: string
  entryDate: string
  mood: Mood
  whatLearned?: string
  whatCompleted?: string
  whatWentWell?: string
  problemsFaced?: string
  improveTomorrow?: string
  freeNotes?: string
  createdAt: string
  updatedAt: string
}

export interface PersonalTask {
  _id: string
  taskDate: string
  title: string
  description?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  _id: string
  displayName: string
  timezone: string
  startDate: string
  endDate: string
  dailyStudyTargetMinutes: number
  gymTargetMinutes: number
  preferredSleepHours: number
  commuteMinutes: number
  notificationStudy: boolean
  notificationGym: boolean
  notificationJournal: boolean
  theme: 'light' | 'dark'
  // Shift config embedded
  shiftConfigs: {
    S1: { startTime: string; endTime: string }
    S2: { startTime: string; endTime: string }
    S3: { startTime: string; endTime: string }
  }
  workOffDays: number[] // 0=Sun,1=Mon,...,6=Sat
  createdAt: string
  updatedAt: string
}

// Dashboard aggregate type
export interface DashboardData {
  todayDate: string
  todayShift: ShiftCode
  completedVideos: number
  totalVideos: number
  completedStudyDays: number
  totalDays: number
  completedGymSessions: number
  totalStudyMinutes: number
  recentJournalEntries: JournalEntry[]
  currentStreak: number
  longestStreak: number
  todayStudyRecord?: DailyStudyRecord
  todayGymSession?: GymSession
  todayJournalEntry?: JournalEntry
  todayVideo?: CourseVideo
}
