import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BrowsePage from './pages/BrowsePage';
import ItemDetailPage from './pages/ItemDetailPage';
import ReportPage from './pages/ReportPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/layout/Layout';

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { initAuth, fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initAuth();
    if (isAuthenticated) fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F1F3D',
            color: 'white',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(15,31,61,0.3)',
          },
          success: { style: { background: '#065F46', color: 'white' } },
          error: { style: { background: '#B91C1C', color: 'white' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/browse" element={<Layout><BrowsePage /></Layout>} />
        <Route path="/items/:id" element={<Layout><ItemDetailPage /></Layout>} />

        {/* Auth */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
        <Route path="/report" element={<PrivateRoute><Layout><ReportPage /></Layout></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Layout><MessagesPage /></Layout></PrivateRoute>} />
        <Route path="/messages/:userId" element={<PrivateRoute><Layout><MessagesPage /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={
          <PrivateRoute roles={['admin', 'security']}>
            <Layout><AdminPage /></Layout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
