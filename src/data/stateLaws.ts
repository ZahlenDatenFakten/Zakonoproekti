export interface StateLawArticle {
  id: string;
  articleNumber: string;
  title: string;
  content: string;
  chapterRef?: string;
}

export interface StateLaw {
  id: string;
  title: string;
  code: string;
  category: string;
  forumUrl?: string;
  articles: StateLawArticle[];
  crossReferences?: string[];
}

export const INITIAL_STATE_LAWS: StateLaw[] = [];

export const STATE_LAWS_KEY = 'legaldraft_custom_state_laws_v1';

export function getAllStateLaws(): StateLaw[] {
  const saved = localStorage.getItem(STATE_LAWS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return INITIAL_STATE_LAWS;
}

export function saveCustomStateLaw(newLaw: StateLaw): StateLaw[] {
  const saved = localStorage.getItem(STATE_LAWS_KEY);
  let customLaws: StateLaw[] = [];
  if (saved) {
    try {
      customLaws = JSON.parse(saved);
    } catch {
      customLaws = [];
    }
  }

  const existingIdx = customLaws.findIndex((l) => l.id === newLaw.id);
  if (existingIdx >= 0) {
    customLaws[existingIdx] = newLaw;
  } else {
    customLaws.push(newLaw);
  }

  localStorage.setItem(STATE_LAWS_KEY, JSON.stringify(customLaws));
  return getAllStateLaws();
}

export function resetCustomStateLaws(): StateLaw[] {
  localStorage.setItem(STATE_LAWS_KEY, JSON.stringify([]));
  return [];
}

export function clearAllStateLaws(): StateLaw[] {
  localStorage.setItem(STATE_LAWS_KEY, JSON.stringify([]));
  return [];
}
