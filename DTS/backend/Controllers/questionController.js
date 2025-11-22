import ForumQuestion from '../Models/Question.js';
import User from '../Models/User.js';

// Get all questions
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await ForumQuestion.find()
      .populate('user', 'username email')
      .populate('replies.user', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (err) {
    console.error('Get all questions error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch questions.' });
  }
};

// Get a single question
export const getQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await ForumQuestion.findById(questionId)
      .populate('user', 'username email')
      .populate('replies.user', 'username email');
    
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }
    
    // Increment views
    question.views += 1;
    await question.save();
    
    res.json({ success: true, question });
  } catch (err) {
    console.error('Get question error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch question.' });
  }
};

// Create a question
export const createQuestion = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { title, content, tags } = req.body;
    
    const question = new ForumQuestion({
      user,
      title,
      content,
      tags: tags || [],
    });
    await question.save();
    
    const populated = await ForumQuestion.findById(question._id)
      .populate('user', 'username email');
    
    res.json({ success: true, question: populated });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create question.' });
  }
};

// Reply to a question
export const replyToQuestion = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { questionId } = req.params;
    const { content } = req.body;
    
    const question = await ForumQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }
    
    // Check if user already replied (to prevent spam)
    const alreadyReplied = question.replies.some(r => r.user.toString() === user.toString());
    
    const reply = {
      user,
      content,
      createdAt: new Date(),
      xpAwarded: false,
    };
    
    question.replies.push(reply);
    await question.save();
    
    // Award 10 XP to the replier (only once per question)
    if (!alreadyReplied) {
      const replier = await User.findById(user);
      if (replier) {
        replier.addXP(10);
        await replier.save();
        
        // Mark reply as XP awarded
        const replyIndex = question.replies.length - 1;
        question.replies[replyIndex].xpAwarded = true;
        await question.save();
      }
    }
    
    const populated = await ForumQuestion.findById(questionId)
      .populate('user', 'username email')
      .populate('replies.user', 'username email');
    
    res.json({ success: true, question: populated });
  } catch (err) {
    console.error('Reply to question error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to reply to question.' });
  }
};

// Upvote a question
export const upvoteQuestion = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { questionId } = req.params;
    
    const question = await ForumQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }
    
    const hasUpvoted = question.upvotes.some(id => id.toString() === user.toString());
    
    if (hasUpvoted) {
      question.upvotes = question.upvotes.filter(id => id.toString() !== user.toString());
    } else {
      question.upvotes.push(user);
    }
    
    await question.save();
    res.json({ success: true, question });
  } catch (err) {
    console.error('Upvote question error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to upvote question.' });
  }
};

// Mark question as resolved
export const markResolved = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { questionId } = req.params;
    
    const question = await ForumQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }
    
    // Only the question author can mark it as resolved
    if (question.user.toString() !== user.toString()) {
      return res.status(403).json({ success: false, error: 'Only the question author can mark it as resolved.' });
    }
    
    question.isResolved = !question.isResolved;
    await question.save();
    
    res.json({ success: true, question });
  } catch (err) {
    console.error('Mark resolved error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to mark question as resolved.' });
  }
};
