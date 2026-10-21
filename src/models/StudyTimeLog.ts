import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStudyTimeLog extends Document {
  logDate: Date
  taskName: string
  startTime?: Date
  endTime?: Date
  durationMinutes: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const StudyTimeLogSchema = new Schema<IStudyTimeLog>({
  logDate: { type: Date, required: true },
  taskName: { type: String, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  durationMinutes: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true })

StudyTimeLogSchema.index({ logDate: 1 })

export const StudyTimeLogModel: Model<IStudyTimeLog> =
  mongoose.models.StudyTimeLog || mongoose.model<IStudyTimeLog>('StudyTimeLog', StudyTimeLogSchema)
