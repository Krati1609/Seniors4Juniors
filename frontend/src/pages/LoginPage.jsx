import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, AlertCircle, ArrowRight, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Target path redirect after login
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Bold Editorial Art Block */}
        <div className="md:col-span-5 bg-cobalt rounded-2xl border-2 border-cobalt-dark dark:border-butter p-8 text-butter shadow-hard-cobalt dark:shadow-hard-butter flex flex-col justify-between relative overflow-hidden">
          {/* Flat SVG Decorative Stamp */}
          <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none select-none">
            <svg width="220" height="220" viewBox="0 0 160 160" fill="none">
              <circle cx="80" cy="80" r="70" stroke="#FBF0A8" strokeWidth="6" strokeDasharray="10 6" />
              <rect x="40" y="40" width="80" height="80" fill="#C8102E" transform="rotate(45 80 80)" />
            </svg>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-butter text-cobalt flex items-center justify-center border-2 border-cobalt-dark shadow-[3px_3px_0px_#121F5C]">
              <GraduationCap size={28} strokeWidth={2.5} />
            </div>

            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-butter/80 block">
              Campus Single Sign-On
            </span>

            <h2 className="font-serif font-black text-3xl sm:text-4xl text-butter leading-[1.02]">
              Knowledge passed forward, not lost.
            </h2>

            <p className="text-xs font-sans text-butter/90 leading-relaxed pt-1">
              Join thousands of college juniors and seniors connecting over real placement tests, course reviews, and 1-on-1 mock interviews.
            </p>
          </div>

          <div className="pt-8 relative z-10 border-t-2 border-butter/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-sans font-bold text-butter">
              <ShieldCheck size={16} strokeWidth={2.5} className="text-crimson" />
              <span>Strictly College Scoped</span>
            </div>
            <p className="text-[11px] font-sans text-butter/75">
              Only verified students from your university can view your questions and answers.
            </p>
          </div>
        </div>

        {/* Right Side: Sign In Form Card */}
        <div className="md:col-span-7 bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-2xl p-6 sm:p-10 shadow-hard flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-crimson block mb-1">
                ★ Member Authentication
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-black text-cobalt dark:text-butter leading-tight">
                Sign In to S4J
              </h1>
              <p className="text-xs font-sans text-cobalt/80 dark:text-butter/80 mt-1">
                Enter your registered college email and password below.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-crimson text-butter text-xs font-sans font-bold border-2 border-cobalt flex items-start gap-2.5 shadow-[3px_3px_0px_#1B2E85]">
                <AlertCircle size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter mb-1.5">
                  College Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ananya.junior@iitb.ac.in"
                  className="w-full px-4 py-3 rounded-xl border-2 border-cobalt dark:border-butter bg-[#FBF0A8]/40 dark:bg-cobalt text-sm font-sans text-cobalt dark:text-butter placeholder:text-cobalt/50 dark:placeholder:text-butter/50 focus:outline-none focus:ring-2 focus:ring-crimson"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-sans font-bold uppercase tracking-wider text-crimson hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-cobalt dark:border-butter bg-[#FBF0A8]/40 dark:bg-cobalt text-sm font-sans text-cobalt dark:text-butter placeholder:text-cobalt/50 dark:placeholder:text-butter/50 focus:outline-none focus:ring-2 focus:ring-crimson"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-crimson text-butter font-sans font-bold uppercase text-xs tracking-wider border-2 border-cobalt dark:border-butter shadow-[4px_4px_0px_#1B2E85] dark:shadow-[4px_4px_0px_#FBF0A8] btn-press disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In to Campus'}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </form>

            {/* Quick Demo Logins for Instant Testing */}
            <div className="p-4 rounded-xl bg-butter dark:bg-cobalt border-2 border-cobalt dark:border-butter space-y-2.5">
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter text-center">
                Instant Demo Account Auto-Fill:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('ananya.junior@iitb.ac.in', 'JuniorPass123!')}
                  className="p-2.5 rounded-lg bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter font-bold text-cobalt dark:text-butter hover:bg-butter btn-press text-left shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8]"
                >
                  🎓 Junior Student
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('aarav.senior@iitb.ac.in', 'SeniorPass123!')}
                  className="p-2.5 rounded-lg bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter font-bold text-cobalt dark:text-butter hover:bg-butter btn-press text-left shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8]"
                >
                  ⭐ Verified Senior
                </button>
              </div>
            </div>
          </div>

          {/* Foot Links */}
          <div className="pt-6 mt-6 border-t-2 border-cobalt/15 dark:border-butter/15 text-center text-xs font-sans text-cobalt/80 dark:text-butter/80 space-y-2">
            <p>
              Don't have an account yet?{' '}
              <Link to="/signup/junior" className="text-crimson font-bold uppercase tracking-wider hover:underline">
                Junior Signup
              </Link>{' '}
              or{' '}
              <Link to="/signup/senior" className="text-cobalt dark:text-butter font-bold uppercase tracking-wider hover:underline">
                Senior Mentor
              </Link>
            </p>
            <p className="border-t border-cobalt/10 dark:border-butter/15 pt-2">
              Are you a platform administrator?{' '}
              <Link to="/admin/login" className="text-crimson font-bold uppercase tracking-wider hover:underline">
                Admin Portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
