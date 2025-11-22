import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    xpAwarded: { type: Boolean, default: false }
  }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

QuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Use a different model name to avoid conflict with quiz Questions model
export default mongoose.models.ForumQuestion || mongoose.model('ForumQuestion', QuestionSchema);
