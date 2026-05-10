import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Chat from '@/pages/Chat';
import Biblioteca from '@/pages/Biblioteca';
import Laboratorio from '@/pages/Laboratorio';
import SharedChat from '@/pages/SharedChat';
import Integracoes from '@/pages/Integracoes';
import ChamsaOverview from '@/pages/ChamsaOverview';
import PendingApproval from '@/pages/PendingApproval';
import PendingEmailVerification from '@/pages/PendingEmailVerification';
import AdminUsers from '@/pages/AdminUsers';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Block users with unverified email (email/password signups) — admins are never blocked
  const isEmailUnverified = isAuthenticated && user && user.is_verified === false && user.role !== 'admin';
  if (isEmailUnverified) {
    return (
      <Routes>
        <Route path="/share/:shareId" element={<SharedChat />} />
        <Route path="*" element={<PendingEmailVerification />} />
      </Routes>
    );
  }

  // Block unapproved users — only block if explicitly set to false (not null/undefined)
  // Admins are never blocked
  const isBlocked = isAuthenticated && user && user.is_approved === false && user.role !== 'admin';
  if (isBlocked) {
    return (
      <Routes>
        <Route path="/share/:shareId" element={<SharedChat />} />
        <Route path="*" element={<PendingApproval />} />
      </Routes>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Chat />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/laboratorio" element={<Laboratorio />} />
        <Route path="/integracoes" element={<Integracoes />} />
        <Route path="/chamsa-overview" element={<ChamsaOverview />} />
        {user?.role === 'admin' && (
          <Route path="/admin/usuarios" element={<AdminUsers />} />
        )}
      </Route>
      <Route path="/share/:shareId" element={<SharedChat />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App