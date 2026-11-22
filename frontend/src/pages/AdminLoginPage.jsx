import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await login(email.trim(), password);
      if (data.user?.role !== 'admin') {
        setError('This account does not have administrator privileges.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Admin authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillAdmin = (adminEmail, adminPass) => {
    setEmail(adminEmail);
    setPassword(adminPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-theme border-2 border-red-200 dark:border-red-900/50 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-crimson rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Admin Portal Access
          </h1>
          <p className="text-xs text-slate-500">
            Secure individual login for platform administrators, senior verifiers, and moderation leads.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-crimson text-sm border border-red-200 dark:border-red-900/50 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin1@seniors4juniors.edu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-crimson focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Administrator Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-crimson focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-crimson text-white font-bold text-sm hover:bg-crimson-hover shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? 'Verifying Admin Credentials...' : 'Authenticate to Admin Suite'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 3 Seeded Admins Quick-Fill Selection */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Individual Admin Accounts (Seeded):
          </p>
          <div className="space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillAdmin('admin1@seniors4juniors.edu', 'Admin1SecurePassword!')}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:border-crimson text-left flex items-center justify-between"
            >
              <span>1. Dean Dr. Alok Mathur</span>
              <span className="text-[10px] text-slate-400">Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillAdmin('admin2@seniors4juniors.edu', 'Admin2SecurePassword!')}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:border-crimson text-left flex items-center justify-between"
            >
              <span>2. Prof. Meera Sen</span>
              <span className="text-[10px] text-slate-400">Academic Lead</span>
            </button>
            <button
              type="button"
              onClick={() => fillAdmin('admin3@seniors4juniors.edu', 'Admin3SecurePassword!')}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold hover:border-crimson text-left flex items-center justify-between"
            >
              <span>3. Kavita Rao</span>
              <span className="text-[10px] text-slate-400">Placement Officer</span>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-slate-500">
          <Link to="/login" className="text-marine font-bold hover:underline">
            ← Return to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
}
