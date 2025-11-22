import React, { useEffect, useState } from 'react';
import { palette } from '@/theme/palette';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface LessonNotesProps {
  lessonId?: string;
  courseId?: string;
  moduleId?: string;
}

const LessonNotes: React.FC<LessonNotesProps> = ({ lessonId, courseId, moduleId }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId) {
      setLoading(true);
      axios.get(`http://localhost:5000/api/notes/${lessonId}`, { withCredentials: true })
        .then(r => setNote(r.data?.note?.note || ''))
        .catch(() => setNote(''))
        .finally(() => setLoading(false));
    }
  }, [lessonId]);

  const handleSave = async () => {
    if (!lessonId) return;
    setSaving(true);
    try {
      await axios.post(`http://localhost:5000/api/notes/${lessonId}`, {
        note,
        courseId,
        moduleId,
      }, { withCredentials: true });
      toast.success('Note saved!');
    } catch (err: any) {
      console.error('Save note error:', err);
      toast.error(err.response?.data?.error || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  if (!lessonId) return null;

  return (
    <div className="rounded-lg border mt-4" style={{ background: palette.cardHover, borderColor: palette.border }}>
      <label className="block mb-1 font-medium text-sm px-4 pt-4" style={{ color: palette.text }}>
        Personal Note for this Lesson
      </label>
      <div className="px-4 pb-2" data-color-mode="light" style={{ background: palette.cardHover }}>
        <MDEditor
          value={note}
          height={210}
          onChange={(value) => setNote(value || '')}
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
      <div className="flex justify-end items-center gap-2 p-4 pt-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          style={{ background: palette.accentDeep, color: palette.card }}
          onMouseEnter={e => { e.currentTarget.style.background = palette.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = palette.accentDeep; }}
        >
          {saving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
      <div className="px-4 pb-4">
        <div className="font-medium mb-2 text-xs text-slate-500" style={{ color: palette.text2 }}>Preview:</div>
        <MDEditor.Markdown source={note} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12, minHeight: 52 }} />
      </div>
    </div>
  );
};

export default LessonNotes;
