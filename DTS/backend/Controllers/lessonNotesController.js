import UserLessonNote from '../Models/UserLessonNote.js';

export const saveNote = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { note, courseId, moduleId } = req.body;
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Lesson ID is required.' });
    }
    
    const update = {
      note: note || '',
      updatedAt: Date.now(),
      course: courseId,
      module: moduleId || undefined
    };
    const filter = { user, lesson: lessonId };
    const saved = await UserLessonNote.findOneAndUpdate(
      filter,
      update,
      { new: true, upsert: true }
    );
    res.json({ success: true, note: saved });
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to save note.' });
  }
};

export const getNote = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Lesson ID is required.' });
    }
    
    const found = await UserLessonNote.findOne({ user, lesson: lessonId });
    res.json({ success: true, note: found || null });
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch note.' });
  }
};
