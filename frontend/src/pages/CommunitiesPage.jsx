import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Lock, Globe, Search, MessageSquare, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CommunitiesPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: 'Coding & Tech',
    is_private: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const CATEGORIES = ['All', 'Coding & Tech', 'Placements', 'Higher Studies', 'Branch Clubs', 'General'];

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (activeCategory !== 'All') params.category = activeCategory;

      const res = await api.get('/communities', { params });
      setCommunities(res.data || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [activeCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const res = await api.post('/communities', createForm);
      setShowCreateModal(false);
      setCommunities([res.data, ...communities]);
      navigate(`/communities/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create community.');
    } finally {
      setCreating(false);
    }
  };

  const toggleJoin = async (communityId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/communities/${communityId}/join`);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                is_member: res.data.joined,
                members_count: c.members_count + (res.data.joined ? 1 : -1),
              }
            : c
        )
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update membership.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-marine dark:text-blue-400" />
            <span>College Communities & Circles</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join interest circles, technical clubs, and placement study groups within{' '}
            <strong>{user?.college_name || 'your college'}</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) navigate('/login');
            else setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-marine text-white font-bold text-sm hover:bg-marine-light shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus size={18} /> Create Community
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-theme border rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities by name or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-marine"
          />
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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

      {/* Community Grid */}
      {loading ? (
        <LoadingSpinner size="lg" label="Loading communities..." />
      ) : communities.length === 0 ? (
        <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Users size={40} className="mx-auto text-slate-300" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">No communities found</p>
          <p className="text-xs max-w-sm mx-auto">
            Be the first student to create a community for competitive coding, placement prep, or hobbies!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((c) => (
            <Link
              key={c.id}
              to={`/communities/${c.id}`}
              className="card-theme border rounded-3xl p-6 shadow-xs hover:border-marine/50 dark:hover:border-slate-600 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-marine/10 text-marine dark:bg-blue-950/40 dark:text-blue-300">
                    {c.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    {c.is_private ? <Lock size={12} /> : <Globe size={12} />}
                    {c.is_private ? 'Private' : 'Public'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-marine dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Users size={14} /> {c.members_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={14} /> {c.posts_count} posts
                  </span>
                </div>

                <button
                  onClick={(e) => toggleJoin(c.id, e)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    c.is_member
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-crimson'
                      : 'bg-marine text-white hover:bg-marine-light'
                  }`}
                >
                  {c.is_member ? 'Joined ✓' : 'Join'}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Create College Community
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-crimson text-xs border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Community Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Competitive Programming Club"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                >
                  <option value="Coding & Tech">Coding & Tech</option>
                  <option value="Placements">Placements</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Branch Clubs">Branch Clubs</option>
                  <option value="General">General Campus Life</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="What is the goal of this community? Who should join?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="create_is_private"
                  checked={createForm.is_private}
                  onChange={(e) => setCreateForm({ ...createForm, is_private: e.target.checked })}
                  className="w-4 h-4 rounded text-marine focus:ring-marine cursor-pointer accent-marine"
                />
                <label htmlFor="create_is_private" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Make this community private (only joined members can see posts)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  {creating ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
