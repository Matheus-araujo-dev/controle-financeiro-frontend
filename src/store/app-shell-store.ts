import { create } from 'zustand';

type AppShellState = {
  collapsed: boolean;
  pageTitle: string;
  setCollapsed: (value: boolean) => void;
  setPageTitle: (value: string) => void;
};

export const useAppShellStore = create<AppShellState>((set) => ({
  collapsed: false,
  pageTitle: 'Dashboard',
  setCollapsed: (collapsed) => set({ collapsed }),
  setPageTitle: (pageTitle) => set({ pageTitle })
}));
