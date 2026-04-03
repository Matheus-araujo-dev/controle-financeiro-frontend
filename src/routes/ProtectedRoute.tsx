import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const mode = useAuthStore((state) => state.mode);
  const currentUser = useAuthStore((state) => state.currentUser);

  if (mode !== 'disabled' && !currentUser) {
    return <Navigate to="/acesso-negado" replace state={{ from: location.pathname }} />;
  }

  return children;
}
