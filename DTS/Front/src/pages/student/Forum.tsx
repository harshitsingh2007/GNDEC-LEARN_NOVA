import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { palette } from '@/theme/palette';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Send,
  Tag,
  Clock,
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface Reply {
  _id: string;
  user: {
    username: string;
    email: string;
  };
  content: string;
  createdAt: string;
  xpAwarded: boolean;
}

interface Question {
  _id: string;
  user: {
    username: string;
    email: string;
  };
  title: string;
  content: string;
  tags: string[];
  replies: Reply[];
  upvotes: string[];
  views: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

const Forum = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' });
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  // Fetch all questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5000/api/questions', {
        withCredentials: true,
      });
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err: any) {
      console.error('Fetch questions error:', err);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Fetch single question details
  const fetchQuestion = async (questionId: string) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/questions/${questionId}`, {
        withCredentials: true,
      });
      if (data.success) {
        setSelectedQuestion(data.question);
      }
    } catch (err: any) {
      console.error('Fetch question error:', err);
      toast.error('Failed to load question');
    }
  };

  // Create new question
  const handleCreateQuestion = async () => {
    try {
      const tags = newQuestion.tags.split(',').map(t => t.trim()).filter(t => t);
      const { data } = await axios.post(
        'http://localhost:5000/api/questions',
        {
          title: newQuestion.title,
          content: newQuestion.content,
          tags,
        },
        { withCredentials: true }
      );
      if (data.success) {
        setQuestions([data.question, ...questions]);
        setShowCreateDialog(false);
        setNewQuestion({ title: '', content: '', tags: '' });
        toast.success('Question posted!');
      }
    } catch (err: any) {
      console.error('Create question error:', err);
      toast.error('Failed to create question');
    }
  };

  // Reply to question
  const handleReply = async () => {
    if (!selectedQuestion || !replyContent.trim()) return;
    try {
      setReplying(true);
      const { data } = await axios.post(
        `http://localhost:5000/api/questions/${selectedQuestion._id}/reply`,
        { content: replyContent },
        { withCredentials: true }
      );
      if (data.success) {
        setSelectedQuestion(data.question);
        setReplyContent('');
        toast.success('Reply posted! +10 XP');
        await fetchQuestions(); // Refresh list
      }
    } catch (err: any) {
      console.error('Reply error:', err);
      toast.error('Failed to post reply');
    } finally {
      setReplying(false);
    }
  };

  // Upvote question
  const handleUpvote = async (questionId: string) => {
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/questions/${questionId}/upvote`,
        {},
        { withCredentials: true }
      );
      if (data.success) {
        setQuestions(questions.map(q => q._id === questionId ? data.question : q));
        if (selectedQuestion?._id === questionId) {
          setSelectedQuestion(data.question);
        }
      }
    } catch (err: any) {
      console.error('Upvote error:', err);
    }
  };

  // Mark as resolved
  const handleMarkResolved = async (questionId: string) => {
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/questions/${questionId}/resolve`,
        {},
        { withCredentials: true }
      );
      if (data.success) {
        setQuestions(questions.map(q => q._id === questionId ? data.question : q));
        if (selectedQuestion?._id === questionId) {
          setSelectedQuestion(data.question);
        }
        toast.success('Question marked as resolved!');
      }
    } catch (err: any) {
      console.error('Mark resolved error:', err);
      toast.error('Failed to mark as resolved');
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen" style={{ background: palette.bg }}>
      {/* Questions List Sidebar */}
      <div
        className="w-80 border-r flex flex-col"
        style={{ background: palette.card, borderColor: palette.border }}
      >
        {/* Header */}
        <div className="p-4 border-b space-y-2" style={{ borderColor: palette.border }}>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full"
            style={{ background: palette.accentDeep, color: palette.card }}
            onMouseEnter={e => e.currentTarget.style.background = palette.accent}
            onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ask Question
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b" style={{ borderColor: palette.border }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: palette.text2 }} />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
              style={{ background: palette.cardHover, color: palette.text, borderColor: palette.border }}
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center text-sm p-4" style={{ color: palette.text2 }}>Loading...</p>
          ) : (
            <>
              {filteredQuestions.map(question => (
                <motion.div
                  key={question._id}
                  className={`p-3 rounded-lg cursor-pointer mb-2 ${
                    selectedQuestion?._id === question._id ? '' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    background: selectedQuestion?._id === question._id ? palette.accentSoft : palette.cardHover,
                    border: `1px solid ${selectedQuestion?._id === question._id ? palette.accent : palette.border}`,
                  }}
                  onClick={() => fetchQuestion(question._id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm flex-1" style={{ color: palette.text }}>
                      {question.title}
                    </h3>
                    {question.isResolved && (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
                    )}
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{ color: palette.text2 }}>
                    {question.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: palette.text2 }}>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {question.replies.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {question.upvotes.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {question.views}
                    </span>
                  </div>
                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ background: palette.accentSoft, color: palette.accent }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {filteredQuestions.length === 0 && (
                <p className="text-center text-sm p-4" style={{ color: palette.text2 }}>
                  {searchQuery ? 'No questions found' : 'No questions yet. Be the first to ask!'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Question Detail View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedQuestion ? (
          <>
            {/* Question Header */}
            <div className="p-6 border-b" style={{ background: palette.card, borderColor: palette.border }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold" style={{ color: palette.text }}>
                      {selectedQuestion.title}
                    </h1>
                    {selectedQuestion.isResolved && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1" style={{ background: '#10B9811A', color: '#10B981' }}>
                        <CheckCircle2 className="w-4 h-4" />
                        Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-3" style={{ color: palette.text2 }}>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedQuestion.user.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(selectedQuestion.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedQuestion.views} views
                    </span>
                  </div>
                  {selectedQuestion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded text-xs flex items-center gap-1"
                          style={{ background: palette.accentSoft, color: palette.accent }}
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUpvote(selectedQuestion._id)}
                    style={{ borderColor: palette.border, color: palette.text }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {selectedQuestion.upvotes.length}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleMarkResolved(selectedQuestion._id)}
                    disabled={selectedQuestion.isResolved}
                    style={{ borderColor: palette.border, color: palette.text }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </Button>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                <CardContent className="p-6">
                  <div data-color-mode="light">
                    <MDEditor.Markdown
                      source={selectedQuestion.content}
                      style={{ background: 'transparent', color: palette.text }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Replies Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: palette.text }}>
                  Replies ({selectedQuestion.replies.length})
                </h2>
                <div className="space-y-4">
                  {selectedQuestion.replies.map(reply => (
                    <Card key={reply._id} style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: palette.accent }} />
                            <span className="font-medium text-sm" style={{ color: palette.text }}>
                              {reply.user.username}
                            </span>
                            {reply.xpAwarded && (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#10B9811A', color: '#10B981' }}>
                                +10 XP
                              </span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: palette.text2 }}>
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <div data-color-mode="light" className="mt-2">
                          <MDEditor.Markdown
                            source={reply.content}
                            style={{ background: 'transparent', color: palette.text }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {selectedQuestion.replies.length === 0 && (
                    <p className="text-center py-8" style={{ color: palette.text2 }}>
                      No replies yet. Be the first to help!
                    </p>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: palette.text }}>
                    Your Reply
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div data-color-mode="light">
                    <MDEditor
                      value={replyContent}
                      onChange={(value) => setReplyContent(value || '')}
                      height={200}
                      previewOptions={{
                        rehypePlugins: [],
                      }}
                      textareaProps={{
                        style: {
                          background: palette.cardHover,
                          color: palette.text,
                          borderColor: palette.border,
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleReply}
                    disabled={!replyContent.trim() || replying}
                    className="w-full sm:w-auto"
                    style={{ background: palette.accentDeep, color: palette.card }}
                    onMouseEnter={e => e.currentTarget.style.background = palette.accent}
                    onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
                  >
                    {replying ? (
                      'Posting...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post Reply (+10 XP)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ background: palette.bg }}>
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
              <p className="text-lg font-semibold mb-2" style={{ color: palette.text }}>
                Select a question to view
              </p>
              <p className="text-sm mb-4" style={{ color: palette.text2 }}>
                Choose a question from the sidebar or create a new one
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                style={{ background: palette.accentDeep, color: palette.card }}
                onMouseEnter={e => e.currentTarget.style.background = palette.accent}
                onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ask Question
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Question Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle style={{ color: palette.text }}>Ask a Question</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
                style={{ color: palette.text2 }}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Question title..."
                value={newQuestion.title}
                onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
                style={{ background: palette.cardHover, color: palette.text, borderColor: palette.border }}
              />
              <div data-color-mode="light">
                <MDEditor
                  value={newQuestion.content}
                  onChange={(value) => setNewQuestion({ ...newQuestion, content: value || '' })}
                  height={300}
                  previewOptions={{
                    rehypePlugins: [],
                  }}
                  textareaProps={{
                    style: {
                      background: palette.cardHover,
                      color: palette.text,
                      borderColor: palette.border,
                    }
                  }}
                />
              </div>
              <Input
                placeholder="Tags (comma separated)..."
                value={newQuestion.tags}
                onChange={e => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                style={{ background: palette.cardHover, color: palette.text, borderColor: palette.border }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  style={{ borderColor: palette.border, color: palette.text }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuestion}
                  disabled={!newQuestion.title.trim() || !newQuestion.content.trim()}
                  style={{ background: palette.accentDeep, color: palette.card }}
                  onMouseEnter={e => e.currentTarget.style.background = palette.accent}
                  onMouseLeave={e => e.currentTarget.style.background = palette.accentDeep}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Forum;

