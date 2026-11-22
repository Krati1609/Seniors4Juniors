import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Search, Star, MessageSquare, ThumbsUp,
  UserPlus, UserCheck, Calendar, Filter
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SeniorsDirectoryPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const fetchSeniors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (branchFilter) params.branch = branchFilter;
      if (expertiseFilter.trim()) params.expertise = expertiseFilter.trim();
      if (verifiedOnly) params.verified_only = true;

      const res = await api.get('/users/seniors', { params });
      setSeniors(res.data || []);
    } catch (err) {
      console.error('Failed to load seniors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeniors();
  }, [branchFilter, verifiedOnly]);

  const toggleFollow = async (seniorId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/users/${seniorId}/follow`);
      setSeniors((prev) =>
        prev.map((s) =>
          s.id === seniorId
            ? {
                ...s,
                is_following: res.data.following,
                followers_count: (s.followers_count || 0) + (res.data.following ? 1 : -1),
              }
            : s
        )
      );
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <GraduationCap className="text-marine dark:text-blue-400" />
          <span>Verified Seniors Directory</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore placed seniors and student mentors from{' '}
          <strong>{user?.college_name || 'your college'}</strong>. Connect, follow updates, and seek placement guidance.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-theme border rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            value={expertiseFilter}
            onChange={(e) => setExpertiseFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSeniors()}
            placeholder="Search expertise (e.g. DSA, Google, Quant)..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-marine"
          />
        </div>

        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-marine"
          >
            <option value="">All Branches</option>
            <option value="Computer Science & Engineering">CSE</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">ECE</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="verified_filter"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 rounded text-marine focus:ring-marine cursor-pointer accent-marine"
          />
          <label htmlFor="verified_filter" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            Verified Seniors Only
          </label>
        </div>
      </div>

      {/* Seniors Grid */}
      {loading ? (
        <LoadingSpinner size="lg" label="Loading seniors directory..." />
      ) : seniors.length === 0 ? (
        <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
          No seniors found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seniors.map((senior) => (
            <div
              key={senior.id}
              className="card-theme border rounded-3xl p-6 shadow-xs hover:border-marine/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-marine text-white font-extrabold text-base flex items-center justify-center border-2 border-butter shadow-sm">
                    {senior.full_name?.charAt(0)}
                  </div>
                  {senior.is_verified && <VerifiedBadge size="sm" />}
                </div>

                <div>
                  <Link to={`/profile/${senior.id}`} className="hover:underline">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {senior.full_name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 font-medium">
                    {senior.branch} • Year {senior.college_year}
                  </p>
                </div>

                {senior.placement_history && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    💼 {senior.placement_history}
                  </p>
                )}

                {/* Expertise */}
                <div className="flex flex-wrap gap-1.5">
                  {senior.areas_of_expertise?.slice(0, 3).map((exp) => (
                    <span
                      key={exp}
                      className="px-2 py-0.5 rounded bg-butter-light text-amber-900 text-[10px] font-semibold"
                    >
                      {exp}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star size={13} className="fill-amber-400" /> {senior.average_rating || 5.0}
                  </span>
                  <span>{senior.answers_count} Answers</span>
                  <span>{senior.net_upvotes} Upvotes</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => toggleFollow(senior.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    senior.is_following
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      : 'bg-marine text-white hover:bg-marine-light'
                  }`}
                >
                  {senior.is_following ? (
                    <>
                      <UserCheck size={14} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Follow
                    </>
                  )}
                </button>
                <Link
                  to={`/profile/${senior.id}`}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-center"
                >
                  Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
