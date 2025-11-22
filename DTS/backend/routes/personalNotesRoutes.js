import express from 'express';
import { getAllNotes, getNote, createNote, updateNote, deleteNote } from '../Controllers/personalNotesController.js';
import { protect } from '../MiddleWare/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllNotes);
router.get('/:noteId', protect, getNote);
router.post('/', protect, createNote);
router.put('/:noteId', protect, updateNote);
router.delete('/:noteId', protect, deleteNote);

export default router;

