import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUserProfile extends Document {
  displayName: string
  timezone: string
  startDate: Date
  endDate: Date
  dailyStudyTargetMinutes: number
  gymTargetMinutes: number
  preferredSleepHours: number
  commuteMinutes: number
  notificationStudy: boolean
  notificationGym: boolean
  notificationJournal: boolean
  theme: 'light' | 'dark'
  shiftConfigs: {
    S1: { startTime: string; endTime: string; crossesMidnight: boolean }
    S2: { startTime: string; endTime: string; crossesMidnight: boolean }
    S3: { startTime: string; endTime: string; crossesMidnight: boolean }
  }
  workOffDays: number[]
  createdAt: Date
  updatedAt: Date
}

const UserProfileSchema = new Schema<IUserProfile>({
  displayName: { type: String, default: 'My Tracker' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  startDate: { type: Date, default: new Date('2026-10-22') },
  endDate: { type: Date, default: new Date('2026-11-20') },
  dailyStudyTargetMinutes: { type: Number, default: 240 },
  gymTargetMinutes: { type: Number, default: 90 },
  preferredSleepHours: { type: Number, default: 7.5 },
  commuteMinutes: { type: Number, default: 30 },
  notificationStudy: { type: Boolean, default: true },
  notificationGym: { type: Boolean, default: true },
  notificationJournal: { type: Boolean, default: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  shiftConfigs: {
    S1: {
      startTime: { type: String, default: '06:00' },
      endTime: { type: String, default: '14:00' },
      crossesMidnight: { type: Boolean, default: false },
    },
    S2: {
      startTime: { type: String, default: '14:00' },
      endTime: { type: String, default: '22:30' },
      crossesMidnight: { type: Boolean, default: false },
    },
    S3: {
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '06:30' },
      crossesMidnight: { type: Boolean, default: true },
    },
  },
  workOffDays: { type: [Number], default: [4, 5] }, // Thu=4, Fri=5
}, { timestamps: true })

export const UserProfileModel: Model<IUserProfile> =
  mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema)
