import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import api from '../api/client';

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }) {
  const [reason, setReason] = useState('Inappropriate Content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/reports', {
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cobalt-dark/80 p-4">
      <div className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl w-full max-w-md p-6 sm:p-8 shadow-[8px_8px_0px_#C8102E] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-cobalt dark:text-butter hover:bg-crimson hover:text-butter transition-colors"
          aria-label="Close report modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-butter border-2 border-cobalt dark:border-butter text-cobalt dark:text-butter rounded-xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#1B2E85] dark:shadow-[3px_3px_0px_#FBF0A8]">
              <Check size={24} strokeWidth={3} />
            </div>
            <h3 className="font-serif font-black text-xl text-cobalt dark:text-butter">Report Logged</h3>
            <p className="text-xs font-sans text-cobalt/80 dark:text-butter/80 leading-relaxed max-w-xs mx-auto">
              Thank you for keeping our college platform honest. Campus administrators will inspect this entry.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 text-crimson pb-2 border-b-2 border-cobalt/15 dark:border-butter/15">
              <AlertTriangle size={24} strokeWidth={2.5} />
              <h3 className="font-serif font-black text-xl text-cobalt dark:text-butter">Report Content</h3>
            </div>

            {targetTitle && (
              <p className="text-xs font-sans text-cobalt/85 dark:text-butter/85 bg-butter dark:bg-cobalt p-3 rounded-lg border-2 border-cobalt/20 dark:border-butter/30 line-clamp-2">
                Target: <span className="font-bold underline">{targetTitle}</span>
              </p>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-crimson text-butter text-xs font-sans font-bold border-2 border-cobalt">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter mb-1.5">
                  Reason for flag
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-cobalt dark:border-butter bg-[#FFFDE8] dark:bg-cobalt text-xs font-sans font-semibold text-cobalt dark:text-butter focus:outline-none focus:ring-2 focus:ring-crimson"
                >
                  <option value="Inappropriate Content">Inappropriate Content / Harassment</option>
                  <option value="Spam or Promotional">Spam or Promotional Noise</option>
                  <option value="Misinformation">Misleading Placement / Academic Claims</option>
                  <option value="Plagiarism">Plagiarism / Stolen Content</option>
                  <option value="Hate Speech">Hate Speech or Abusive Language</option>
                  <option value="Other">Other Community Honor Code Breach</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter mb-1.5">
                  Context for Administration (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Explain why this violates campus standards..."
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-cobalt dark:border-butter bg-[#FFFDE8] dark:bg-cobalt text-xs font-sans text-cobalt dark:text-butter focus:outline-none focus:ring-2 focus:ring-crimson placeholder:text-cobalt/40 dark:placeholder:text-butter/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-cobalt/15 dark:border-butter/15">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:bg-butter dark:hover:bg-cobalt rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-butter bg-crimson border-2 border-cobalt dark:border-butter rounded-xl shadow-[3px_3px_0px_#1B2E85] dark:shadow-[3px_3px_0px_#FBF0A8] btn-press disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'File Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
