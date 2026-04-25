import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import AcademicsPage from './pages/AcademicsPage';
import AttendancePage from './pages/AttendancePage';
import FeesPage from './pages/FeesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SuperAdminPage from './pages/SuperAdminPage';

export type UserRole = 'super_admin' | 'institute_admin' | 'authority' | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const ALLOWED_ROLES: UserRole[] = ['super_admin', 'institute_admin', 'authority'];

  const validateAndSetUser = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const role = profile?.role as UserRole;
    if (role && ALLOWED_ROLES.includes(role)) {
      setUserRole(role);
      setIsAuthenticated(true);
    } else {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await validateAndSetUser(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await validateAndSetUser(user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />

        {isAuthenticated ? (
          <Route path="/" element={<DashboardLayout onLogout={handleLogout} userRole={userRole} />}>
            <Route index element={<Dashboard />} />

            {/* Super Admin only */}
            {userRole === 'super_admin' && (
              <Route path="tenants" element={<SuperAdminPage />} />
            )}

            {/* Institute Admin + Authority */}
            {(userRole === 'institute_admin' || userRole === 'authority') && (
              <>
                <Route path="users" element={<UsersPage />} />
                <Route path="academics" element={<AcademicsPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="fees" element={<FeesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </>
            )}

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
