import mongoose from 'mongoose';

const PersonalNoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, default: 'Untitled' },
  content: { type: String, default: '' },
  icon: { type: String, default: 'file' }, // lucide icon name instead of emoji
  isFavorite: { type: Boolean, default: false },
  isFolder: { type: Boolean, default: false },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonalNote', default: null },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt before saving
PersonalNoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('PersonalNote', PersonalNoteSchema);

