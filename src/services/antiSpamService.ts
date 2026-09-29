import type { Bill } from '../types/bill';

const COOLDOWN_SECONDS = 120; // 2 minutes cooldown between publishing
const MAX_ACTIVE_UNDER_REVIEW = 3; // Max pending bills per non-official citizen
const SPAM_STORAGE_KEY_PREFIX = 'legaldraft_spam_cooldown_';

export interface AntiSpamValidationResult {
  isValid: boolean;
  error?: string;
  field?: 'title' | 'explanatoryNote' | 'comparisons' | 'cooldown' | 'quota' | 'duplicate';
}

/**
 * Normalizes text for comparison and fingerprinting
 */
function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

/**
 * Validates a bill before publishing to ensure it is not an empty spam submission.
 */
export function validateBillForPublishing(bill: Bill): AntiSpamValidationResult {
  // 1. Title Validation
  const trimmedTitle = bill.title.trim();
  const lowerTitle = trimmedTitle.toLowerCase();
  
  if (!trimmedTitle || trimmedTitle.length < 6) {
    return {
      isValid: false,
      field: 'title',
      error: 'Название законопроекта слишком короткое. Укажите понятную суть нормативно-правового акта (минимум 6 символов).'
    };
  }

  const defaultTitles = [
    'новый законопроект',
    'без названия',
    'проект',
    'законопроект',
    'draft',
    'о внесении изменений в законы штата',
    'о внесении изменений в закон',
    'о внесении изменений',
    'test',
    'тест',
    '123'
  ];
  if (defaultTitles.includes(lowerTitle)) {
    return {
      isValid: false,
      field: 'title',
      error: 'Пожалуйста, укажите суть инициативы в поле «Наименование законопроекта» (например: О внесении изменений в ' + (bill.targetLaw || 'закон') + ').'
    };
  }

  // 2. Explanatory Note Validation
  const trimmedNote = bill.explanatoryNote.trim();
  const lowerNote = trimmedNote.toLowerCase();

  if (!trimmedNote || trimmedNote.length < 15) {
    return {
      isValid: false,
      field: 'explanatoryNote',
      error: 'Пояснительная записка должна содержать обоснование необходимости поправок (минимум 15 символов).'
    };
  }

  if (
    lowerNote.includes('пояснительный комментарий к законопроекту') ||
    lowerNote.includes('пояснительный комментарий') ||
    lowerNote === 'пояснительная записка' ||
    lowerNote === 'описание' ||
    lowerNote === 'тест' ||
    lowerNote === 'test'
  ) {
    return {
      isValid: false,
      field: 'explanatoryNote',
      error: 'Пожалуйста, заполните реальное обоснование законопроекта вместо шаблонного текста «Пояснительный комментарий...».'
    };
  }

  // 3. Total Reform Check
  if (bill.isTotalReform) {
    if (!bill.totalReformContent || bill.totalReformContent.trim().length < 30) {
      return {
        isValid: false,
        field: 'comparisons',
        error: 'В режиме Общей реформы необходимо предоставить полный текст новой редакции закона (минимум 30 символов).'
      };
    }
    return { isValid: true };
  }

  // 4. Articles / Comparisons Check
  if (!bill.comparisons || bill.comparisons.length === 0) {
    return {
      isValid: false,
      field: 'comparisons',
      error: 'Законопроект должен содержать хотя бы одну предлагаемую статью для изменения.'
    };
  }

  for (let i = 0; i < bill.comparisons.length; i++) {
    const comp = bill.comparisons[i];
    const artNum = comp.articleTitle.trim();
    const became = comp.becameContent.trim();
    const was = comp.wasContent.trim();

    if (!artNum) {
      return {
        isValid: false,
        field: 'comparisons',
        error: `В пункте #${i + 1} не указан номер или название статьи.`
      };
    }

    if (!became) {
      return {
        isValid: false,
        field: 'comparisons',
        error: `В статье «${artNum}» не заполнена предлагаемая редакция («Стало»).`
      };
    }

    // Check placeholder in becameContent
    if (became.toLowerCase().includes('проектируемая редакция статьи со всеми изменениями')) {
      return {
        isValid: false,
        field: 'comparisons',
        error: `В статье «${artNum}» остался шаблонный текст «Проектируемая редакция статьи...». Заполните реальный текст нормы.`
      };
    }

    // Check if became is identical to was
    if (was && normalizeText(was) === normalizeText(became)) {
      return {
        isValid: false,
        field: 'comparisons',
        error: `В статье «${artNum}» предлагаемая редакция («Стало») полностью совпадает с («Было»). Внесите реальные поправки или удалите нетронутую статью.`
      };
    }
  }

  return { isValid: true };
}

/**
 * Checks whether a bill looks like a zero-effort spam/placeholder flood submission.
 */
export function isSuspectedSpamBill(bill: Bill): boolean {
  if (!bill) return false;
  const title = (bill.title || '').trim().toLowerCase();
  const note = (bill.explanatoryNote || '').trim().toLowerCase();

  const isDefaultTitle = title === 'о внесении изменений в законы штата' || title === 'новый законопроект' || title === 'без названия';
  const isDefaultNote = note.includes('пояснительный комментарий к законопроекту') || note.length < 10;
  
  const hasOnlyDefaultArticles = (bill.comparisons || []).every(c => 
    c.becameContent.toLowerCase().includes('проектируемая редакция') ||
    c.wasContent.toLowerCase().includes('действующая редакция')
  );

  return isDefaultTitle && (isDefaultNote || hasOnlyDefaultArticles);
}

/**
 * Checks if the author has exceeded the maximum allowed number of active (pending) bills.
 */
export function checkAuthorQuota(
  authorName: string,
  existingBills: Bill[],
  isOfficial: boolean
): { allowed: boolean; message?: string } {
  if (isOfficial) return { allowed: true }; // Officials and Admins exempt from citizen quotas

  const cleanAuthor = authorName.trim().toLowerCase();
  if (!cleanAuthor) return { allowed: true };

  const pendingBills = existingBills.filter((b) => {
    const isSameAuthor = b.author && b.author.trim().toLowerCase() === cleanAuthor;
    return isSameAuthor && b.status === 'under_review';
  });

  if (pendingBills.length >= MAX_ACTIVE_UNDER_REVIEW) {
    return {
      allowed: false,
      message: `Анти-спам лимит: у вас уже находится ${pendingBills.length} законопроектов на рассмотрении Законодательной Комиссии. Пожалуйста, дождитесь голосования по предыдущим актам перед подачей новых.`
    };
  }

  return { allowed: true };
}

/**
 * Checks cooldown timer since last bill published by this author.
 */
export function checkPublishCooldown(authorName: string, isOfficial: boolean): { allowed: boolean; remainingSeconds?: number } {
  if (isOfficial) return { allowed: true };

  if (typeof window === 'undefined' || !window.localStorage) {
    return { allowed: true };
  }

  const cleanAuthor = authorName.trim().toLowerCase();
  const key = SPAM_STORAGE_KEY_PREFIX + cleanAuthor;
  const lastTimeStr = localStorage.getItem(key);

  if (lastTimeStr) {
    const lastTime = parseInt(lastTimeStr, 10);
    const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const remaining = COOLDOWN_SECONDS - elapsedSeconds;
      return {
        allowed: false,
        remainingSeconds: remaining
      };
    }
  }

  return { allowed: true };
}

/**
 * Records that the author just published a bill, activating the cooldown.
 */
export function recordPublishTimestamp(authorName: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const cleanAuthor = authorName.trim().toLowerCase();
  const key = SPAM_STORAGE_KEY_PREFIX + cleanAuthor;
  localStorage.setItem(key, Date.now().toString());
}

/**
 * Checks if this bill is an identical duplicate of another bill already published by the same author.
 */
export function checkDuplicateBill(bill: Bill, existingBills: Bill[]): { isDuplicate: boolean; duplicateBillId?: string } {
  const cleanAuthor = (bill.author || '').trim().toLowerCase();
  const currentTitleNorm = normalizeText(bill.title);
  const currentNoteNorm = normalizeText(bill.explanatoryNote);
  const currentArticlesNorm = (bill.comparisons || [])
    .map((c) => normalizeText(c.articleTitle) + ':' + normalizeText(c.becameContent))
    .join('|');

  for (const other of existingBills) {
    if (other.id === bill.id) continue;
    const otherAuthor = (other.author || '').trim().toLowerCase();
    if (otherAuthor !== cleanAuthor) continue;

    const otherTitleNorm = normalizeText(other.title);
    const otherNoteNorm = normalizeText(other.explanatoryNote);
    const otherArticlesNorm = (other.comparisons || [])
      .map((c) => normalizeText(c.articleTitle) + ':' + normalizeText(c.becameContent))
      .join('|');

    if (
      currentTitleNorm === otherTitleNorm &&
      (currentNoteNorm === otherNoteNorm || currentArticlesNorm === otherArticlesNorm)
    ) {
      return { isDuplicate: true, duplicateBillId: other.id };
    }
  }

  return { isDuplicate: false };
}
