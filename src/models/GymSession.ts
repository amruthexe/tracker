import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGymSession extends Document {
  sessionDate: Date
  plannedMinutes: number
  actualMinutes?: number
  workoutType?: string
  exercises?: string
  energyLevel?: number
  isRecoveryDay: boolean
  notes?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const GymSessionSchema = new Schema<IGymSession>({
  sessionDate: { type: Date, required: true, unique: true },
  plannedMinutes: { type: Number, default: 90 },
  actualMinutes: { type: Number },
  workoutType: { type: String },
  exercises: { type: String },
  energyLevel: { type: Number, min: 1, max: 5 },
  isRecoveryDay: { type: Boolean, default: false },
  notes: { type: String },
  completedAt: { type: Date },
}, { timestamps: true })

GymSessionSchema.index({ sessionDate: 1 })

export const GymSessionModel: Model<IGymSession> =
  mongoose.models.GymSession || mongoose.model<IGymSession>('GymSession', GymSessionSchema)
