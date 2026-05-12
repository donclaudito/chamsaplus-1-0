import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  // Mapeia status HTTP para tipo de erro descritivo
  const resolveHttpError = (error) => {
    const status = error?.status;
    if (status === 404) return { type: 'app_not_found',    message: 'App not found' };
    if (status === 500) return { type: 'server_error',     message: 'Server error — try again later' };
    return                      { type: 'unknown',          message: error?.message || 'Failed to load app' };
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const TOKEN_KEYS = ['base44_access_token', 'base44_token', 'token'];
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);

      // Auto-aprova o usuário se ainda não estiver aprovado (resolve login via Google)
      if (currentUser && currentUser.is_approved !== true && currentUser.role !== 'admin') {
        try {
          await base44.functions.invoke('selfApprove', {});
          // Recarrega dados do usuário após aprovação
          const updatedUser = await base44.auth.me();
          setUser(updatedUser);
        } catch (_) {
          // silencioso — não bloqueia o fluxo de autenticação
        }
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      setAuthChecked(true);

      if (error.status === 401 || error.status === 403) {
        // Token inválido ou expirado — limpa tudo e redireciona para login
        TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    // Lê o token dinamicamente do localStorage (não depende do snapshot estático de appParams)
    const TOKEN_KEYS = ['base44_access_token', 'base44_token', 'token'];
    const storedToken = TOKEN_KEYS.map(k => localStorage.getItem(k)).find(Boolean) || appParams.token;

    const appClient = createAxiosClient({
      baseURL: `/api/apps/public`,
      headers: { 'X-App-Id': appParams.appId },
      token: storedToken,
      interceptResponses: true,
    });

    // Se há token armazenado, dispara auth check em paralelo
    const authPromise = storedToken ? checkUserAuth() : Promise.resolve();

    try {
      const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
      setAppPublicSettings(publicSettings);

      if (!storedToken) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    } catch (appError) {
      console.error('App state check failed:', appError);

      if (appError.status === 403 && appError.data?.extra_data?.reason) {
        const reason = appError.data.extra_data.reason;

        if (reason === 'auth_required') {
          if (storedToken) {
            // Token pode estar expirado — checkUserAuth já foi disparado em paralelo, aguarda
            // Se falhar, será tratado no catch do checkUserAuth com redirect
          } else {
            // Sem token + app privado → redireciona imediatamente para login
            // Limpa qualquer resíduo de sessão anterior antes de redirecionar
            TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
            base44.auth.redirectToLogin(window.location.href);
            return;
          }
        } else {
          setAuthError({ type: reason, message: appError.message });
        }
      } else {
        setAuthError(resolveHttpError(appError));
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingPublicSettings(false);
    }

    await authPromise;
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};