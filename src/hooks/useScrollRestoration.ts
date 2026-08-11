import { useEffect, useRef } from 'react';

interface ScrollRestorationOptions {
  /**
   * Уникальный идентификатор текущей страницы или роута (pathname / key).
   */
  routeKey: string;
  /**
   * Задержка в миллисекундах перед восстановлением скролла,
   * чтобы дать динамическому контенту отрендериться.
   * @default 50
   */
  delayMs?: number;
  /**
   * Флаг готовности контента (например, завершение загрузки данных из API).
   * @default true
   */
  isReady?: boolean;
}

const STORAGE_PREFIX = 'scroll_pos_';

/**
 * Кастомный React-хук для точного сохранения и восстановления позиции скролла
 * при переходе назад/вперед в браузере или между роутами.
 */
export function useScrollRestoration({
  routeKey,
  delayMs = 50,
  isReady = true
}: ScrollRestorationOptions): void {
  const isRestoredRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Отключаем автоматическое дефолтное поведение браузера
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const storageKey = `${STORAGE_PREFIX}${routeKey}`;

    // 2. Функция сохранения текущей позиции скролла
    const saveScrollPosition = (): void => {
      const currentY = window.scrollY;
      try {
        sessionStorage.setItem(storageKey, String(currentY));
      } catch (error) {
        console.warn('Не удалось сохранить позицию скролла в sessionStorage:', error);
      }
    };

    // 3. Обработчик события скролла с Throttle/Debounce при помощи requestAnimationFrame
    let rafId: number | null = null;
    const handleScroll = (): void => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        saveScrollPosition();
        rafId = null;
      });
    };

    // Подписываемся на скролл и перед закрытием/перезагрузкой вкладки
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', saveScrollPosition);

    // 4. Восстановление позиции скролла при готовности контента
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (isReady && !isRestoredRef.current) {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (savedPosition !== null) {
        const targetY = parseInt(savedPosition, 10);
        if (!isNaN(targetY) && targetY > 0) {
          timerId = setTimeout(() => {
            window.scrollTo({
              top: targetY,
              behavior: 'instant' as ScrollBehavior
            });
            isRestoredRef.current = true;
          }, delayMs);
        }
      }
    }

    // 5. Очистка (cleanup) обработчиков событий и таймеров при размонтировании
    return () => {
      saveScrollPosition();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', saveScrollPosition);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [routeKey, delayMs, isReady]);
}
