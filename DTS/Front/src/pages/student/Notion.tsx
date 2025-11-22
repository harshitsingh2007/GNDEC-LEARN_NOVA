import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { palette } from '@/theme/palette';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import {
  Plus,
  Search,
  Trash2,
  Star,
  StarOff,
  FileText,
  Edit2,
  Save,
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface PersonalNote {
  _id: string;
  title: string;
  content: string;
  icon: string;
  isFavorite: boolean;
  tags: string[];
  isFolder: boolean;
  parentFolder: string | null;
  createdAt: string;
  updatedAt: string;
}

const Notion = () => {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([{ id: null, name: 'Home' }]);

  // Get icon component from string name
  const getIcon = (iconName: string, isFolder: boolean) => {
    const IconComponent = (LucideIcons as any)[iconName] || (isFolder ? Folder : FileText);
    return IconComponent;
  };

  // Fetch all notes
  const fetchNotes = async (folderId: string | null = null) => {
    try {
      setLoading(true);
      const url = folderId 
        ? `http://localhost:5000/api/personal-notes?folderId=${folderId}`
        : 'http://localhost:5000/api/personal-notes';
      const { data } = await axios.get(url, {
        withCredentials: true,
      });
      if (data.success) {
        setNotes(data.notes);
        // Auto-select first note if none selected and not in folder view
        if (!selectedNote && data.notes.length > 0 && !folderId) {
          const firstNote = data.notes.find((n: PersonalNote) => !n.isFolder) || data.notes[0];
          if (firstNote) {
            setSelectedNote(firstNote);
            setTitleValue(firstNote.title);
          }
        }
      }
    } catch (err: any) {
      console.error('Fetch notes error:', err);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(currentFolderId);
  }, [currentFolderId]);

  // Create new note
  const handleCreateNote = async () => {
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/personal-notes',
        {
          title: 'Untitled',
          content: '',
          icon: 'FileText',
          isFolder: false,
          parentFolder: currentFolderId,
        },
        { withCredentials: true }
      );
      if (data.success) {
        await fetchNotes(currentFolderId);
        setSelectedNote(data.note);
        setTitleValue('Untitled');
        setEditingTitle(true);
        toast.success('New note created!');
      }
    } catch (err: any) {
      console.error('Create note error:', err);
      toast.error('Failed to create note');
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/personal-notes',
        {
          title: 'New Folder',
          content: '',
          icon: 'Folder',
          isFolder: true,
          parentFolder: currentFolderId,
        },
        { withCredentials: true }
      );
      if (data.success) {
        await fetchNotes(currentFolderId);
        setExpandedFolders(new Set([...expandedFolders, data.note._id]));
        toast.success('New folder created!');
      }
    } catch (err: any) {
      console.error('Create folder error:', err);
      toast.error('Failed to create folder');
    }
  };

  // Navigate into folder
  const handleOpenFolder = (folder: PersonalNote) => {
    setCurrentFolderId(folder._id);
    setFolderPath([...folderPath, { id: folder._id, name: folder.title }]);
    setExpandedFolders(new Set([...expandedFolders, folder._id]));
  };

  // Navigate back
  const handleNavigateBack = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    const targetFolderId = newPath[newPath.length - 1].id;
    setCurrentFolderId(targetFolderId);
  };

  // Save note content
  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      setSaving(true);
      const { data } = await axios.put(
        `http://localhost:5000/api/personal-notes/${selectedNote._id}`,
        {
          title: titleValue || selectedNote.title,
          content: selectedNote.content,
        },
        { withCredentials: true }
      );
      if (data.success) {
        setSelectedNote(data.note);
        setNotes(notes.map(n => n._id === selectedNote._id ? data.note : n));
        setEditingTitle(false);
        toast.success('Note saved!');
      }
    } catch (err: any) {
      console.error('Save note error:', err);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // Update note content
  const handleContentChange = (value: string | undefined) => {
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, content: value || '' });
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:5000/api/personal-notes/${noteId}`,
        { withCredentials: true }
      );
      if (data.success) {
        await fetchNotes(currentFolderId);
        if (selectedNote?._id === noteId) {
          setSelectedNote(null);
        }
        toast.success('Deleted successfully');
      }
    } catch (err: any) {
      console.error('Delete note error:', err);
      toast.error('Failed to delete');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (noteId: string, currentFavorite: boolean) => {
    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/personal-notes/${noteId}`,
        { isFavorite: !currentFavorite },
        { withCredentials: true }
      );
      if (data.success) {
        setNotes(notes.map(n => n._id === noteId ? data.note : n));
        if (selectedNote?._id === noteId) {
          setSelectedNote(data.note);
        }
      }
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folders = filteredNotes.filter(n => n.isFolder);
  const favoriteNotes = filteredNotes.filter(n => !n.isFolder && n.isFavorite);
  const regularNotes = filteredNotes.filter(n => !n.isFolder && !n.isFavorite);

  return (
    <div className="flex h-screen" style={{ background: palette.bg }}>
      {/* Sidebar */}
      <div
        className="w-64 border-r flex flex-col"
        style={{ background: palette.card, borderColor: palette.border }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: palette.border }}>
          <Button
            onClick={handleCreateNote}
            className="w-full"
            style={{ background: palette.accentDeep, color: palette.card }}
            onMouseEnter={e => e.currentTarget.style.background = palette.accent}
            onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b" style={{ borderColor: palette.border }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: palette.text2 }} />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
              style={{ background: palette.cardHover, color: palette.text, borderColor: palette.border }}
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center text-sm p-4" style={{ color: palette.text2 }}>Loading...</p>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold px-2 mb-2 uppercase" style={{ color: palette.text2 }}>
                    Folders
                  </p>
                  {folders.map(folder => {
                    const IconComponent = getIcon(folder.icon, true);
                    return (
                      <motion.div
                        key={folder._id}
                        className="group flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-1"
                        style={{
                          background: 'transparent',
                          color: palette.text,
                        }}
                        onClick={() => {
                          if (folder.isFolder) {
                            handleOpenFolder(folder);
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {expandedFolders.has(folder._id) ? (
                          <FolderOpen className="w-4 h-4" style={{ color: palette.accent }} />
                        ) : (
                          <IconComponent className="w-4 h-4" style={{ color: palette.accent }} />
                        )}
                        <span className="flex-1 truncate text-sm font-medium">{folder.title}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteNote(folder._id);
                            }}
                            className="p-1 rounded hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {favoriteNotes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold px-2 mb-2 uppercase" style={{ color: palette.text2 }}>
                    Favorites
                  </p>
                  {favoriteNotes.map(note => (
                    <NoteItem
                      key={note._id}
                      note={note}
                      isSelected={selectedNote?._id === note._id}
                      onSelect={() => {
                        if (!note.isFolder) {
                          setSelectedNote(note);
                          setTitleValue(note.title);
                          setEditingTitle(false);
                        }
                      }}
                      onDelete={() => handleDeleteNote(note._id)}
                      onToggleFavorite={() => handleToggleFavorite(note._id, note.isFavorite)}
                      getIcon={getIcon}
                    />
                  ))}
                </div>
              )}
              <div>
                {(folders.length > 0 || favoriteNotes.length > 0) && (
                  <p className="text-xs font-semibold px-2 mb-2 uppercase" style={{ color: palette.text2 }}>
                    Pages
                  </p>
                )}
                {regularNotes.map(note => (
                  <NoteItem
                    key={note._id}
                    note={note}
                    isSelected={selectedNote?._id === note._id}
                    onSelect={() => {
                      if (!note.isFolder) {
                        setSelectedNote(note);
                        setTitleValue(note.title);
                        setEditingTitle(false);
                      }
                    }}
                    onDelete={() => handleDeleteNote(note._id)}
                    onToggleFavorite={() => handleToggleFavorite(note._id, note.isFavorite)}
                    getIcon={getIcon}
                  />
                ))}
              </div>
              {filteredNotes.length === 0 && (
                <p className="text-center text-sm p-4" style={{ color: palette.text2 }}>
                  {searchQuery ? 'No notes found' : 'No notes yet. Create one!'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote && !selectedNote.isFolder ? (
          <>
            {/* Toolbar */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ background: palette.card, borderColor: palette.border }}
            >
              <div className="flex items-center gap-2 flex-1">
                {editingTitle ? (
                  <>
                    <Input
                      value={titleValue}
                      onChange={e => setTitleValue(e.target.value)}
                      className="max-w-md"
                      style={{ background: palette.cardHover, color: palette.text, borderColor: palette.border }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSaveNote();
                        } else if (e.key === 'Escape') {
                          setTitleValue(selectedNote.title);
                          setEditingTitle(false);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={saving}
                      style={{ background: palette.accentDeep, color: palette.card }}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTitleValue(selectedNote.title);
                        setEditingTitle(false);
                      }}
                      style={{ borderColor: palette.border, color: palette.text }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {(() => {
                      const IconComponent = getIcon(selectedNote.icon, selectedNote.isFolder);
                      return <IconComponent className="w-6 h-6" style={{ color: palette.accent }} />;
                    })()}
                    <h1
                      className="text-xl font-semibold cursor-pointer hover:opacity-70"
                      onClick={() => setEditingTitle(true)}
                      style={{ color: palette.text }}
                    >
                      {selectedNote.title}
                    </h1>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingTitle(true)}
                      style={{ color: palette.text2 }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleFavorite(selectedNote._id, selectedNote.isFavorite)}
                  style={{ borderColor: palette.border, color: palette.text }}
                >
                  {selectedNote.isFavorite ? (
                    <Star className="w-4 h-4" style={{ color: '#FBBF24' }} fill="#FBBF24" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={saving}
                  style={{ background: palette.accentDeep, color: palette.card }}
                  onMouseEnter={e => e.currentTarget.style.background = palette.accent}
                  onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-6" style={{ background: palette.bg }}>
              <div data-color-mode="light">
                <MDEditor
                  value={selectedNote.content}
                  onChange={handleContentChange}
                  height={600}
                  previewOptions={{
                    rehypePlugins: [],
                  }}
                  textareaProps={{
                    style: {
                      background: palette.card,
                      color: palette.text,
                      borderColor: palette.border,
                    }
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ background: palette.bg }}>
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
              <p className="text-lg font-semibold mb-2" style={{ color: palette.text }}>
                No note selected
              </p>
              <p className="text-sm mb-4" style={{ color: palette.text2 }}>
                Select a note from the sidebar or create a new one
              </p>
              <Button
                onClick={handleCreateNote}
                style={{ background: palette.accentDeep, color: palette.card }}
                onMouseEnter={e => e.currentTarget.style.background = palette.accent}
                onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Note Item Component
const NoteItem = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onToggleFavorite,
  getIcon,
}: {
  note: PersonalNote;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  getIcon: (iconName: string, isFolder: boolean) => any;
}) => {
  const IconComponent = getIcon(note.icon, note.isFolder);
  return (
    <motion.div
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-1 ${
        isSelected ? '' : 'hover:bg-gray-100'
      }`}
      style={{
        background: isSelected ? palette.accentSoft : 'transparent',
        color: isSelected ? palette.accent : palette.text,
      }}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <IconComponent className="w-4 h-4" style={{ color: isSelected ? palette.accent : palette.text2 }} />
      <span className="flex-1 truncate text-sm font-medium">{note.title}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="p-1 rounded hover:bg-gray-200"
        >
          {note.isFavorite ? (
            <Star className="w-3 h-3" style={{ color: '#FBBF24' }} fill="#FBBF24" />
          ) : (
            <StarOff className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-100"
        >
          <Trash2 className="w-3 h-3" style={{ color: '#EF4444' }} />
        </button>
      </div>
    </motion.div>
  );
};

export default Notion;

