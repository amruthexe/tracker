import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IShiftSchedule extends Document {
  scheduleDate: Date
  shiftCode: 'S1' | 'S2' | 'S3' | 'OFF'
  isWfh: boolean
  overrideNote?: string
  createdAt: Date
  updatedAt: Date
}

const ShiftScheduleSchema = new Schema<IShiftSchedule>({
  scheduleDate: { type: Date, required: true, unique: true },
  shiftCode: { type: String, enum: ['S1', 'S2', 'S3', 'OFF'], required: true },
  isWfh: { type: Boolean, default: false },
  overrideNote: { type: String },
}, { timestamps: true })

ShiftScheduleSchema.index({ scheduleDate: 1 })

export const ShiftScheduleModel: Model<IShiftSchedule> =
  mongoose.models.ShiftSchedule || mongoose.model<IShiftSchedule>('ShiftSchedule', ShiftScheduleSchema)
