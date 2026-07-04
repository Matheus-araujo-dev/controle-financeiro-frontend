import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore, useAuthMode, useCurrentUser } from '../store/auth-store';
import { refreshSession } from '../services/http/auth-api';
import type { AuthMode } from '../types/auth';

type ProtectedRouteProps = {
  children: ReactNode;
};

// Modos que exigem uma sessão verificada pelo backend (JWT emitido pela API).
// 'development'/'disabled' são apenas para máquina local e mantêm o gate local.
// Em build de produção o modo é sempre coagido para 'google' (ver auth-store).
const backendVerifiedModes = new Set<AuthMode>(['google', 'jwt']);

type VerificationStatus = 'checking' | 'ready' | 'denied';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const mode = useAuthMode();
  const currentUser = useCurrentUser();
  const token = useAuthStore((state) => state.token);
  const applyTokenResponse = useAuthStore((state) => state.applyTokenResponse);
  const clearSession = useAuthStore((state) => state.clearSession);

  const requiresBackendSession = backendVerifiedModes.has(mode);

  // Nos modos de produção, o acesso depende de um token verificado pelo backend —
  // nunca do currentUser persistido no navegador (que é editável). Sem token, tentamos
  // uma renovação silenciosa via cookie HttpOnly; enquanto isso, nada protegido é renderizado.
  const [status, setStatus] = useState<VerificationStatus>(
    !requiresBackendSession || token ? 'ready' : 'checking'
  );

  useEffect(() => {
    if (!requiresBackendSession || token) {
      setStatus('ready');
      return;
    }

    let active = true;
    setStatus('checking');

    refreshSession()
      .then((tokens) => {
        if (!active) return;
        applyTokenResponse(tokens);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        clearSession();
        setStatus('denied');
      });

    return () => {
      active = false;
    };
  }, [requiresBackendSession, token, applyTokenResponse, clearSession]);

  // Modos locais (development/disabled): gate simples pelo currentUser em memória.
  if (!requiresBackendSession) {
    if (mode !== 'disabled' && !currentUser) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
  }

  // Modos de produção: enquanto a sessão não é confirmada, exibe apenas um carregador neutro.
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Sem token verificado pelo backend, redireciona para o login sem renderizar telas.
  if (status === 'denied' || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
