import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GraphicsQuality = 'auto' | 'quality' | 'balanced' | 'battery';
export type WorldVisibility = 'public' | 'contacts' | 'invite';
export type AppLanguage = 'ru' | 'en';

interface SettingsState {
  language: AppLanguage;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  readableText: boolean;
  graphicsQuality: GraphicsQuality;
  worldVisibility: WorldVisibility;
  buildNotifications: boolean;
  dailyNotifications: boolean;
  socialNotifications: boolean;
  setLanguage: (language: AppLanguage) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setWorldVisibility: (visibility: WorldVisibility) => void;
  resetPreferences: () => void;
  toggle: (
    key:
      | 'soundEnabled'
      | 'musicEnabled'
      | 'hapticsEnabled'
      | 'reducedMotion'
      | 'highContrast'
      | 'readableText'
      | 'buildNotifications'
      | 'dailyNotifications'
      | 'socialNotifications',
  ) => void;
}

const DEFAULT_SETTINGS = {
  language: 'ru' as AppLanguage,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  highContrast: false,
  readableText: false,
  graphicsQuality: 'auto' as GraphicsQuality,
  worldVisibility: 'contacts' as WorldVisibility,
  buildNotifications: true,
  dailyNotifications: false,
  socialNotifications: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setLanguage: (language) => set({ language }),
      setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
      setWorldVisibility: (worldVisibility) => set({ worldVisibility }),
      resetPreferences: () => set(DEFAULT_SETTINGS),
      toggle: (key) => set((state) => ({ [key]: !state[key] })),
    }),
    {
      name: 'afterzero-settings-v1',
    },
  ),
);
