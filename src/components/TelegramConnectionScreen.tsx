import type { ReactNode } from 'react';

interface TelegramConnectionScreenProps {
  status: 'idle' | 'loading' | 'error';
  isInTelegram: boolean;
  children?: ReactNode;
}

export function TelegramConnectionScreen({
  status,
  isInTelegram,
}: TelegramConnectionScreenProps) {
  const isLoading = status === 'loading';
  const title = isLoading
    ? 'Подключаем остров'
    : status === 'error'
      ? 'Не удалось подключиться'
      : 'Откройте AFTERZERO в Telegram';
  const description = isLoading
    ? 'Проверяем Telegram и загружаем сохранённый мир…'
    : status === 'error'
      ? 'Сервер не подтвердил вход или не загрузил игровой мир. Проверьте подключение и попробуйте ещё раз.'
      : isInTelegram
        ? 'Telegram не передал данные авторизации. Закройте мини-приложение и откройте его снова из меню бота.'
        : 'Для авторизации и сохранения прогресса откройте мини-приложение через кнопку бота, а не в обычной вкладке браузера.';

  return (
    <main
      style={{
        alignItems: 'center',
        background: '#020814',
        color: '#e8f1ff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Nunito', sans-serif",
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          alignItems: 'center',
          border: '1px solid rgba(85, 230, 210, 0.3)',
          borderRadius: 24,
          color: '#55e6d2',
          display: 'flex',
          fontSize: 34,
          height: 76,
          justifyContent: 'center',
          marginBottom: 24,
          width: 76,
        }}
      >
        {isLoading ? '◌' : '✦'}
      </div>
      <p
        style={{
          color: '#55e6d2',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: 2,
          marginBottom: 10,
        }}
      >
        AFTERZERO
      </p>
      <h1 style={{ fontSize: 24, lineHeight: 1.2, marginBottom: 12 }}>
        {title}
      </h1>
      <p
        style={{
          color: '#91a3bd',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
          maxWidth: 340,
        }}
      >
        {description}
      </p>
      {status === 'error' && (
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#55e6d2',
            border: 0,
            borderRadius: 12,
            color: '#020814',
            cursor: 'pointer',
            font: 'inherit',
            fontWeight: 800,
            padding: '12px 20px',
          }}
          type="button"
        >
          Повторить подключение
        </button>
      )}
    </main>
  );
}
