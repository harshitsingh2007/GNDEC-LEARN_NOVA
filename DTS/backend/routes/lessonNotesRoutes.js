import express from 'express';
import { saveNote, getNote } from '../Controllers/lessonNotesController.js';
import { protect } from '../MiddleWare/authMiddleware.js';

const router = express.Router();

router.get('/:lessonId', protect, getNote);
router.post('/:lessonId', protect, saveNote);

export default router;
