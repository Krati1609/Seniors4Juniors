import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Shield, X, Plus, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const SUGGESTED_TAGS = [
  'placements', 'dsa', 'internships', 'branch choice',
  'system design', 'resumes', 'google', 'microsoft', 'quant', 'cgpa'
];

export default function AskQuestionPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState(['placements']);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (!content.trim() || content.length < 10) {
      setError('Content description must be at least 10 characters long.');
      return;
    }
    if (tags.length === 0) {
      setError('Please add at least one relevant tag.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/questions', {
        title: title.trim(),
        content: content.trim(),
        tags,
        is_anonymous: isAnonymous,
      });
      navigate(`/questions/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-marine dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="card-theme border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Ask Seniors of Your College
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Questions will be scoped to <strong>{user?.college_name || 'your college'}</strong> and visible to all placed and experienced seniors.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-crimson text-sm border border-red-200 dark:border-red-800/40 flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Title */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Question Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to prepare for 3rd semester on-campus internship coding assessments?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-marine"
              maxLength={250}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Be specific and clear so seniors can offer focused advice.
            </p>
          </div>

          {/* Question Body */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Detailed Description *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Share your current branch, year, tech stack, what you've tried so far, or what specific guidance you are seeking..."
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-marine leading-relaxed"
            />
          </div>

          {/* Tags Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Tags (Up to 8) *
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-marine/10 text-marine dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-crimson"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Type tag and press enter (e.g. dsa, internships)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-marine"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Add
              </button>
            </div>

            {/* Popular tags quick click */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Suggestions:</span>
              {SUGGESTED_TAGS.map((stag) => (
                <button
                  type="button"
                  key={stag}
                  onClick={() => handleAddTag(stag)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-marine"
                >
                  +{stag}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymity Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Post Anonymously</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your name and profile will be hidden from everyone (shown as "Anonymous Junior").
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 rounded text-marine focus:ring-marine cursor-pointer accent-marine"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-2.5 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Submitting Question...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
