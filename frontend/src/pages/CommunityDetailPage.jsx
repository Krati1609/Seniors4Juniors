import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, MessageSquare, Plus, Send, Lock, Globe, Flag
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CommunityDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New post input
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comment input per post
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Report modal
  const [reportModalData, setReportModalData] = useState({
    isOpen: false,
    targetType: 'post',
    targetId: '',
    targetTitle: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get(`/communities/${id}`),
        api.get(`/communities/${id}/posts`),
      ]);
      setCommunity(cRes.data);
      setPosts(pRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load community.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const toggleJoin = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.post(`/communities/${id}/join`);
      setCommunity((prev) => ({
        ...prev,
        is_member: res.data.joined,
        members_count: (prev?.members_count || 0) + (res.data.joined ? 1 : -1),
      }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update membership.');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    setSubmittingPost(true);
    try {
      const res = await api.post(`/communities/${id}/posts`, {
        title: postTitle.trim(),
        content: postContent.trim(),
      });
      setPosts([res.data, ...posts]);
      setPostTitle('');
      setPostContent('');
      setCommunity((prev) => ({ ...prev, posts_count: (prev?.posts_count || 0) + 1 }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await api.post(`/communities/posts/${postId}/comments`, { content: text.trim() });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), res.data],
                comments_count: (p.comments_count || 0) + 1,
              }
            : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add reply.');
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <LoadingSpinner size="lg" label="Loading community discussions..." />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 card-theme border rounded-3xl text-center shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Community Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link to="/communities" className="px-5 py-2.5 rounded-xl bg-marine text-white font-semibold text-sm">
          Back to Communities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/communities"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-marine dark:hover:text-white"
      >
        <ArrowLeft size={16} /> All Communities
      </Link>

      {/* Community Banner */}
      <div className="card-theme border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-marine/10 text-marine dark:bg-blue-950/40 dark:text-blue-300">
                {community.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                {community.is_private ? <Lock size={12} /> : <Globe size={12} />}
                {community.is_private ? 'Private' : 'Public'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {community.name}
            </h1>
            <p className="text-xs text-slate-500">
              Created by {community.creator_name} • {community.college_name}
            </p>
          </div>

          <button
            onClick={toggleJoin}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs shrink-0 ${
              community.is_member
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-crimson'
                : 'bg-marine text-white hover:bg-marine-light'
            }`}
          >
            {community.is_member ? 'Joined ✓ (Leave)' : 'Join Community'}
          </button>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
          {community.description}
        </p>

        <div className="flex items-center gap-5 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <Users size={14} /> {community.members_count} Members
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={14} /> {community.posts_count} Posts
          </span>
        </div>
      </div>

      {/* Post Box (If Joined) */}
      {community.is_member ? (
        <div className="card-theme border rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-marine" />
            <span>Create a Post in this Community</span>
          </h3>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post title (e.g. Recommended resources for Google OA?)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none"
            />
            <textarea
              rows={3}
              required
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write your discussion or announcement..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-marine focus:outline-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingPost}
                className="px-5 py-2 rounded-xl bg-marine text-white font-bold text-xs hover:bg-marine-light transition-colors disabled:opacity-50"
              >
                {submittingPost ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-300 text-center">
          Join this community to participate in discussions and share resources with your college peers!
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Community Discussions ({posts.length})
        </h3>

        {posts.length === 0 ? (
          <div className="card-theme border rounded-3xl p-10 text-center text-slate-400 text-sm">
            No posts published in this community yet. Start the conversation!
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="card-theme border rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-marine text-white flex items-center justify-center font-bold text-[10px]">
                    {post.author_name?.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{post.author_name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">({post.author_role})</span>
                </div>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{post.title}</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Comments inside Post */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Replies ({post.comments?.length || 0})
                </p>

                {post.comments?.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.author_name}</span>
                      <span className="text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{c.content}</p>
                  </div>
                ))}

                {/* Reply Form */}
                {isAuthenticated && (
                  <form
                    onSubmit={(e) => handleAddComment(post.id, e)}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      placeholder="Write a reply..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-marine focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                      className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-semibold text-xs hover:bg-marine hover:text-white transition-colors"
                    >
                      Reply
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))
        )}
      </div>

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
