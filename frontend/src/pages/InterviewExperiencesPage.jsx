import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Search, Filter, ChevronDown, ChevronUp,
  Building, Calendar, Award, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function InterviewExperiencesPage() {
  const { user, isAuthenticated, isSenior } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Share Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    company: 'Google',
    role: 'Software Engineer (SWE)',
    year: 2026,
    difficulty: 'Hard',
    outcome: 'Selected',
    overall_experience: '',
    rounds: [
      {
        round_number: 1,
        round_name: 'Online Assessment (OA)',
        question_types: ['DSA', 'Graphs'],
        questions_asked: '',
        tips: '',
      },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const params = {};
      if (companyFilter.trim()) params.company = companyFilter.trim();
      if (roleFilter.trim()) params.role = roleFilter.trim();
      if (difficultyFilter) params.difficulty = difficultyFilter;

      const res = await api.get('/interview-experiences', { params });
      setExperiences(res.data || []);
      if (res.data?.length > 0 && !expandedId) {
        setExpandedId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load interview experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [difficultyFilter]);

  const handleAddRound = () => {
    const nextNum = formData.rounds.length + 1;
    setFormData({
      ...formData,
      rounds: [
        ...formData.rounds,
        {
          round_number: nextNum,
          round_name: `Technical Round ${nextNum - 1}`,
          question_types: ['DSA'],
          questions_asked: '',
          tips: '',
        },
      ],
    });
  };

  const handleRoundChange = (index, field, value) => {
    const updated = [...formData.rounds];
    if (field === 'question_types') {
      updated[index][field] = value.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      updated[index][field] = value;
    }
    setFormData({ ...formData, rounds: updated });
  };

  const handleCreateExperience = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        number_of_rounds: formData.rounds.length,
        year: parseInt(formData.year, 10),
      };
      const res = await api.post('/interview-experiences', payload);
      setExperiences([res.data, ...experiences]);
      setShowModal(false);
      setExpandedId(res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit interview experience.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="text-marine dark:text-blue-400" />
            <span>Campus Interview Experiences</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Detailed, round-wise question breakdowns from seniors placed in top tech & finance firms.
          </p>
        </div>

        {isSenior && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-butter text-slate-900 border border-amber-300 font-bold text-sm hover:bg-amber-300 shadow-md transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> Share Your Experience
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card-theme border rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExperiences()}
            placeholder="Search company (e.g. Google)..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-marine"
          />
        </div>

        <div>
          <input
            type="text"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExperiences()}
            placeholder="Search role (e.g. Software Engineer)..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-marine"
          />
        </div>

        <div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-marine"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Very Hard">Very Hard</option>
          </select>
        </div>
      </div>

      {/* Experiences List */}
      {loading ? (
        <LoadingSpinner size="lg" label="Loading interview experiences..." />
      ) : experiences.length === 0 ? (
        <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
          No interview experiences found matching your filters.
        </div>
      ) : (
        <div className="space-y-6">
          {experiences.map((exp) => {
            const isExpanded = expandedId === exp.id;
            return (
              <div
                key={exp.id}
                className="card-theme border rounded-3xl shadow-xs overflow-hidden transition-all"
              >
                {/* Header summary button */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="p-6 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building size={18} className="text-marine" /> {exp.company}
                      </span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        • {exp.role}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Batch {exp.year}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Shared by <span className="font-semibold text-slate-700 dark:text-slate-300">{exp.senior_name}</span> ({exp.senior_branch}) • {exp.number_of_rounds} Rounds
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        exp.outcome === 'Selected' || exp.outcome === 'Offered'
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {exp.outcome}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      Difficulty: {exp.difficulty}
                    </span>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    {/* Overall Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
                        Overall Strategy & Experience
                      </p>
                      {exp.overall_experience}
                    </div>

                    {/* Round-by-round Accordion */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Round-by-Round Breakdown
                      </h4>

                      {exp.rounds?.map((r) => (
                        <div
                          key={r.round_number}
                          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-sm text-marine dark:text-blue-400">
                              Round {r.round_number}: {r.round_name}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {r.question_types?.map((qtype) => (
                                <span
                                  key={qtype}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-marine/10 text-marine dark:bg-blue-950/40 dark:text-blue-300"
                                >
                                  {qtype}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Questions Asked
                            </p>
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                              {r.questions_asked}
                            </p>
                          </div>

                          {r.tips && (
                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                              <Sparkles size={15} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Senior's Pro-Tip:</span> {r.tips}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal for Seniors */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Share Your Interview Experience
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-crimson text-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateExperience} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Google, Microsoft, Uber"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Software Engineer (L3)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hiring Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Very Hard">Very Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Outcome *
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  >
                    <option value="Selected">Selected</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Waitlisted">Waitlisted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Overall Experience Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.overall_experience}
                  onChange={(e) => setFormData({ ...formData, overall_experience: e.target.value })}
                  placeholder="Summarize the overall process, preparation timeline, and key takeaways..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              {/* Rounds */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Interview Rounds ({formData.rounds.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddRound}
                    className="text-xs font-bold text-marine dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    + Add Another Round
                  </button>
                </div>

                {formData.rounds.map((round, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Round {idx + 1} Name
                        </label>
                        <input
                          type="text"
                          required
                          value={round.round_name}
                          onChange={(e) => handleRoundChange(idx, 'round_name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Question Types (comma separated)
                        </label>
                        <input
                          type="text"
                          required
                          value={round.question_types.join(', ')}
                          onChange={(e) => handleRoundChange(idx, 'question_types', e.target.value)}
                          placeholder="DSA, System Design, HR"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Questions Asked
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={round.questions_asked}
                        onChange={(e) => handleRoundChange(idx, 'questions_asked', e.target.value)}
                        placeholder="Detail the exact problem statements, constraints, or follow-ups asked..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs dark:bg-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Round Tips
                      </label>
                      <input
                        type="text"
                        value={round.tips}
                        onChange={(e) => handleRoundChange(idx, 'tips', e.target.value)}
                        placeholder="Key advice for cracking this specific round..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  {submitting ? 'Publishing...' : 'Publish Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
