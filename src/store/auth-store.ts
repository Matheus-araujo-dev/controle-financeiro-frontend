import { create } from 'zustand';
import type { AuthMode, AuthUser } from '../types/auth';

type AuthState = {
  mode: AuthMode;
  currentUser: AuthUser | null;
  setMode: (mode: AuthMode) => void;
  signIn: (user: AuthUser) => void;
  clearSession: () => void;
};

const initialMode = (import.meta.env.VITE_AUTH_MODE as AuthMode | undefined) ?? 'disabled';

export const useAuthStore = create<AuthState>((set) => ({
  mode: initialMode,
  currentUser: null,
  setMode: (mode) => set({ mode }),
  signIn: (currentUser) => set({ currentUser }),
  clearSession: () => set({ currentUser: null })
}));
