import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MessageSquare, Eye, Bookmark, Flag, Filter, PlusCircle,
  TrendingUp, Award, ChevronRight, UserPlus, UserCheck, Calendar, ArrowUpRight
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import BestAnswerBadge from '../components/BestAnswerBadge';
import ReportModal from '../components/ReportModal';
import LoadingSpinner from '../components/LoadingSpinner';

const POPULAR_TAGS = [
  'All', 'placements', 'dsa', 'internships', 'branch choice',
  'system design', 'google', 'microsoft', 'quant', 'resumes'
];

export default function HomeFeedPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters & Search
  const [activeTag, setActiveTag] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Side Widgets Data
  const [jobTrends, setJobTrends] = useState([]);
  const [topSeniors, setTopSeniors] = useState([]);

  // Report Modal State
  const [reportModalData, setReportModalData] = useState({
    isOpen: false,
    targetType: 'question',
    targetId: '',
    targetTitle: '',
  });

  const fetchQuestions = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        page: pageNum,
        limit: 8,
        sort: sortBy,
      };
      if (activeTag !== 'All') params.tag = activeTag;
      if (selectedBranch) params.branch = selectedBranch;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/questions', { params });
      const newItems = res.data?.questions || [];
      setTotalQuestions(res.data?.total || 0);
      setHasMore(res.data?.has_more || false);

      if (append) {
        setQuestions((prev) => [...prev, ...newItems]);
      } else {
        setQuestions(newItems);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSideWidgets = async () => {
    try {
      const [jobsRes, seniorsRes] = await Promise.all([
        api.get('/job-trends'),
        api.get('/users/seniors?verified_only=true'),
      ]);
      setJobTrends((jobsRes.data || []).slice(0, 3));
      setTopSeniors((seniorsRes.data || []).slice(0, 4));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, false);
  }, [activeTag, selectedBranch, sortBy]);

  useEffect(() => {
    fetchSideWidgets();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchQuestions(nextPage, true);
    }
  };

  const toggleBookmark = async (questionId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/questions/${questionId}/bookmark`);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, is_bookmarked: res.data.bookmarked } : q
        )
      );
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const toggleFollowSenior = async (seniorId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/users/${seniorId}/follow`);
      setTopSeniors((prev) =>
        prev.map((s) => (s.id === seniorId ? { ...s, is_following: res.data.following } : s))
      );
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
      
      {/* Editorial Asymmetric Hero Section */}
      <section className="mb-10 p-6 sm:p-10 lg:p-12 rounded-2xl bg-cobalt border-2 border-cobalt-dark dark:border-butter text-butter shadow-hard-cobalt dark:shadow-hard-butter relative overflow-hidden">
        {/* Decorative Inline SVG Background Geometry (Pure Flat Shapes) */}
        <div className="absolute -right-8 -bottom-10 pointer-events-none opacity-20 select-none">
          <svg width="340" height="340" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#FBF0A8" strokeWidth="6" strokeDasharray="12 8" />
            <polygon points="100,20 180,160 20,160" fill="#FBF0A8" opacity="0.3" />
            <rect x="50" y="50" width="100" height="100" fill="#C8102E" opacity="0.4" transform="rotate(45 100 100)" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-butter text-cobalt border-2 border-cobalt-dark text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_#121F5C]">
              <span>🏛️</span>
              <span>{user?.college_name || 'Campus Peer Knowledge Network'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-[0.98] text-butter">
              Direct answers from seniors who walked the path first.
            </h1>

            <p className="text-base sm:text-lg font-sans text-butter/90 max-w-2xl leading-relaxed">
              Skip the rumors. Ask verified campus seniors about placements, DSA roadmaps, non-tech pivots, and book 1-on-1 mock interviews tailored to your college.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/ask"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-crimson text-butter font-sans font-bold uppercase text-xs tracking-wider border-2 border-butter shadow-[4px_4px_0px_#FBF0A8] btn-press"
              >
                <PlusCircle size={18} strokeWidth={2.5} />
                <span>Ask a Senior</span>
              </Link>
              <Link
                to="/mentorship"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-butter text-cobalt font-sans font-bold uppercase text-xs tracking-wider border-2 border-cobalt-dark shadow-[4px_4px_0px_#121F5C] btn-press"
              >
                <Calendar size={18} strokeWidth={2.5} />
                <span>Book Mock Interview</span>
              </Link>
            </div>
          </div>

          {/* Asymmetric Editorial Accent Box */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="p-6 rounded-xl bg-butter text-cobalt border-2 border-cobalt-dark shadow-[6px_6px_0px_#121F5C] space-y-3 transform rotate-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-cobalt/80">Campus Statute</span>
                <span className="w-3 h-3 rounded-full bg-crimson"></span>
              </div>
              <h3 className="font-serif font-black text-2xl text-cobalt leading-tight">
                100% College Scoped &amp; Verified.
              </h3>
              <p className="text-xs font-sans text-cobalt/90 leading-relaxed font-semibold">
                Your questions reach seniors in your branch. Placements and OA questions are kept within your campus boundary.
              </p>
              <div className="pt-2 border-t-2 border-cobalt/20 flex items-center justify-between text-xs font-sans font-bold">
                <span>Verified Badges Active</span>
                <span className="text-crimson font-black">★ S4J</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Feed Column & Sticky Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Feed Column */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Search & Sort Controls Card */}
          <div className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl p-5 sm:p-6 shadow-hard space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search placements, Google OA, system design, branch change..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-cobalt dark:border-butter bg-[#FFFDE8] dark:bg-cobalt-dark text-sm font-sans font-bold text-cobalt dark:text-butter placeholder:text-cobalt/75 dark:placeholder:text-butter/75 focus:outline-none focus:ring-2 focus:ring-crimson"
              />
              <Search size={20} strokeWidth={2.5} className="absolute left-3.5 top-3.5 text-cobalt dark:text-butter" />
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Branch Filter Dropdown - WCAG AA compliant contrast in default, hover, focus, open states */}
              <div className="flex items-center gap-2">
                <Filter size={18} strokeWidth={2.5} className="text-cobalt dark:text-butter shrink-0" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="text-xs font-sans font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border-2 border-cobalt dark:border-butter bg-[#FFFDE8] dark:bg-cobalt-dark text-cobalt dark:text-butter focus:outline-none focus:ring-2 focus:ring-crimson cursor-pointer shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8]"
                >
                  <option value="" className="bg-[#FFFDE8] text-cobalt dark:bg-cobalt-dark dark:text-butter py-1 font-bold">
                    All Academic Branches
                  </option>
                  <option value="Computer Science & Engineering" className="bg-[#FFFDE8] text-cobalt dark:bg-cobalt-dark dark:text-butter py-1 font-bold">
                    CSE
                  </option>
                  <option value="Electrical Engineering" className="bg-[#FFFDE8] text-cobalt dark:bg-cobalt-dark dark:text-butter py-1 font-bold">
                    Electrical (EE)
                  </option>
                  <option value="Mechanical Engineering" className="bg-[#FFFDE8] text-cobalt dark:bg-cobalt-dark dark:text-butter py-1 font-bold">
                    Mechanical
                  </option>
                  <option value="Information Technology" className="bg-[#FFFDE8] text-cobalt dark:bg-cobalt-dark dark:text-butter py-1 font-bold">
                    IT
                  </option>
                  <option value="Electronics & Communication" className="bg-[#FFFDE8] text-cobalt dark:bg-cobalt-dark dark:text-butter py-1 font-bold">
                    ECE
                  </option>
                </select>
              </div>

              {/* Sort Selector Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl border-2 border-cobalt dark:border-butter bg-butter dark:bg-cobalt shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8]">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                    sortBy === 'newest'
                      ? 'bg-cobalt text-butter dark:bg-butter dark:text-cobalt shadow-[2px_2px_0px_#121F5C] dark:shadow-[2px_2px_0px_#1B2E85]'
                      : 'text-cobalt dark:text-butter hover:bg-cobalt/10'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSortBy('most_upvoted')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                    sortBy === 'most_upvoted'
                      ? 'bg-cobalt text-butter dark:bg-butter dark:text-cobalt shadow-[2px_2px_0px_#121F5C] dark:shadow-[2px_2px_0px_#1B2E85]'
                      : 'text-cobalt dark:text-butter hover:bg-cobalt/10'
                  }`}
                >
                  Most Upvoted
                </button>
                <button
                  onClick={() => setSortBy('unanswered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                    sortBy === 'unanswered'
                      ? 'bg-cobalt text-butter dark:bg-butter dark:text-cobalt shadow-[2px_2px_0px_#121F5C] dark:shadow-[2px_2px_0px_#1B2E85]'
                      : 'text-cobalt dark:text-butter hover:bg-cobalt/10'
                  }`}
                >
                  Unanswered
                </button>
              </div>
            </div>
          </div>

          {/* Tag Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {POPULAR_TAGS.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider whitespace-nowrap transition-all border-2 btn-press ${
                    isActive
                      ? 'bg-crimson text-butter border-cobalt dark:border-butter shadow-[3px_3px_0px_#1B2E85] dark:shadow-[3px_3px_0px_#FBF0A8]'
                      : 'bg-butter dark:bg-cobalt text-cobalt dark:text-butter border-cobalt dark:border-butter shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {/* Feed List */}
          {loading ? (
            <div className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl p-12 text-center shadow-hard">
              <LoadingSpinner size="lg" label="Retrieving campus questions..." />
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl p-12 text-center shadow-hard space-y-4">
              <div className="w-16 h-16 bg-butter border-2 border-cobalt dark:border-butter text-cobalt dark:text-butter rounded-xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#1B2E85] dark:shadow-[3px_3px_0px_#FBF0A8]">
                <MessageSquare size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-serif font-black text-2xl text-cobalt dark:text-butter">
                No Questions Under This Filter
              </h3>
              <p className="text-sm font-sans text-cobalt dark:text-butter max-w-md mx-auto leading-relaxed">
                Be the pioneer junior to ask about upcoming placement roadmaps, DSA strategies, or course recommendations.
              </p>
              <div className="pt-2">
                <Link
                  to="/ask"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-crimson text-butter font-sans font-bold uppercase text-xs tracking-wider border-2 border-cobalt dark:border-butter shadow-[3px_3px_0px_#1B2E85] dark:shadow-[3px_3px_0px_#FBF0A8] btn-press"
                >
                  <PlusCircle size={18} strokeWidth={2.5} /> Ask Question Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q) => (
                <article
                  key={q.id}
                  className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl p-6 shadow-hard hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-hard-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    
                    {/* Left Column: Vote / Answers Indicator Block */}
                    <div className="hidden sm:flex flex-col items-center justify-center w-16 p-2 rounded-xl bg-butter dark:bg-cobalt border-2 border-cobalt dark:border-butter shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8] shrink-0 text-center select-none">
                      <span className="font-serif font-black text-lg text-cobalt dark:text-butter leading-none">
                        {q.answers_count}
                      </span>
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter mt-1">
                        {q.answers_count === 1 ? 'Ans' : 'Answers'}
                      </span>
                    </div>

                    {/* Right Question Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      
                      {/* Asker Meta Line - high contrast in both light and dark mode */}
                      <div className="flex items-center justify-between text-xs font-sans text-cobalt dark:text-butter pb-1.5 border-b-2 border-cobalt/20 dark:border-butter/25">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-6 h-6 rounded-md bg-cobalt dark:bg-butter text-butter dark:text-cobalt font-serif font-black text-xs flex items-center justify-center border border-cobalt dark:border-butter shrink-0">
                            {q.is_anonymous ? '?' : q.asker_name?.charAt(0)}
                          </div>
                          <span className="font-serif font-black text-xs sm:text-sm text-cobalt dark:text-butter">
                            {q.asker_name}
                          </span>
                          {q.asker_branch && (
                            <span className="text-xs font-sans font-bold text-cobalt dark:text-butter">
                              • {q.asker_branch}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-cobalt dark:text-butter">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => toggleBookmark(q.id, e)}
                            className={`p-1.5 rounded-lg border-2 border-cobalt dark:border-butter btn-press ${
                              q.is_bookmarked
                                ? 'bg-crimson text-butter'
                                : 'bg-butter dark:bg-cobalt text-cobalt dark:text-butter'
                            }`}
                            title={q.is_bookmarked ? 'Remove bookmark' : 'Bookmark question'}
                            aria-label="Bookmark question"
                          >
                            <Bookmark size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      {/* Question Title & Content - full WCAG AA contrast */}
                      <Link to={`/questions/${q.id}`} className="block group/link">
                        <h2 className="text-xl sm:text-2xl font-serif font-black text-cobalt dark:text-butter group-hover/link:text-crimson dark:group-hover/link:text-butter-dark transition-colors leading-tight mb-2">
                          {q.title}
                        </h2>
                        <p className="text-sm sm:text-base font-sans font-medium text-cobalt dark:text-butter line-clamp-2 leading-relaxed">
                          {q.content}
                        </p>
                      </Link>

                      {/* Tag Chips in Butter Yellow */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {q.tags?.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-0.5 rounded-lg bg-butter text-cobalt border border-cobalt text-[10px] font-sans font-bold uppercase tracking-wider shadow-[1px_1px_0px_#1B2E85]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Top Answer Snippet (Quora Style Highlight) */}
                      {q.top_answer && (
                        <div className="p-4 rounded-xl bg-butter/40 dark:bg-cobalt-dark border-2 border-cobalt/30 dark:border-butter/40 space-y-2 mt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-cobalt dark:text-butter">
                                Answered by {q.top_answer.senior_name}
                              </span>
                              {q.top_answer.senior_verified && <VerifiedBadge size="sm" />}
                            </div>
                            {q.top_answer.is_best_answer && <BestAnswerBadge />}
                          </div>
                          <p className="text-xs sm:text-sm font-sans text-cobalt dark:text-butter line-clamp-2 italic leading-relaxed">
                            "{q.top_answer.content_snippet}"
                          </p>
                        </div>
                      )}

                      {/* Bottom Stats & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t-2 border-cobalt/20 dark:border-butter/25 text-xs font-sans font-bold text-cobalt dark:text-butter">
                        <div className="flex items-center gap-4">
                          <Link
                            to={`/questions/${q.id}`}
                            className="flex items-center gap-1.5 text-cobalt dark:text-butter hover:text-crimson transition-colors"
                          >
                            <MessageSquare size={15} strokeWidth={2.5} />
                            <span>{q.answers_count} {q.answers_count === 1 ? 'Answer' : 'Answers'}</span>
                          </Link>
                          <span className="flex items-center gap-1 text-cobalt/85 dark:text-butter/85">
                            <Eye size={15} strokeWidth={2} />
                            <span>{q.views_count} views</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setReportModalData({
                                isOpen: true,
                                targetType: 'question',
                                targetId: q.id,
                                targetTitle: q.title,
                              })
                            }
                            className="flex items-center gap-1 text-cobalt/85 dark:text-butter/85 hover:text-crimson transition-colors"
                            title="Report inappropriate question"
                          >
                            <Flag size={14} strokeWidth={2.5} />
                            <span className="uppercase text-[11px] tracking-wider">Report</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-xl bg-butter dark:bg-cobalt text-cobalt dark:text-butter border-2 border-cobalt dark:border-butter font-sans font-bold text-xs uppercase tracking-wider shadow-hard btn-press"
                  >
                    {loadingMore ? 'Loading more questions...' : 'Load More Questions ↓'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sticky Sidebar Widgets */}
        <aside className="lg:col-span-4 space-y-6 sticky top-28">
          
          {/* Job Trends Widget */}
          <div className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl p-5 shadow-hard space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-cobalt/20 dark:border-butter/25">
              <h3 className="font-serif font-black text-lg text-cobalt dark:text-butter flex items-center gap-2">
                <TrendingUp size={20} strokeWidth={2.5} className="text-crimson" />
                <span>Job Trends on Campus</span>
              </h3>
              <Link
                to="/job-trends"
                className="text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:text-crimson flex items-center gap-0.5"
              >
                <span>View all</span>
                <ArrowUpRight size={13} strokeWidth={2.5} />
              </Link>
            </div>

            <div className="space-y-3">
              {jobTrends.length === 0 ? (
                <p className="text-xs font-sans font-bold text-cobalt dark:text-butter text-center py-4">
                  No active campus drives posted yet.
                </p>
              ) : (
                jobTrends.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl bg-butter/60 dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter space-y-2 hover:translate-x-[-1px] hover:translate-y-[-1px] shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Company Heading - explicitly bold, prominent and high-contrast */}
                        <h4 className="font-serif font-black text-base text-cobalt dark:text-butter leading-tight">
                          {job.company}
                        </h4>
                        <p className="text-xs font-sans font-bold text-cobalt dark:text-butter mt-0.5">{job.role}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold uppercase bg-crimson text-butter shrink-0">
                        {job.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-sans pt-1 border-t border-cobalt/20 dark:border-butter/25">
                      <span className="font-bold text-cobalt dark:text-butter">{job.package_range}</span>
                      <span className="text-[11px] font-bold text-cobalt dark:text-butter">Due: {job.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Verified Seniors Leaderboard Widget */}
          <div className="bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl p-5 shadow-hard space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-cobalt/20 dark:border-butter/25">
              <h3 className="font-serif font-black text-lg text-cobalt dark:text-butter flex items-center gap-2">
                <Award size={20} strokeWidth={2.5} className="text-crimson" />
                <span>Verified Senior Mentors</span>
              </h3>
              <Link
                to="/seniors"
                className="text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:text-crimson flex items-center gap-0.5"
              >
                <span>Directory</span>
                <ArrowUpRight size={13} strokeWidth={2.5} />
              </Link>
            </div>

            <div className="space-y-3">
              {topSeniors.length === 0 ? (
                <p className="text-xs font-sans font-bold text-cobalt dark:text-butter text-center py-4">
                  No verified seniors listed yet.
                </p>
              ) : (
                topSeniors.map((senior) => (
                  <div
                    key={senior.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-butter/50 dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8] transition-all"
                  >
                    <Link to={`/profile/${senior.id}`} className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cobalt dark:bg-butter text-butter dark:text-cobalt font-serif font-black text-sm flex items-center justify-center shrink-0 border-2 border-cobalt dark:border-butter shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8]">
                        {senior.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif font-bold text-sm text-cobalt dark:text-butter truncate">
                          {senior.full_name}
                        </p>
                        <p className="text-[11px] font-sans font-bold text-cobalt dark:text-butter truncate">
                          {senior.branch}
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={(e) => toggleFollowSenior(senior.id, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1 border-2 border-cobalt dark:border-butter btn-press shrink-0 ${
                        senior.is_following
                          ? 'bg-butter text-cobalt'
                          : 'bg-crimson text-butter'
                      }`}
                    >
                      {senior.is_following ? (
                        <>
                          <UserCheck size={13} strokeWidth={2.5} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} strokeWidth={2.5} /> Follow
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mentorship Editorial Callout */}
          <div className="p-6 rounded-xl bg-cobalt text-butter border-2 border-cobalt-dark dark:border-butter shadow-[6px_6px_0px_#C8102E] space-y-3">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-butter/85 block">
              1-on-1 Mentorship
            </span>
            <h4 className="font-serif font-black text-xl text-butter leading-tight">
              Book a Mock Coding Interview.
            </h4>
            <p className="text-xs font-sans text-butter/95 leading-relaxed font-medium">
              Schedule live video sessions with placed seniors. Practice real interview rounds, get technical &amp; communication scorecards.
            </p>
            <Link
              to="/mentorship"
              className="inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-butter bg-crimson px-4 py-2 rounded-lg border-2 border-butter shadow-[2px_2px_0px_#FBF0A8] btn-press"
            >
              <span>Explore Available Slots</span>
              <ChevronRight size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </aside>
      </div>

      {/* Global Report Modal */}
      <ReportModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({ ...reportModalData, isOpen: false })}
        targetType={reportModalData.targetType}
        targetId={reportModalData.targetId}
        targetTitle={reportModalData.targetTitle}
      />
    </div>
  );
}
