import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MessageSquare, Eye, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/questions/bookmarks');
      setBookmarks(res.data || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemove = async (questionId) => {
    try {
      await api.post(`/questions/${questionId}/bookmark`);
      setBookmarks(bookmarks.filter((b) => b.id !== questionId));
    } catch (err) {
      alert('Failed to remove bookmark.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-marine"
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Bookmark className="text-marine fill-marine" />
          <span>Saved Questions</span>
        </h1>
        <span className="text-xs text-slate-500 font-semibold">{bookmarks.length} saved</span>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading saved questions..." />
      ) : bookmarks.length === 0 ? (
        <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm space-y-3">
          <Bookmark size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No saved questions yet</p>
          <p className="text-xs">Click the bookmark icon on any question card in the feed to save it for later review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((q) => (
            <div
              key={q.id}
              className="card-theme border rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <Link
                  to={`/questions/${q.id}`}
                  className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-marine block truncate"
                >
                  {q.title}
                </Link>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{q.asker_name}</span>
                  <span>•</span>
                  <span>{q.answers_count} Answers</span>
                  <span>•</span>
                  <span>{q.views_count} views</span>
                </div>
              </div>

              <button
                onClick={() => handleRemove(q.id)}
                className="p-2 text-slate-400 hover:text-crimson transition-colors shrink-0"
                title="Remove from saved"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
