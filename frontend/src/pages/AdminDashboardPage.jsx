import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Users, Award, Flag, ScrollText, CheckCircle2,
  XCircle, Trash2, Search, RefreshCw, AlertTriangle
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview | seniors | users | reports | audit
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Pending seniors state
  const [pendingSeniors, setPendingSeniors] = useState([]);
  const [loadingSeniors, setLoadingSeniors] = useState(false);

  // Users state
  const [userList, setUserList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Reports state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingSeniors = async () => {
    setLoadingSeniors(true);
    try {
      const res = await api.get('/admin/seniors/pending');
      setPendingSeniors(res.data || []);
    } catch (err) {
      console.error('Failed to load pending seniors:', err);
    } finally {
      setLoadingSeniors(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = {};
      if (userSearch.trim()) params.search = userSearch.trim();
      const res = await api.get('/admin/users', { params });
      setUserList(res.data?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'seniors') fetchPendingSeniors();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handleVerifySenior = async (seniorId, isVerified) => {
    try {
      await api.put(`/admin/seniors/${seniorId}/verify`, {
        is_verified: isVerified,
        notes: isVerified ? 'Verified by campus admin' : 'Rejected verification',
      });
      setPendingSeniors(pendingSeniors.filter((s) => s.id !== seniorId));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update verification status.');
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      await api.put(`/admin/users/${userId}/status?active=${!currentActive}`);
      setUserList(
        userList.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleResolveReport = async (reportId, actionTaken, removeTargetContent = false, targetType = '', targetId = '') => {
    try {
      if (removeTargetContent && targetType && targetId) {
        await api.delete(`/admin/content/${targetType}/${targetId}`);
      }
      await api.put(`/admin/reports/${reportId}/resolve`, {
        status: 'resolved',
        action_taken: actionTaken,
      });
      setReports(
        reports.map((r) =>
          r.id === reportId ? { ...r, status: 'resolved', action_taken: actionTaken } : r
        )
      );
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to resolve report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-crimson text-white">
              Administrator Console
            </span>
            <span className="text-xs text-slate-400">Authenticated as {user?.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Campus Moderation & Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Verify senior credentials, moderate student reports, manage users, and inspect immutable audit logs.
          </p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            if (activeTab === 'seniors') fetchPendingSeniors();
            else if (activeTab === 'users') fetchUsers();
            else if (activeTab === 'reports') fetchReports();
            else if (activeTab === 'audit') fetchAuditLogs();
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'bg-crimson text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('seniors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors relative ${
            activeTab === 'seniors'
              ? 'bg-crimson text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Senior Verifications
          {stats?.pending_senior_verifications > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-butter text-slate-900 font-extrabold">
              {stats.pending_senior_verifications}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'bg-crimson text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          User Management ({stats?.total_users || 0})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors relative ${
            activeTab === 'reports'
              ? 'bg-crimson text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Reported Content
          {stats?.pending_reports > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-extrabold">
              {stats.pending_reports}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'bg-crimson text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingStats ? (
            <LoadingSpinner size="lg" label="Compiling platform metrics..." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-theme border rounded-2xl p-5 shadow-xs">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats?.total_users}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Users</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {stats?.total_juniors} Juniors • {stats?.total_seniors} Seniors
                </p>
              </div>

              <div className="card-theme border rounded-2xl p-5 shadow-xs">
                <p className="text-2xl font-black text-amber-600">{stats?.verified_seniors}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Verified Seniors</p>
                <p className="text-[11px] text-amber-600 font-semibold mt-2">
                  {stats?.pending_senior_verifications} pending verification
                </p>
              </div>

              <div className="card-theme border rounded-2xl p-5 shadow-xs">
                <p className="text-2xl font-black text-marine dark:text-blue-400">{stats?.total_questions}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Q&A Questions</p>
                <p className="text-[11px] text-slate-400 mt-2">{stats?.total_answers} Answers Posted</p>
              </div>

              <div className="card-theme border rounded-2xl p-5 shadow-xs">
                <p className="text-2xl font-black text-crimson">{stats?.pending_reports}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Pending Reports</p>
                <p className="text-[11px] text-slate-400 mt-2">Requiring moderation review</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SENIOR VERIFICATIONS */}
      {activeTab === 'seniors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Seniors Awaiting Profile Verification ({pendingSeniors.length})
            </h3>
          </div>

          {loadingSeniors ? (
            <LoadingSpinner size="lg" label="Loading verification queue..." />
          ) : pendingSeniors.length === 0 ? (
            <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
              No senior verification requests are pending right now.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSeniors.map((senior) => (
                <div
                  key={senior.id}
                  className="card-theme border rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {senior.full_name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {senior.branch} • Year {senior.college_year} (Sem {senior.current_semester}) • {senior.college_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerifySenior(senior.id, true)}
                        className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={15} /> Approve & Verify
                      </button>
                      <button
                        onClick={() => handleVerifySenior(senior.id, false)}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-crimson flex items-center gap-1.5"
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                    <p>
                      <strong>Expertise:</strong> {senior.areas_of_expertise?.join(', ') || 'N/A'}
                    </p>
                    <p>
                      <strong>Placement / Company History:</strong> {senior.placement_history || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchUsers();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name, email, or roll number..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold"
            >
              Search
            </button>
          </form>

          {loadingUsers ? (
            <LoadingSpinner size="lg" label="Loading student directory..." />
          ) : (
            <div className="card-theme border rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">College & Branch</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {userList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-200 dark:bg-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          <p>{u.branch}</p>
                          <p className="text-[11px] text-slate-400">{u.college_name}</p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                u.is_active
                                  ? 'bg-red-50 text-crimson hover:bg-red-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTED CONTENT */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Moderation Reports Queue ({reports.length})
          </h3>

          {loadingReports ? (
            <LoadingSpinner size="lg" label="Loading reports..." />
          ) : reports.length === 0 ? (
            <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
              All reported content has been moderated.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="card-theme border rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-extrabold text-[10px] uppercase bg-red-100 text-crimson">
                        {rep.target_type}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Reason: {rep.reason}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase ${
                        rep.status === 'resolved' ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <p>
                      <strong>Target Content Snippet:</strong> {rep.target_title_or_snippet || 'N/A'}
                    </p>
                    {rep.details && <p><strong>Reporter's Note:</strong> {rep.details}</p>}
                    <p className="text-slate-400 text-[11px]">
                      Reported by {rep.reported_by_name} on {new Date(rep.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'Dismissed as non-violating')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() =>
                          handleResolveReport(
                            rep.id,
                            'Content deleted by admin',
                            true,
                            rep.target_type,
                            rep.target_id
                          )
                        }
                        className="px-4 py-1.5 rounded-lg bg-crimson text-white text-xs font-bold hover:bg-crimson-hover"
                      >
                        Remove Violating Content
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Immutable Administrative Audit Trail
          </h3>

          {loadingAudit ? (
            <LoadingSpinner size="lg" label="Loading audit trail..." />
          ) : auditLogs.length === 0 ? (
            <div className="card-theme border rounded-3xl p-12 text-center text-slate-400 text-sm">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="card-theme border rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Administrator</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono text-[11px]">
                        <td className="p-3 whitespace-nowrap text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {log.admin_email}
                        </td>
                        <td className="p-3 font-bold text-crimson">
                          {log.action}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 uppercase">
                          {log.target_type} {log.target_id ? `(${log.target_id.slice(-6)})` : ''}
                        </td>
                        <td className="p-3 text-slate-500 font-sans truncate max-w-xs">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
