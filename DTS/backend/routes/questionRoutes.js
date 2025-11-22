import express from 'express';
import { getAllQuestions, getQuestion, createQuestion, replyToQuestion, upvoteQuestion, markResolved } from '../Controllers/questionController.js';
import { protect } from '../MiddleWare/authMiddleware.js';

const router = express.Router();

router.get('/', getAllQuestions);
router.get('/:questionId', getQuestion);
router.post('/', protect, createQuestion);
router.post('/:questionId/reply', protect, replyToQuestion);
router.post('/:questionId/upvote', protect, upvoteQuestion);
router.post('/:questionId/resolve', protect, markResolved);

export default router;
