import PersonalNote from '../Models/PersonalNote.js';

// Get all notes for a user (organized by folders)
export const getAllNotes = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { folderId } = req.query;
    
    let query= { user };
    if (folderId) {
      query.parentFolder = folderId;
    } else {
      query.parentFolder = null; // Root level items
    }
    
    const notes = await PersonalNote.find(query)
      .sort({ isFolder: -1, updatedAt: -1 }); // Folders first, then notes
    res.json({ success: true, notes });
  } catch (err) {
    console.error('Get all notes error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch notes.' });
  }
};

// Get a single note
export const getNote = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { noteId } = req.params;
    const note = await PersonalNote.findOne({ _id: noteId, user });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }
    res.json({ success: true, note });
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch note.' });
  }
};

// Create a new note or folder
export const createNote = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { title, content, icon, isFolder, parentFolder } = req.body;
    const note = new PersonalNote({
      user,
      title: title || (isFolder ? 'New Folder' : 'Untitled'),
      content: content || '',
      icon: icon || (isFolder ? 'Folder' : 'FileText'),
      isFolder: isFolder || false,
      parentFolder: parentFolder || null,
    });
    await note.save();
    
    // If it's a child, add to parent's children array (if parent exists)
    if (parentFolder) {
      const parent = await PersonalNote.findOne({ _id: parentFolder, user });
      if (parent && parent.isFolder) {
        // Note: We're not using children array in the model, but we can track via parentFolder
      }
    }
    
    res.json({ success: true, note });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create note.' });
  }
};

// Update a note
export const updateNote = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { noteId } = req.params;
    const { title, content, icon, isFavorite, tags, parentFolder } = req.body;
    
    const note = await PersonalNote.findOne({ _id: noteId, user });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }
    
    // Handle folder move
    if (parentFolder !== undefined && parentFolder !== note.parentFolder?.toString()) {
      // Remove from old parent
      if (note.parentFolder) {
        await PersonalNote.findByIdAndUpdate(note.parentFolder, {
          $pull: { children: noteId }
        });
      }
      // Add to new parent
      if (parentFolder) {
        await PersonalNote.findByIdAndUpdate(parentFolder, {
          $push: { children: noteId }
        });
      }
    }
    
    const updated = await PersonalNote.findOneAndUpdate(
      { _id: noteId, user },
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(icon !== undefined && { icon }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(tags !== undefined && { tags }),
        ...(parentFolder !== undefined && { parentFolder: parentFolder || null }),
        updatedAt: Date.now(),
      },
      { new: true }
    );
    
    res.json({ success: true, note: updated });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update note.' });
  }
};

// Delete a note (and its children if it's a folder)
export const deleteNote = async (req, res) => {
  try {
    const user = req.user._id || req.user.id;
    const { noteId } = req.params;
    const note = await PersonalNote.findOne({ _id: noteId, user });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found.' });
    }
    
    // If it's a folder, delete all children recursively
    if (note.isFolder) {
      const children = await PersonalNote.find({ parentFolder: noteId, user });
      for (const child of children) {
        await PersonalNote.findOneAndDelete({ _id: child._id, user });
      }
    }
    
    // Remove from parent's children array
    if (note.parentFolder) {
      await PersonalNote.findByIdAndUpdate(note.parentFolder, {
        $pull: { children: noteId }
      });
    }
    
    await PersonalNote.findByIdAndDelete(noteId);
    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to delete note.' });
  }
};

