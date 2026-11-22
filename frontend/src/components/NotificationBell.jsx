import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.unread_count || 0);
    } catch (err) {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Polling every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border-2 border-cobalt dark:border-butter bg-butter dark:bg-cobalt-dark text-cobalt dark:text-butter shadow-[2px_2px_0px_#1B2E85] dark:shadow-[2px_2px_0px_#FBF0A8] btn-press"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-sans font-bold text-butter bg-crimson border border-cobalt dark:border-butter rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl shadow-[6px_6px_0px_#1B2E85] dark:shadow-[6px_6px_0px_#FBF0A8] z-50 overflow-hidden">
          <div className="p-3.5 border-b-2 border-cobalt dark:border-butter bg-butter dark:bg-cobalt flex items-center justify-between">
            <h4 className="font-serif font-black text-sm text-cobalt dark:text-butter flex items-center gap-2">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-sans font-bold uppercase rounded-md bg-crimson text-butter">
                  {unreadCount} new
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:underline flex items-center gap-1"
              >
                <Check size={14} strokeWidth={2.5} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y-2 divide-cobalt/20 dark:divide-butter/20">
            {loading ? (
              <div className="p-6 text-center text-xs font-sans font-bold uppercase tracking-wider text-cobalt/70 dark:text-butter/70">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-cobalt/70 dark:text-butter/70 text-sm font-sans">
                No notifications yet. You're all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs transition-colors hover:bg-butter/40 dark:hover:bg-cobalt/60 flex items-start gap-3 ${
                    !n.read ? 'bg-butter/60 dark:bg-cobalt' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-bold text-cobalt dark:text-butter text-sm mb-0.5">
                      {n.title}
                    </p>
                    <p className="text-cobalt/90 dark:text-butter/90 text-xs leading-relaxed break-words font-sans">
                      {n.message}
                    </p>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 mt-1.5 text-crimson font-sans font-bold uppercase text-[11px] hover:underline"
                      >
                        View details <ExternalLink size={12} strokeWidth={2.5} />
                      </Link>
                    )}
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      title="Mark as read"
                      className="p-1 rounded-md text-cobalt dark:text-butter hover:bg-crimson hover:text-butter transition-colors"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-butter dark:bg-cobalt border-t-2 border-cobalt dark:border-butter text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:underline"
            >
              View all notification history →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
