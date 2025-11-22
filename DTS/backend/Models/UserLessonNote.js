import mongoose from 'mongoose';

const UserLessonNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  lesson: { type: mongoose.Schema.Types.ObjectId, required: true },
  note: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('UserLessonNote', UserLessonNoteSchema);
