import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SeniorSignupPage() {
  const { registerSenior } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    college_name: 'Indian Institute of Technology, Bombay',
    email: '',
    password: '',
    roll_number: '',
    enrollment_number: '',
    branch: 'Computer Science & Engineering',
    college_year: 4,
    current_semester: 7,
    areas_of_expertise: 'DSA, System Design, Google Interview Prep',
    placement_history: 'Placed at Google as Software Engineer (SWE L3)',
    mentorship_available: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      const expertiseArray = formData.areas_of_expertise
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await registerSenior({
        ...formData,
        college_year: parseInt(formData.college_year, 10),
        current_semester: parseInt(formData.current_semester, 10),
        areas_of_expertise: expertiseArray,
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
          <div className="w-12 h-12 bg-butter text-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-md border border-amber-300">
            <Award size={28} className="text-amber-700" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Register as a Senior Mentor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Answer juniors' questions, post interview experiences, and mentor students from your college.
          </p>
        </div>

        {/* Verification Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Verified Senior Badge:</span> Seniors must provide their authentic college details. Your profile and answers will show an official "Verified" badge after email verification or admin approval.
          </div>
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
            <span>Senior account created! Verification submitted. Redirecting...</span>
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
                placeholder="Aarav Sharma"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                College Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="aarav.sharma@iitb.ac.in"
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
                placeholder="210050012"
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
                placeholder="ENR-21-CSE-012"
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
                <option value={3}>3rd Year (Junior/Senior)</option>
                <option value={4}>4th Year (Senior/Final Year)</option>
                <option value={5}>5th Year (Dual Degree)</option>
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
                <option value={5}>Semester 5</option>
                <option value={6}>Semester 6</option>
                <option value={7}>Semester 7</option>
                <option value={8}>Semester 8</option>
                <option value={9}>Semester 9</option>
                <option value={10}>Semester 10</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Areas of Expertise (comma separated) *
            </label>
            <input
              type="text"
              name="areas_of_expertise"
              required
              value={formData.areas_of_expertise}
              onChange={handleChange}
              placeholder="e.g. DSA, System Design, Quant, Core Electrical"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Placement History / Current Company
            </label>
            <textarea
              name="placement_history"
              rows={2}
              value={formData.placement_history}
              onChange={handleChange}
              placeholder="e.g. Placed at Google (SWE), Microsoft Summer Intern, or Goldman Sachs Analyst"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
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

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="mentorship_available"
              name="mentorship_available"
              checked={formData.mentorship_available}
              onChange={handleChange}
              className="w-4 h-4 rounded text-marine focus:ring-marine cursor-pointer accent-marine"
            />
            <label htmlFor="mentorship_available" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              I am open to offering 1-on-1 mentorship sessions and mock interviews to juniors.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-butter text-slate-900 border border-amber-300 font-bold text-sm hover:bg-amber-300 shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? 'Registering Senior Mentor...' : 'Complete Senior Registration'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>
            Are you a 1st or 2nd year student?{' '}
            <Link to="/signup/junior" className="text-marine font-bold hover:underline">
              Register as a Junior instead
            </Link>
          </p>
          <p>
            Already registered?{' '}
            <Link to="/login" className="text-marine font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
