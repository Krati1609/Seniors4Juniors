import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Award, Star, ThumbsUp, MessageSquare, Users, Edit3,
  Calendar, Check, UserPlus, UserCheck, Briefcase, GraduationCap,
  Sparkles, ShieldCheck, Mail
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state for seniors
  const [activeTab, setActiveTab] = useState('overview');
  const [seniorSlots, setSeniorSlots] = useState([]);
  const [seniorInterviews, setSeniorInterviews] = useState([]);

  // Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const isOwnProfile = currentUser && currentUser.id === id;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data);
      setEditForm({
        full_name: res.data.full_name || '',
        branch: res.data.branch || '',
        current_semester: res.data.current_semester || 1,
        bio: res.data.bio || '',
        interests: res.data.interests?.join(', ') || '',
        career_goals: res.data.career_goals || '',
        areas_of_expertise: res.data.areas_of_expertise?.join(', ') || '',
        placement_history: res.data.placement_history || '',
        mentorship_available: res.data.mentorship_available || false,
      });

      // If senior, fetch their slots and interview experiences
      if (res.data.role === 'senior') {
        const [slotsRes, expRes] = await Promise.all([
          api.get('/mentorship/slots'),
          api.get(`/interview-experiences?senior_id=${id}`),
        ]);
        setSeniorSlots((slotsRes.data || []).filter((s) => s.senior_id === id));
        setSeniorInterviews((expRes.data || []).filter((e) => e.senior_id === id));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const toggleFollow = async () => {
    if (!currentUser) return;
    try {
      const res = await api.post(`/users/${id}/follow`);
      setProfile((prev) => ({
        ...prev,
        is_following: res.data.following,
        followers_count: (prev?.followers_count || 0) + (res.data.following ? 1 : -1),
      }));
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload = {
        full_name: editForm.full_name,
        branch: editForm.branch,
        current_semester: parseInt(editForm.current_semester, 10),
        bio: editForm.bio,
      };

      if (profile.role === 'junior') {
        payload.interests = editForm.interests.split(',').map((s) => s.trim()).filter(Boolean);
        payload.career_goals = editForm.career_goals;
      } else if (profile.role === 'senior') {
        payload.areas_of_expertise = editForm.areas_of_expertise.split(',').map((s) => s.trim()).filter(Boolean);
        payload.placement_history = editForm.placement_history;
        payload.mentorship_available = editForm.mentorship_available;
      }

      await api.put('/users/profile/me', payload);
      updateUser(payload);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <LoadingSpinner size="lg" label="Loading student profile..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 card-theme border rounded-3xl text-center shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profile Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-marine text-white font-semibold text-sm">
          Return to Feed
        </Link>
      </div>
    );
  }

  const isSenior = profile.role === 'senior';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="card-theme border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-marine text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center border-4 border-butter shadow-md">
              {profile.full_name?.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {profile.full_name}
                </h1>
                {isSenior && profile.is_verified && <VerifiedBadge />}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {profile.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                {profile.branch} • Year {profile.college_year} (Sem {profile.current_semester})
              </p>
              <p className="text-xs text-marine dark:text-blue-400 font-semibold flex items-center gap-1.5">
                🏫 {profile.college_name}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <Edit3 size={15} /> Edit Profile
              </button>
            ) : isSenior ? (
              <button
                onClick={toggleFollow}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors ${
                  profile.is_following
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    : 'bg-marine text-white hover:bg-marine-light'
                }`}
              >
                {profile.is_following ? (
                  <>
                    <UserCheck size={16} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Follow Senior
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Bio if provided */}
        {profile.bio && (
          <p className="mt-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
            {profile.bio}
          </p>
        )}

        {/* Senior Stats Grid */}
        {isSenior && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                <MessageSquare size={16} className="text-marine" /> {profile.answers_count || 0}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Answers</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                <ThumbsUp size={16} className="text-marine" /> {profile.net_upvotes || 0}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Upvotes</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-lg font-black text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                <Star size={16} className="fill-amber-400 text-amber-400" /> {profile.average_rating || 0.0}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Rating ({profile.ratings_count || 0})
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                <Users size={16} className="text-marine" /> {profile.followers_count || 0}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Followers</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs for Seniors */}
      {isSenior ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-marine text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Expertise & Placements
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'slots'
                  ? 'bg-marine text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Mentorship Availability ({seniorSlots.length})
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'interviews'
                  ? 'bg-marine text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Interview Experiences ({seniorInterviews.length})
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Areas of Expertise */}
              <div className="card-theme border rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Areas of Expertise</span>
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.areas_of_expertise?.length > 0 ? (
                    profile.areas_of_expertise.map((exp) => (
                      <span
                        key={exp}
                        className="px-3 py-1 rounded-lg bg-butter-light text-amber-900 dark:text-amber-200 text-xs font-semibold"
                      >
                        {exp}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No expertise areas listed yet.</p>
                  )}
                </div>
              </div>

              {/* Placement History */}
              <div className="card-theme border rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-marine" />
                  <span>Placement History & Offers</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {profile.placement_history || 'No placement details shared yet.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'slots' && (
            <div className="space-y-4">
              {seniorSlots.length === 0 ? (
                <div className="card-theme border rounded-2xl p-8 text-center text-slate-400 text-sm">
                  This senior has not posted active availability slots at the moment.
                </div>
              ) : (
                seniorSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="card-theme border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-marine/10 text-marine mb-2 inline-block">
                        {slot.session_type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{slot.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{slot.description}</p>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-2">
                        📅 {slot.day_of_week} • {slot.time_slot}
                      </p>
                    </div>

                    {!isOwnProfile && (
                      <Link
                        to="/mentorship"
                        className="px-4 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light shrink-0 text-center"
                      >
                        Request Session
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-4">
              {seniorInterviews.length === 0 ? (
                <div className="card-theme border rounded-2xl p-8 text-center text-slate-400 text-sm">
                  No interview experiences posted yet.
                </div>
              ) : (
                seniorInterviews.map((exp) => (
                  <div key={exp.id} className="card-theme border rounded-2xl p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {exp.company} — {exp.role} ({exp.year})
                      </h4>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                        {exp.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {exp.overall_experience}
                    </p>
                    <Link
                      to="/interview-experiences"
                      className="text-xs font-semibold text-marine dark:text-blue-400 hover:underline inline-block pt-1"
                    >
                      Read full {exp.number_of_rounds}-round breakdown →
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* Junior Profile Details */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-theme border rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-marine" />
              <span>Interests & Tech Stack</span>
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.interests?.length > 0 ? (
                profile.interests.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No interests added yet.</p>
              )}
            </div>
          </div>

          <div className="card-theme border rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-marine" />
              <span>Career Goals</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.career_goals || 'No career goals specified yet.'}
            </p>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Share a short bio with your college peers..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              {profile.role === 'junior' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Interests (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editForm.interests}
                      onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Career Goals
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.career_goals}
                      onChange={(e) => setEditForm({ ...editForm, career_goals: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                    />
                  </div>
                </>
              )}

              {profile.role === 'senior' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Areas of Expertise (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editForm.areas_of_expertise}
                      onChange={(e) =>
                        setEditForm({ ...editForm, areas_of_expertise: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Placement History
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.placement_history}
                      onChange={(e) =>
                        setEditForm({ ...editForm, placement_history: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_mentorship_avail"
                      checked={editForm.mentorship_available}
                      onChange={(e) =>
                        setEditForm({ ...editForm, mentorship_available: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-marine focus:ring-marine cursor-pointer accent-marine"
                    />
                    <label htmlFor="edit_mentorship_avail" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Open to offering mentorship & mock interviews
                    </label>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
