import { useState, type ReactNode } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  useSettingsStore,
  type GraphicsQuality,
  type WorldVisibility,
} from '../store/settingsStore';
import { GameIcon, type GameIconName } from './ui/GameIcon';

interface SettingsScreenProps {
  onBack: () => void;
}

interface SettingRowProps {
  description: string;
  label: string;
  control: ReactNode;
}

function SettingRow({ description, label, control }: SettingRowProps) {
  return (
    <div className="setting-row">
      <div className="setting-row__copy">
        <div className="setting-row__label">{label}</div>
        <div className="setting-row__description">{description}</div>
      </div>
      {control}
    </div>
  );
}

function SettingsToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle ${checked ? 'settings-toggle--active' : ''}`}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

function SettingsSection({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: GameIconName;
  title: string;
}) {
  return (
    <section className="settings-section">
      <div className="settings-section__title">
        <span className="settings-section__icon">
          <GameIcon name={icon} size={17} />
        </span>
        {title}
      </div>
      <div className="settings-section__body">{children}</div>
    </section>
  );
}

function ChoiceGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <div aria-label={label} className="choice-group" role="radiogroup">
      {options.map((option) => (
        <button
          aria-checked={value === option.value}
          className={`choice-group__item ${
            value === option.value ? 'choice-group__item--active' : ''
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const playerName = useGameStore((state) => state.playerName);
  const level = useGameStore((state) => state.level);
  const backendConnected = useGameStore((state) => state.backendConnected);
  const settings = useSettingsStore();

  const toggle = (key: Parameters<typeof settings.toggle>[0]) => {
    settings.toggle(key);
    if (settings.hapticsEnabled) {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.();
    }
  };

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button
          aria-label="Вернуться назад"
          className="icon-button"
          onClick={onBack}
          type="button"
        >
          <GameIcon name="back" size={22} />
        </button>
        <div>
          <div className="settings-header__eyebrow">СИСТЕМА МИРА</div>
          <h1 className="settings-header__title">Настройки</h1>
        </div>
        <div className="settings-header__signal" title="Состояние синхронизации">
          <span className={backendConnected ? 'status-dot status-dot--online' : 'status-dot'} />
          {backendConnected ? 'SYNC' : 'LOCAL'}
        </div>
      </header>

      <div className="settings-profile">
        <div className="settings-profile__avatar">{playerName.slice(0, 1).toUpperCase()}</div>
        <div className="settings-profile__copy">
          <div className="settings-profile__name">{playerName}</div>
          <div className="settings-profile__meta">
            Исследователь · Уровень {level}
          </div>
        </div>
        <div className="settings-profile__badge">AFTERZERO</div>
      </div>

      <SettingsSection icon="audio" title="Звук и отклик">
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.musicEnabled}
              label="Фоновая музыка"
              onChange={() => toggle('musicEnabled')}
            />
          }
          description="Атмосфера острова и музыкальные темы"
          label="Музыка"
        />
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.soundEnabled}
              label="Звуковые эффекты"
              onChange={() => toggle('soundEnabled')}
            />
          }
          description="Сбор ресурсов, открытия и интерфейс"
          label="Звуковые эффекты"
        />
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.hapticsEnabled}
              label="Тактильный отклик"
              onChange={() => toggle('hapticsEnabled')}
            />
          }
          description="Мягкая вибрация для важных действий"
          label="Тактильный отклик"
        />
      </SettingsSection>

      <SettingsSection icon="visual" title="Графика и доступность">
        <div className="settings-choice">
          <div className="settings-choice__label">Качество графики</div>
          <ChoiceGroup<GraphicsQuality>
            label="Качество графики"
            onChange={settings.setGraphicsQuality}
            options={[
              { value: 'auto', label: 'Авто' },
              { value: 'quality', label: 'Детально' },
              { value: 'balanced', label: 'Баланс' },
              { value: 'battery', label: 'Экономия' },
            ]}
            value={settings.graphicsQuality}
          />
        </div>
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.reducedMotion}
              label="Уменьшение движения"
              onChange={() => toggle('reducedMotion')}
            />
          }
          description="Отключает частицы и декоративные анимации"
          label="Уменьшение движения"
        />
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.highContrast}
              label="Высокий контраст"
              onChange={() => toggle('highContrast')}
            />
          }
          description="Усиливает границы и читаемость элементов"
          label="Высокий контраст"
        />
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.readableText}
              label="Крупный текст"
              onChange={() => toggle('readableText')}
            />
          }
          description="Немного увеличивает основной текст"
          label="Крупный текст"
        />
      </SettingsSection>

      <SettingsSection icon="privacy" title="Приватность мира">
        <div className="settings-choice settings-choice--spacious">
          <div className="settings-choice__label">Кто может посещать остров</div>
          <ChoiceGroup<WorldVisibility>
            label="Видимость мира"
            onChange={settings.setWorldVisibility}
            options={[
              { value: 'public', label: 'Все' },
              { value: 'contacts', label: 'Контакты' },
              { value: 'invite', label: 'По приглашению' },
            ]}
            value={settings.worldVisibility}
          />
          <p className="settings-choice__hint">
            Изменение будет применяться к новым визитам.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection icon="bell" title="Уведомления">
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.buildNotifications}
              label="Завершение строительства"
              onChange={() => toggle('buildNotifications')}
            />
          }
          description="Сообщать, когда объект готов"
          label="Строительство"
        />
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.dailyNotifications}
              label="Спокойное напоминание"
              onChange={() => toggle('dailyNotifications')}
            />
          }
          description="Не чаще одного напоминания в день"
          label="Спокойное напоминание"
        />
        <SettingRow
          control={
            <SettingsToggle
              checked={settings.socialNotifications}
              label="События контактов"
              onChange={() => toggle('socialNotifications')}
            />
          }
          description="Приглашения и совместные проекты"
          label="События сети"
        />
      </SettingsSection>

      <SettingsSection icon="help" title="Язык и помощь">
        <SettingRow
          control={
            <ChoiceGroup<'ru' | 'en'>
              label="Язык"
              onChange={settings.setLanguage}
              options={[
                { value: 'ru', label: 'RU' },
                { value: 'en', label: 'EN β' },
              ]}
              value={settings.language}
            />
          }
          description="English находится в режиме предварительного просмотра"
          label="Язык интерфейса"
        />
        <div className="settings-link-row">
          <span>Центр помощи</span>
          <span className="settings-link-row__meta">Скоро</span>
        </div>
        <div className="settings-link-row">
          <span>Версия приложения</span>
          <span className="settings-link-row__meta">0.4.0</span>
        </div>
      </SettingsSection>

      <SettingsSection icon="account" title="Данные приложения">
        {confirmReset ? (
          <div className="settings-confirm">
            <p>Вернуть визуальные и системные настройки по умолчанию?</p>
            <div className="settings-confirm__actions">
              <button
                className="text-button"
                onClick={() => setConfirmReset(false)}
                type="button"
              >
                Отмена
              </button>
              <button
                className="text-button text-button--danger"
                onClick={() => {
                  settings.resetPreferences();
                  setConfirmReset(false);
                }}
                type="button"
              >
                Сбросить
              </button>
            </div>
          </div>
        ) : (
          <button
            className="settings-reset"
            onClick={() => setConfirmReset(true)}
            type="button"
          >
            Сбросить настройки интерфейса
          </button>
        )}
        <p className="settings-legal">
          Удаление аккаунта и экспорт данных появятся после подключения
          production-профиля. Игровой прогресс этим действием не затрагивается.
        </p>
      </SettingsSection>
    </div>
  );
}
