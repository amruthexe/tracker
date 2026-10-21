import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICourseVideo extends Document {
  videoNumber: number
  title: string
  durationMinutes: number
  defaultPlannedDate: Date
}

const CourseVideoSchema = new Schema<ICourseVideo>({
  videoNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  durationMinutes: { type: Number, default: 150 },
  defaultPlannedDate: { type: Date },
}, { timestamps: false })

export const CourseVideoModel: Model<ICourseVideo> =
  mongoose.models.CourseVideo || mongoose.model<ICourseVideo>('CourseVideo', CourseVideoSchema)
