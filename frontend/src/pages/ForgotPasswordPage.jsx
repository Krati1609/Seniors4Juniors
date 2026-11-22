import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(res.data?.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-theme border rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-marine"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-marine/10 text-marine rounded-2xl flex items-center justify-center mx-auto">
            <KeyRound size={26} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your college or registered email address. We'll send you a password recovery link.
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs border border-green-200 dark:border-green-800 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{message} (In local dev mode, the link is logged directly to the backend terminal console!)</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-crimson text-xs border border-red-200 dark:border-red-900/50 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Registered Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ananya.gupta@iitb.ac.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            {submitting ? 'Dispatching link...' : 'Send Password Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
