import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import AppLoader from '@/components/layout/AppLoader';

const Chat                  = lazy(() => import('@/pages/Chat'));
const Biblioteca            = lazy(() => import('@/pages/Biblioteca'));
const Laboratorio           = lazy(() => import('@/pages/Laboratorio'));
const SharedChat            = lazy(() => import('@/pages/SharedChat'));
const Integracoes           = lazy(() => import('@/pages/Integracoes'));
const ChamsaOverview        = lazy(() => import('@/pages/ChamsaOverview'));
const PendingApproval       = lazy(() => import('@/pages/PendingApproval'));
const PendingEmailVerification = lazy(() => import('@/pages/PendingEmailVerification'));
const AdminUsers            = lazy(() => import('@/pages/AdminUsers'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) return <AppLoader />;

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

  return (
    <Suspense fallback={<AppLoader />}>
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
    </Suspense>
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