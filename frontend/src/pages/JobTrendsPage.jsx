import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Search, Plus, ExternalLink, Calendar, DollarSign,
  Building, CheckCircle2, Trash2
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function JobTrendsPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    package_range: '',
    skills: 'DSA, System Design, Python',
    eligibility: 'B.Tech pre-final and final year. Minimum CGPA: 7.5',
    deadline: '2026-12-15',
    category: 'internship',
    application_link: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = ['All', 'internship', 'full-time', 'hackathon'];

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/job-trends', { params });
      setJobs(res.data || []);
    } catch (err) {
      console.error('Failed to load job trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeCategory]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const skillsArray = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.post('/job-trends', {
        ...formData,
        skills: skillsArray,
      });
      setJobs([res.data, ...jobs]);
      setShowModal(false);
      setFormData({
        company: '',
        role: '',
        package_range: '',
        skills: 'DSA, Python',
        eligibility: '',
        deadline: '2026-12-15',
        category: 'internship',
        application_link: '',
        description: '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post job opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to remove this job listing?')) return;
    try {
      await api.delete(`/job-trends/${jobId}`);
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete listing.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="text-crimson" />
            <span>Campus Job & Internship Trends</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time hiring drives, internships, and hackathons verified by seniors of{' '}
            <strong>{user?.college_name || 'your college'}</strong>.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light shadow-md transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> Post Opportunity
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="card-theme border rounded-2xl p-4 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs();
          }}
          className="relative"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, role, or skills (e.g. Google, System Design, Python)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-marine"
          />
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                activeCategory === cat
                  ? 'bg-marine text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <LoadingSpinner size="lg" label="Loading opportunities..." />
      ) : jobs.length === 0 ? (
        <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
          No job trends or internship drives found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card-theme border rounded-3xl p-6 shadow-xs hover:border-marine/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-marine/10 text-marine dark:bg-blue-950/40 dark:text-blue-300 tracking-wider">
                    {job.category}
                  </span>
                  <span className="text-[11px] font-semibold text-crimson flex items-center gap-1">
                    <Calendar size={13} /> Due: {job.deadline}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building size={18} className="text-slate-400 shrink-0" />
                    <span>{job.company}</span>
                  </h3>
                  <p className="text-xs font-bold text-marine dark:text-blue-400 mt-0.5">{job.role}</p>
                </div>

                {/* Package / Stipend */}
                <div className="p-2.5 rounded-xl bg-butter-light text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
                  <DollarSign size={15} className="text-amber-700" />
                  <span>{job.package_range}</span>
                </div>

                {/* Eligibility */}
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Eligibility
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {job.eligibility}
                  </p>
                </div>

                {/* Skills Required */}
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills?.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  By {job.posted_by_name}
                </span>

                <div className="flex items-center gap-2">
                  {(user?.id === job.posted_by || isAdmin) && (
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-crimson transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {job.application_link ? (
                    <a
                      href={job.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-xl bg-marine text-white font-bold hover:bg-marine-light flex items-center gap-1.5"
                    >
                      Apply Link <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Campus Portal</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Post Hiring Drive / Opportunity
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-crimson text-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Google, Microsoft"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. SWE Summer Intern"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Package / Stipend Range *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.package_range}
                    onChange={(e) => setFormData({ ...formData, package_range: e.target.value })}
                    placeholder="e.g. ₹1.25L / month or 42 LPA"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  >
                    <option value="internship">Internship</option>
                    <option value="full-time">Full-Time (FTE)</option>
                    <option value="hackathon">Hackathon / Challenge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Skills (comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="DSA, C++, System Design"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Application / Portal Link
                  </label>
                  <input
                    type="url"
                    value={formData.application_link}
                    onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                    placeholder="https://careers.google.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eligibility Criteria *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. B.Tech CSE/IT, CGPA >= 7.5, graduating batch of 2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  {submitting ? 'Posting...' : 'Post Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
