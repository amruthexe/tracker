import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IJournalEntry extends Document {
  entryDate: Date
  mood: 'great' | 'good' | 'average' | 'hard'
  whatLearned?: string
  whatCompleted?: string
  whatWentWell?: string
  problemsFaced?: string
  improveTomorrow?: string
  freeNotes?: string
  createdAt: Date
  updatedAt: Date
}

const JournalEntrySchema = new Schema<IJournalEntry>({
  entryDate: { type: Date, required: true, unique: true },
  mood: { type: String, enum: ['great', 'good', 'average', 'hard'], required: true },
  whatLearned: { type: String },
  whatCompleted: { type: String },
  whatWentWell: { type: String },
  problemsFaced: { type: String },
  improveTomorrow: { type: String },
  freeNotes: { type: String },
}, { timestamps: true })

JournalEntrySchema.index({ entryDate: -1 })

export const JournalEntryModel: Model<IJournalEntry> =
  mongoose.models.JournalEntry || mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema)
