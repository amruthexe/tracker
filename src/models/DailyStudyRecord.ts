import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDailyStudyRecord extends Document {
  studyDate: Date
  taskVideoDone: boolean
  taskCodingDone: boolean
  taskNotesDone: boolean
  taskRevisionDone: boolean
  taskFeedbackDone: boolean
  plannedMinutes: number
  actualMinutes: number
  dayType: 'video' | 'project' | 'off'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const DailyStudyRecordSchema = new Schema<IDailyStudyRecord>({
  studyDate: { type: Date, required: true, unique: true },
  taskVideoDone: { type: Boolean, default: false },
  taskCodingDone: { type: Boolean, default: false },
  taskNotesDone: { type: Boolean, default: false },
  taskRevisionDone: { type: Boolean, default: false },
  taskFeedbackDone: { type: Boolean, default: false },
  plannedMinutes: { type: Number, default: 240 },
  actualMinutes: { type: Number, default: 0 },
  dayType: { type: String, enum: ['video', 'project', 'off'], default: 'video' },
  notes: { type: String },
}, { timestamps: true })

DailyStudyRecordSchema.index({ studyDate: 1 })

export const DailyStudyRecordModel: Model<IDailyStudyRecord> =
  mongoose.models.DailyStudyRecord || mongoose.model<IDailyStudyRecord>('DailyStudyRecord', DailyStudyRecordSchema)
