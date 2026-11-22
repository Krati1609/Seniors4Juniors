import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ExternalLink, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      alert('Failed to mark all as read.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-marine"
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Bell className="text-marine" />
          <span>Notifications</span>
        </h1>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-marine dark:text-blue-400 hover:underline flex items-center gap-1.5"
          >
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm space-y-2">
          <Bell size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No notifications yet</p>
          <p className="text-xs">You'll receive alerts when seniors answer your questions or accept mock interview requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card-theme border rounded-2xl p-4 shadow-xs flex items-start justify-between gap-4 transition-colors ${
                !n.read ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' : ''
              }`}
            >
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                {n.link && (
                  <Link
                    to={n.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-marine dark:text-blue-400 hover:underline pt-1"
                  >
                    View context <ExternalLink size={12} />
                  </Link>
                )}
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(n.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
