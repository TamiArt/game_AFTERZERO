import { lazy, Suspense, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LevelUpModal } from './components/LevelUpModal';
import { Toast } from './components/Toast';
import { TelegramConnectionScreen } from './components/TelegramConnectionScreen';
import { useTelegram } from './hooks/useTelegram';
import { useBackendSession } from './hooks/useBackendSession';
import { useAuthoritativeGame } from './hooks/useAuthoritativeGame';
import { useGameStore } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { AmbientBackdrop } from './components/AmbientBackdrop';

const SettingsScreen = lazy(() =>
  import('./components/SettingsScreen').then((module) => ({
    default: module.SettingsScreen,
  })),
);
const WorldScreen = lazy(() =>
  import('./components/WorldScreen').then((module) => ({
    default: module.WorldScreen,
  })),
);
const ExploreScreen = lazy(() =>
  import('./components/ExploreScreen').then((module) => ({
    default: module.ExploreScreen,
  })),
);
const CollectionScreen = lazy(() =>
  import('./components/CollectionScreen').then((module) => ({
    default: module.CollectionScreen,
  })),
);
const PetScreen = lazy(() =>
  import('./components/PetScreen').then((module) => ({
    default: module.PetScreen,
  })),
);
const SocialScreen = lazy(() =>
  import('./components/SocialScreen').then((module) => ({
    default: module.SocialScreen,
  })),
);
const ShopScreen = lazy(() =>
  import('./components/ShopScreen').then((module) => ({
    default: module.ShopScreen,
  })),
);

function ScreenLoading() {
  return (
    <div className="settings-loading">
      <span className="settings-loading__pulse" />
      Синхронизация мира
    </div>
  );
}

export type Tab = 'world' | 'explore' | 'collection' | 'pet' | 'social' | 'shop';

export default function App() {
  const [tab, setTab] = useState<Tab>('world');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, initData, isReady, isInTelegram } = useTelegram();
  const backendSession = useBackendSession(initData, isReady);

  const onboardingDone = useGameStore((s) => s?.onboardingDone ?? false);
  const levelUpPending = useGameStore((s) => s?.levelUpPending ?? null);
  const setPlayerName = useGameStore((s) => s?.setPlayerName ?? (() => {}));
  const addToast = useGameStore((s) => s?.addToast ?? (() => {}));
  const { claimProduction } = useAuthoritativeGame();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const readableText = useSettingsStore((s) => s.readableText);
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';
    root.dataset.contrast = highContrast ? 'high' : 'standard';
    root.dataset.text = readableText ? 'readable' : 'standard';
    root.dataset.graphics = graphicsQuality;
  }, [graphicsQuality, highContrast, language, readableText, reducedMotion]);

  useEffect(() => {
    if (isReady && user?.first_name) {
      setPlayerName(user.first_name);
    }
  }, [isReady, user, setPlayerName]);

  useEffect(() => {
    if (isReady && onboardingDone) {
      const timer = setTimeout(() => {
        addToast('С возвращением на остров! 👋', '🏝️', '#00e5d0');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      backendSession.status !== 'authenticated' &&
      backendSession.status !== 'disabled'
    ) {
      return;
    }

    const id = setInterval(() => {
      claimProduction();
    }, 30_000);
    return () => clearInterval(id);
  }, [backendSession.status, claimProduction]);

  if (
    backendSession.status !== 'disabled' &&
    backendSession.status !== 'authenticated'
  ) {
    return (
      <TelegramConnectionScreen
        isInTelegram={isInTelegram}
        status={backendSession.status}
      />
    );
  }

  return (
    <div className="app-shell">
      <AmbientBackdrop />

      {!settingsOpen && <TopBar onOpenSettings={() => setSettingsOpen(true)} />}

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Toast />

        {settingsOpen ? (
          <Suspense
            fallback={
              <div className="settings-loading">
                <span className="settings-loading__pulse" />
                Загрузка настроек
              </div>
            }
          >
            <SettingsScreen onBack={() => setSettingsOpen(false)} />
          </Suspense>
        ) : (
          <Suspense fallback={<ScreenLoading />}>
            {tab === 'world' && <WorldScreen />}
            {tab === 'explore' && <ExploreScreen />}
            {tab === 'collection' && <CollectionScreen />}
            {tab === 'pet' && <PetScreen />}
            {tab === 'social' && <SocialScreen />}
            {tab === 'shop' && <ShopScreen />}
          </Suspense>
        )}

        {!settingsOpen && !onboardingDone && <OnboardingScreen />}
        {!settingsOpen && levelUpPending && <LevelUpModal />}
      </main>

      {!settingsOpen && <BottomNav active={tab} onChange={setTab} />}
    </div>
  );
}
