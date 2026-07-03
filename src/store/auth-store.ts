import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthMode, AuthTokenResponse, AuthUser } from '../types/auth';

type AuthState = {
  mode: AuthMode;
  currentUser: AuthUser | null;
  token: string | null;
  permissions: string[];
  setMode: (mode: AuthMode) => void;
  signIn: (user: AuthUser) => void;
  applyTokenResponse: (response: AuthTokenResponse) => void;
  setToken: (token: string | null) => void;
  setPermissions: (permissions: string[]) => void;
  clearSession: () => void;
};

const initialMode = (import.meta.env.VITE_AUTH_MODE as AuthMode | undefined) ?? 'development';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      mode: initialMode,
      currentUser: null,
      token: null,
      permissions: [],
      setMode: (mode) => set({ mode }),
      signIn: (currentUser) => set({ currentUser }),
      applyTokenResponse: (response) => {
        const workspace = response.usuario.workspace ?? response.usuario.familia ?? null;

        set({
          token: response.accessToken,
          currentUser: {
            userId: response.usuario.id,
            displayName: response.usuario.nome,
            email: response.usuario.email,
            avatarUrl: response.usuario.avatarUrl,
workspace: response.usuario.workspace ?? response.usuario.familia,
            familia: response.usuario.familia ?? response.usuario.workspace
          }
        });
      },
      setToken: (token) => set({ token }),
      setPermissions: (permissions) => set({ permissions }),
      clearSession: () => set({ currentUser: null, token: null, permissions: [] })
    }),
    {
      name: 'controle-financeiro-auth',
      partialize: (state) => ({
        currentUser: state.currentUser
      })
    }
  )
);

export const useAuthMode = () => useAuthStore((state) => state.mode);
export const useCurrentUser = () => useAuthStore((state) => state.currentUser);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.currentUser);
export const useWorkspaceAtual = () => useAuthStore((state) => state.currentUser?.workspace ?? state.currentUser?.familia ?? null);
export const useFamiliaAtual = () => useAuthStore((state) => state.currentUser?.familia ?? null);
