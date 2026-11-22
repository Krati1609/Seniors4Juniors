import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomeFeedPage from './pages/HomeFeedPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import AskQuestionPage from './pages/AskQuestionPage';
import JuniorSignupPage from './pages/JuniorSignupPage';
import SeniorSignupPage from './pages/SeniorSignupPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import JobTrendsPage from './pages/JobTrendsPage';
import InterviewExperiencesPage from './pages/InterviewExperiencesPage';
import MentorshipPage from './pages/MentorshipPage';
import SeniorsDirectoryPage from './pages/SeniorsDirectoryPage';
import BookmarksPage from './pages/BookmarksPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public / Core Feed */}
                <Route path="/" element={<HomeFeedPage />} />
                <Route path="/questions/:id" element={<QuestionDetailPage />} />
                <Route
                  path="/ask"
                  element={
                    <ProtectedRoute>
                      <AskQuestionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Authentication & Verification */}
                <Route path="/signup/junior" element={<JuniorSignupPage />} />
                <Route path="/signup/senior" element={<SeniorSignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Profiles & Communities */}
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/seniors" element={<SeniorsDirectoryPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/:id" element={<CommunityDetailPage />} />

                {/* Placements & Mentorship */}
                <Route path="/job-trends" element={<JobTrendsPage />} />
                <Route path="/interview-experiences" element={<InterviewExperiencesPage />} />
                <Route path="/mentorship" element={<MentorshipPage />} />

                {/* User Dashboard */}
                <Route
                  path="/bookmarks"
                  element={
                    <ProtectedRoute>
                      <BookmarksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Panel */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
