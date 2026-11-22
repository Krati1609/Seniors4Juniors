import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('No verification token provided.');
        setLoading(false);
        return;
      }
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.detail || 'Invalid or expired verification link.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-theme border rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-5">
        {loading ? (
          <LoadingSpinner size="lg" label="Verifying your college email..." />
        ) : success ? (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Verified!</h1>
            <p className="text-sm text-slate-500">
              Your college email address has been verified. You now have full access to Seniors4Juniors.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light"
            >
              Sign In Now <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-red-100 text-crimson rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Failed</h1>
            <p className="text-sm text-slate-500">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold text-sm"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
