import React, { useState, useEffect } from 'react';
import {
  Calendar, Star, Plus, CheckCircle2, Video, Clock, MessageSquare,
  Award, ShieldCheck, ExternalLink, Send, AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MentorshipPage() {
  const { user, isAuthenticated, isSenior, isJunior } = useAuth();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-sessions'
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionTypeFilter, setSessionTypeFilter] = useState('');

  // Request Session Modal (Junior)
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [requestForm, setRequestForm] = useState({
    date_requested: '',
    topic_notes: '',
    resume_link: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Create Slot Modal (Senior)
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    title: '1-on-1 Mock Coding Interview (DSA & Algorithms)',
    session_type: 'mock_interview',
    day_of_week: 'Saturday',
    time_slot: '6:00 PM - 7:00 PM IST',
    description: '45-min live coding problem over Google Meet + 15-min deep performance critique and optimization tips.',
  });
  const [submittingSlot, setSubmittingSlot] = useState(false);

  // Status update modal (Senior confirms with Meeting link)
  const [confirmSessionModal, setConfirmSessionModal] = useState(null);
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/xyz-mock-interview');

  // Senior Feedback Modal
  const [feedbackSessionModal, setFeedbackSessionModal] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    technical_score: 8,
    communication_score: 9,
    strengths: '',
    areas_for_improvement: '',
    recommended_resources: '',
  });

  // Junior Rating Modal
  const [reviewSessionModal, setReviewSessionModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (sessionTypeFilter) params.session_type = sessionTypeFilter;

      const [slotsRes, sessionsRes] = await Promise.all([
        api.get('/mentorship/slots', { params }),
        isAuthenticated ? api.get('/mentorship/sessions') : Promise.resolve({ data: [] }),
      ]);
      setSlots(slotsRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load mentorship data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionTypeFilter, isAuthenticated]);

  const handleRequestSession = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmittingRequest(true);
    try {
      await api.post('/mentorship/sessions/request', {
        slot_id: selectedSlot.id,
        date_requested: requestForm.date_requested,
        topic_notes: requestForm.topic_notes,
        resume_link: requestForm.resume_link,
      });
      setSelectedSlot(null);
      setRequestForm({ date_requested: '', topic_notes: '', resume_link: '' });
      setActiveTab('my-sessions');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request session.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSubmittingSlot(true);
    try {
      await api.post('/mentorship/slots', slotForm);
      setShowCreateSlotModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create slot.');
    } finally {
      setSubmittingSlot(false);
    }
  };

  const handleConfirmSession = async (e) => {
    e.preventDefault();
    if (!confirmSessionModal) return;

    try {
      await api.put(`/mentorship/sessions/${confirmSessionModal.id}/status`, {
        status: 'confirmed',
        meeting_link: meetingLink,
      });
      setConfirmSessionModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm session.');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackSessionModal) return;

    try {
      await api.post(`/mentorship/sessions/${feedbackSessionModal.id}/feedback`, {
        technical_score: parseInt(feedbackForm.technical_score, 10),
        communication_score: parseInt(feedbackForm.communication_score, 10),
        strengths: feedbackForm.strengths,
        areas_for_improvement: feedbackForm.areas_for_improvement,
        recommended_resources: feedbackForm.recommended_resources,
      });
      setFeedbackSessionModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit feedback.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewSessionModal) return;

    try {
      await api.post(`/mentorship/sessions/${reviewSessionModal.id}/review`, {
        rating: parseInt(reviewForm.rating, 10),
        review: reviewForm.review,
      });
      setReviewSessionModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit review.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="text-marine dark:text-blue-400" />
            <span>Mentorship & Mock Interviews</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Book 1-on-1 coding mock interviews, resume feedback, and career guidance with verified seniors of{' '}
            <strong>{user?.college_name || 'your college'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSenior && (
            <button
              onClick={() => setShowCreateSlotModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-butter text-slate-900 border border-amber-300 font-bold text-xs hover:bg-amber-300 shadow-md shrink-0"
            >
              <Plus size={16} /> Offer Availability
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'browse'
              ? 'bg-marine text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Available Senior Slots ({slots.length})
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('my-sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'my-sessions'
                ? 'bg-marine text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Sessions Dashboard ({sessions.length})
          </button>
        )}
      </div>

      {/* TAB 1: BROWSE SLOTS */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="card-theme border rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Session Type:</span>
              <button
                onClick={() => setSessionTypeFilter('')}
                className={`px-3 py-1 rounded-lg ${
                  sessionTypeFilter === '' ? 'bg-marine text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSessionTypeFilter('mock_interview')}
                className={`px-3 py-1 rounded-lg ${
                  sessionTypeFilter === 'mock_interview' ? 'bg-marine text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Mock Interview
              </button>
              <button
                onClick={() => setSessionTypeFilter('mentorship')}
                className={`px-3 py-1 rounded-lg ${
                  sessionTypeFilter === 'mentorship' ? 'bg-marine text-white' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Mentorship
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" label="Loading mentorship slots..." />
          ) : slots.length === 0 ? (
            <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
              No senior availability slots currently listed for this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="card-theme border rounded-3xl p-6 shadow-xs hover:border-marine/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-marine/10 text-marine dark:bg-blue-950/40 dark:text-blue-300">
                        {slot.session_type}
                      </span>
                      {slot.senior_verified && <VerifiedBadge size="sm" />}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {slot.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {slot.description}
                    </p>

                    {/* Senior Info */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{slot.senior_name}</p>
                        <p className="text-[11px] text-slate-500">{slot.senior_branch}</p>
                      </div>
                      <div className="text-right">
                        <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <Star size={13} className="fill-amber-400" /> {slot.average_rating || 5.0}
                        </span>
                        <span className="text-[10px] text-slate-400">({slot.ratings_count || 0} reviews)</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-butter-light text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-700" />
                      <span>{slot.day_of_week} • {slot.time_slot}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedSlot(slot)}
                      className="w-full py-2.5 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light transition-all shadow-xs"
                    >
                      Request This Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SESSIONS DASHBOARD */}
      {activeTab === 'my-sessions' && (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
              You do not have any active or past mentorship sessions scheduled yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sess) => {
                const isUserSenior = user && user.id === sess.senior_id;
                const isUserJunior = user && user.id === sess.junior_id;

                return (
                  <div
                    key={sess.id}
                    className="card-theme border rounded-3xl p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-marine/10 text-marine mr-2">
                          {sess.session_type}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {sess.slot_title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            sess.status === 'confirmed'
                              ? 'bg-blue-100 text-marine dark:bg-blue-950/40 dark:text-blue-300'
                              : sess.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          Status: {sess.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-500 uppercase tracking-wider mb-0.5">Participants</p>
                        <p className="text-slate-800 dark:text-slate-200">
                          Senior: <strong>{sess.senior_name}</strong>
                        </p>
                        <p className="text-slate-800 dark:text-slate-200">
                          Junior: <strong>{sess.junior_name}</strong>
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-500 uppercase tracking-wider mb-0.5">Schedule</p>
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">
                          📅 {sess.date_requested}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">{sess.time_slot}</p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-500 uppercase tracking-wider mb-0.5">Meeting Link</p>
                        {sess.meeting_link ? (
                          <a
                            href={sess.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 font-bold hover:underline"
                          >
                            <Video size={14} /> Join Video Call <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Pending senior confirmation</span>
                        )}
                      </div>
                    </div>

                    {/* Topic Notes */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Junior's Agenda / Topic Notes:</span> {sess.topic_notes}
                      {sess.resume_link && (
                        <div className="mt-1">
                          <a
                            href={sess.resume_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-marine dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            View Candidate Resume <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Senior Feedback Display */}
                    {sess.senior_feedback && (
                      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                            <Award size={15} /> Senior's Performance Evaluation
                          </span>
                          <div className="flex gap-3 font-bold">
                            <span>Tech Score: {sess.senior_feedback.technical_score}/10</span>
                            <span>Communication: {sess.senior_feedback.communication_score}/10</span>
                          </div>
                        </div>
                        <p><strong className="text-slate-700 dark:text-slate-200">Strengths:</strong> {sess.senior_feedback.strengths}</p>
                        <p><strong className="text-slate-700 dark:text-slate-200">Areas for Improvement:</strong> {sess.senior_feedback.areas_for_improvement}</p>
                        {sess.senior_feedback.recommended_resources && (
                          <p><strong className="text-slate-700 dark:text-slate-200">Resources:</strong> {sess.senior_feedback.recommended_resources}</p>
                        )}
                      </div>
                    )}

                    {/* Junior Review Display */}
                    {sess.junior_review && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-bold text-amber-600">
                          {Array.from({ length: sess.junior_review.rating }).map((_, i) => (
                            <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                          ))}
                          <span className="ml-1 text-slate-700 dark:text-slate-300">
                            Junior's Feedback Review
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 italic">
                          "{sess.junior_review.review}"
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* Senior actions */}
                      {isUserSenior && sess.status === 'pending' && (
                        <button
                          onClick={() => setConfirmSessionModal(sess)}
                          className="px-4 py-1.5 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                        >
                          Confirm & Add Meet Link
                        </button>
                      )}

                      {isUserSenior && sess.status === 'confirmed' && !sess.senior_feedback && (
                        <button
                          onClick={() => setFeedbackSessionModal(sess)}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-900 font-bold text-xs hover:bg-amber-400"
                        >
                          Submit Performance Feedback
                        </button>
                      )}

                      {/* Junior actions */}
                      {isUserJunior && sess.status === 'completed' && !sess.junior_review && (
                        <button
                          onClick={() => setReviewSessionModal(sess)}
                          className="px-4 py-1.5 rounded-xl bg-butter text-slate-900 border border-amber-300 font-bold text-xs hover:bg-amber-300"
                        >
                          ⭐ Rate Senior Mentor
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Request Session (Junior) */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Request Mock Interview / Mentorship
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mentor: <strong>{selectedSlot.senior_name}</strong> ({selectedSlot.title})
            </p>

            <form onSubmit={handleRequestSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  value={requestForm.date_requested}
                  onChange={(e) => setRequestForm({ ...requestForm, date_requested: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What would you like to focus on? (Agenda & Questions) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestForm.topic_notes}
                  onChange={(e) => setRequestForm({ ...requestForm, topic_notes: e.target.value })}
                  placeholder="e.g. Graph algorithms mock problem, resume review, Google OA strategy..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resume Link (Google Drive / Overleaf link)
                </label>
                <input
                  type="url"
                  value={requestForm.resume_link}
                  onChange={(e) => setRequestForm({ ...requestForm, resume_link: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  {submittingRequest ? 'Submitting Request...' : 'Send Session Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Slot (Senior) */}
      {showCreateSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Offer Mentorship Availability
            </h3>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={slotForm.title}
                  onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Session Type *
                  </label>
                  <select
                    value={slotForm.session_type}
                    onChange={(e) => setSlotForm({ ...slotForm, session_type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  >
                    <option value="mock_interview">Mock Interview</option>
                    <option value="mentorship">General Mentorship / Q&A</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Day of Week *
                  </label>
                  <input
                    type="text"
                    required
                    value={slotForm.day_of_week}
                    onChange={(e) => setSlotForm({ ...slotForm, day_of_week: e.target.value })}
                    placeholder="e.g. Saturday"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Time Slot *
                </label>
                <input
                  type="text"
                  required
                  value={slotForm.time_slot}
                  onChange={(e) => setSlotForm({ ...slotForm, time_slot: e.target.value })}
                  placeholder="e.g. 6:00 PM - 7:00 PM IST"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={slotForm.description}
                  onChange={(e) => setSlotForm({ ...slotForm, description: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateSlotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSlot}
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  {submittingSlot ? 'Creating...' : 'Publish Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Senior Confirms with Video Link */}
      {confirmSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Confirm Mentorship Session
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your Google Meet, Zoom, or Teams link for candidate <strong>{confirmSessionModal.junior_name}</strong>.
            </p>

            <form onSubmit={handleConfirmSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Video Meeting URL *
                </label>
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmSessionModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  Confirm & Notify Junior
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Senior Feedback Form */}
      {feedbackSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Performance Feedback for {feedbackSessionModal.junior_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide constructive evaluation and score the junior's interview readiness.
            </p>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Technical Score (1 - 10) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={feedbackForm.technical_score}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, technical_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Communication Score (1 - 10) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={feedbackForm.communication_score}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, communication_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Key Strengths *
                </label>
                <textarea
                  rows={2}
                  required
                  value={feedbackForm.strengths}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                  placeholder="e.g. Good DSA intuition, clean variable naming, good time complexity analysis..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Areas for Improvement *
                </label>
                <textarea
                  rows={2}
                  required
                  value={feedbackForm.areas_for_improvement}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, areas_for_improvement: e.target.value })}
                  placeholder="e.g. Needs to speak out loud while whiteboarding edge cases..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recommended Practice Resources
                </label>
                <input
                  type="text"
                  value={feedbackForm.recommended_resources}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, recommended_resources: e.target.value })}
                  placeholder="e.g. Striver's Graph Playlist, LeetCode Top 150"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFeedbackSessionModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light"
                >
                  Submit Performance Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Junior Review for Senior */}
      {reviewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card-theme border rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Rate Senior Mentor: {reviewSessionModal.senior_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your rating helps other juniors find the best mentors on campus.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={28}
                        className={star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-700 ml-2">
                    {reviewForm.rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Written Feedback & Review *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                  placeholder="How was the session? Did the senior provide actionable coding and interview guidance?"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReviewSessionModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-butter text-slate-900 border border-amber-300 font-bold text-xs hover:bg-amber-300"
                >
                  Submit Mentor Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
