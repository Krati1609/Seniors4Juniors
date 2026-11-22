import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function JuniorSignupPage() {
  const { registerJunior } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    college_name: 'Indian Institute of Technology, Bombay',
    email: '',
    password: '',
    roll_number: '',
    enrollment_number: '',
    branch: 'Computer Science & Engineering',
    college_year: 1,
    current_semester: 1,
    interests: 'Competitive Programming, Web Development',
    career_goals: 'Cracking top-tier software engineering internship and building impactful projects.',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long and contain letters and numbers.');
      return;
    }

    setSubmitting(true);
    try {
      const interestsArray = formData.interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await registerJunior({
        ...formData,
        college_year: parseInt(formData.college_year, 10),
        current_semester: parseInt(formData.current_semester, 10),
        interests: interestsArray,
      });

      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl card-theme border rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-marine text-butter rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Join as a Junior Student
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ask questions, join communities, vote on answers, and book mock interviews with seniors of your college.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-crimson text-sm border border-red-200 dark:border-red-900/50 flex items-center gap-2">
            <AlertCircle size={17} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm border border-green-200 dark:border-green-800 flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>Account created successfully! Redirecting to campus feed...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ananya Gupta"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (College Preferred) *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ananya.gupta@iitb.ac.in"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              College Name *
            </label>
            <input
              type="text"
              name="college_name"
              required
              value={formData.college_name}
              onChange={handleChange}
              placeholder="Indian Institute of Technology, Bombay"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                name="roll_number"
                required
                value={formData.roll_number}
                onChange={handleChange}
                placeholder="240050089"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Enrollment Number *
              </label>
              <input
                type="text"
                name="enrollment_number"
                required
                value={formData.enrollment_number}
                onChange={handleChange}
                placeholder="ENR-24-CSE-089"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Branch *
              </label>
              <input
                type="text"
                name="branch"
                required
                value={formData.branch}
                onChange={handleChange}
                placeholder="Computer Science"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                College Year *
              </label>
              <select
                name="college_year"
                value={formData.college_year}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Semester *
              </label>
              <select
                name="current_semester"
                value={formData.current_semester}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
                <option value={3}>Semester 3</option>
                <option value={4}>Semester 4</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password (Min. 8 chars, letters & numbers) *
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Interests (comma separated)
            </label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="DSA, Machine Learning, Web3, Hackathons"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Career Goals / Aspirations
            </label>
            <textarea
              name="career_goals"
              rows={2}
              value={formData.career_goals}
              onChange={handleChange}
              placeholder="What are your goals for college placements or higher education?"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? 'Creating Junior Account...' : 'Complete Junior Registration'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>
            Are you in 3rd or 4th year?{' '}
            <Link to="/signup/senior" className="text-marine font-bold hover:underline">
              Register as a Senior Mentor instead
            </Link>
          </p>
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-marine font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
