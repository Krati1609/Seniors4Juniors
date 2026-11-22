import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Bookmark, Flag,
  Award, Send, Eye, Calendar, Sparkles, Check
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import BestAnswerBadge from '../components/BestAnswerBadge';
import ReportModal from '../components/ReportModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isSenior } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Senior answer input
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Comment input per answer
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Report Modal
  const [reportModalData, setReportModalData] = useState({
    isOpen: false,
    targetType: 'question',
    targetId: '',
    targetTitle: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        api.get(`/questions/${id}`),
        api.get(`/questions/${id}/answers`),
      ]);
      setQuestion(qRes.data);
      setAnswers(aRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load question details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleVote = async (answerId, targetVote) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const currentAnswer = answers.find((a) => a.id === answerId);
      const newVoteValue = currentAnswer?.user_vote === targetVote ? 0 : targetVote;

      const res = await api.post(`/answers/${answerId}/vote`, { value: newVoteValue });
      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? {
                ...a,
                net_votes: res.data.net_votes,
                user_vote: res.data.user_vote,
                upvotes: res.data.upvotes,
                downvotes: res.data.downvotes,
              }
            : a
        )
      );
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleMarkBest = async (answerId) => {
    try {
      await api.post(`/answers/${answerId}/best`);
      setQuestion((prev) => ({ ...prev, best_answer_id: answerId }));
      setAnswers((prev) =>
        prev.map((a) => ({
          ...a,
          is_best_answer: a.id === answerId,
        }))
      );
    } catch (err) {
      console.error('Best answer failed:', err);
    }
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() || newAnswer.length < 10) return;

    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/questions/${id}/answers`, { content: newAnswer });
      setAnswers((prev) => [...prev, res.data]);
      setNewAnswer('');
      setQuestion((prev) => ({ ...prev, answers_count: (prev?.answers_count || 0) + 1 }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handlePostComment = async (answerId, e) => {
    e.preventDefault();
    const commentText = commentInputs[answerId];
    if (!commentText || !commentText.trim()) return;

    setSubmittingComment((prev) => ({ ...prev, [answerId]: true }));
    try {
      const res = await api.post(`/answers/${answerId}/comments`, { content: commentText.trim() });
      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? {
                ...a,
                comments: [...(a.comments || []), res.data],
                comments_count: (a.comments_count || 0) + 1,
              }
            : a
        )
      );
      setCommentInputs((prev) => ({ ...prev, [answerId]: '' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add follow-up comment.');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/questions/${id}/bookmark`);
      setQuestion((prev) => ({ ...prev, is_bookmarked: res.data.bookmarked }));
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <LoadingSpinner size="lg" label="Loading discussion..." />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 card-theme border rounded-2xl text-center shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Question Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This question does not exist or was removed.'}</p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-marine text-white font-semibold text-sm">
          Return to Feed
        </Link>
      </div>
    );
  }

  const isAuthor = user && user.id === question.asker_id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-marine dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>

      {/* Question Card */}
      <article className="card-theme border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        {/* Author row */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-marine text-white flex items-center justify-center font-bold text-xs">
              {question.is_anonymous ? '?' : question.asker_name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {question.asker_name}
              </p>
              <p className="text-[11px] text-slate-500">
                {question.asker_branch || 'College Student'} • {question.college_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                question.is_bookmarked ? 'text-marine fill-marine bg-marine/10' : 'text-slate-400'
              }`}
              title="Bookmark Question"
            >
              <Bookmark size={18} />
            </button>
            <button
              onClick={() =>
                setReportModalData({
                  isOpen: true,
                  targetType: 'question',
                  targetId: question.id,
                  targetTitle: question.title,
                })
              }
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-crimson transition-colors"
              title="Report question"
            >
              <Flag size={18} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {question.title}
        </h1>

        {/* Full Content */}
        <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {question.content}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {question.tags?.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-semibold text-marine dark:text-blue-400">
            <MessageSquare size={16} /> {question.answers_count} Answers
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={16} /> {question.views_count} views
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={16} /> Asked on {new Date(question.created_at).toLocaleDateString()}
          </span>
        </div>
      </article>

      {/* Answer Submission Box (For Seniors) */}
      {isSenior ? (
        <div className="card-theme border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-butter-dark dark:text-amber-400" />
              <span>Share Your Answer as a Senior</span>
            </h3>
            {user.is_verified && <VerifiedBadge size="sm" />}
          </div>

          <form onSubmit={handlePostAnswer} className="space-y-4">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={6}
              placeholder="Provide a comprehensive answer, coding tips, interview roadmap, or practical guidance..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-marine leading-relaxed"
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400">
                Minimum 10 characters. Markdown format supported.
              </p>
              <button
                type="submit"
                disabled={submittingAnswer || newAnswer.length < 10}
                className="px-6 py-2.5 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} /> {submittingAnswer ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span>
            💡 Answers are exclusively contributed by verified seniors to ensure authentic, high-quality college advice.
          </span>
          {!isAuthenticated && (
            <Link to="/login" className="text-marine dark:text-blue-400 font-bold hover:underline shrink-0 ml-4">
              Log in to ask or comment
            </Link>
          )}
        </div>
      )}

      {/* Answers Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</span>
        </h3>

        {answers.length === 0 ? (
          <div className="card-theme border rounded-3xl p-10 text-center text-slate-400 text-sm">
            No answers posted yet. Placed seniors from your college will answer this question soon!
          </div>
        ) : (
          answers.map((ans) => (
            <div
              key={ans.id}
              className={`card-theme border rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 transition-all ${
                ans.is_best_answer ? 'ring-2 ring-amber-400/80 bg-amber-50/20 dark:bg-amber-950/10' : ''
              }`}
            >
              {/* Senior Author Meta */}
              <div className="flex items-start justify-between">
                <Link to={`/profile/${ans.senior_id}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-marine text-white flex items-center justify-center font-bold text-sm border-2 border-butter">
                    {ans.senior_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white hover:text-marine">
                        {ans.senior_name}
                      </span>
                      {ans.senior_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-xs text-slate-500">
                      {ans.senior_branch} • Year {ans.senior_year} Senior
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  {ans.is_best_answer && <BestAnswerBadge />}

                  {/* Asker can mark Best Answer */}
                  {isAuthor && !ans.is_best_answer && (
                    <button
                      onClick={() => handleMarkBest(ans.id)}
                      className="px-3 py-1 rounded-lg border border-amber-300 bg-butter-light text-amber-900 text-xs font-semibold hover:bg-amber-200 transition-colors flex items-center gap-1.5"
                      title="Mark this as the Best Answer"
                    >
                      <Award size={14} />
                      <span>Mark Best</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setReportModalData({
                        isOpen: true,
                        targetType: 'answer',
                        targetId: ans.id,
                        targetTitle: ans.content.slice(0, 50),
                      })
                    }
                    className="p-1.5 rounded text-slate-400 hover:text-crimson transition-colors"
                    title="Report answer"
                  >
                    <Flag size={15} />
                  </button>
                </div>
              </div>

              {/* Answer Content */}
              <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line pl-1">
                {ans.content}
              </div>

              {/* Voting Bar & Follow-ups */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Upvote / Downvote Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1">
                  <button
                    onClick={() => handleVote(ans.id, 1)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      ans.user_vote === 1
                        ? 'bg-marine text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-marine'
                    }`}
                    title="Upvote helpful answer"
                  >
                    <ThumbsUp size={15} />
                    <span>{ans.net_votes || 0}</span>
                  </button>

                  <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700" />

                  <button
                    onClick={() => handleVote(ans.id, -1)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      ans.user_vote === -1
                        ? 'bg-crimson text-white shadow-xs'
                        : 'text-slate-400 hover:text-crimson'
                    }`}
                    title="Downvote"
                  >
                    <ThumbsDown size={15} />
                  </button>
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(ans.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Comments / Follow-ups thread */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Follow-up Discussions ({ans.comments?.length || 0})
                </p>

                {ans.comments?.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.author_name} ({c.author_role})
                      </span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}

                {/* Add Follow-up Input */}
                {isAuthenticated && (
                  <form
                    onSubmit={(e) => handlePostComment(ans.id, e)}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={commentInputs[ans.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [ans.id]: e.target.value })
                      }
                      placeholder="Ask a clarifying follow-up or say thanks..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-marine"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment[ans.id] || !commentInputs[ans.id]?.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-marine hover:text-white text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Global Report Modal */}
      <ReportModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({ ...reportModalData, isOpen: false })}
        targetType={reportModalData.targetType}
        targetId={reportModalData.targetId}
        targetTitle={reportModalData.targetTitle}
      />
    </div>
  );
}
