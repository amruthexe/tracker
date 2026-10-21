import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IVideoProgress extends Document {
  videoId: Types.ObjectId
  plannedDate?: Date
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt?: Date
  actualDurationMinutes?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const VideoProgressSchema = new Schema<IVideoProgress>({
  videoId: { type: Schema.Types.ObjectId, ref: 'CourseVideo', required: true, unique: true },
  plannedDate: { type: Date },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  completedAt: { type: Date },
  actualDurationMinutes: { type: Number },
  notes: { type: String },
}, { timestamps: true })

VideoProgressSchema.index({ videoId: 1 })
VideoProgressSchema.index({ plannedDate: 1 })

export const VideoProgressModel: Model<IVideoProgress> =
  mongoose.models.VideoProgress || mongoose.model<IVideoProgress>('VideoProgress', VideoProgressSchema)
