import type { StateLawDocument, LawArticle, LawPatchResult } from '../types/lawAst';
import type { Bill, ComparisonRow } from '../types/bill';
import { COMPILED_LAWS_REGISTRY } from '../data/compiledLawsRegistry';
import { compileArticleBBCode, compileFullLawBBCode, compileLawPartBBCode } from './bbcodeCompiler';

const LAW_STORAGE_PREFIX = 'legaldraft_law_doc_';

/**
 * Normalizes article titles like "Статья 9.1.", "ст. 9.1", "9.1 " -> "9.1"
 */
export function extractArticleNumber(title: string): string {
  if (!title) return '';
  const match = title.match(/(?:ст(?:атья|\.)?\s*)?([0-9]+(?:\.[0-9]+)*)/i);
  if (match) {
    return match[1];
  }
  return title.replace(/^статья\s+/i, '').replace(/[\.:]$/, '').trim();
}

/**
 * Alias dictionary for instant fuzzy matching of law titles and abbreviations
 */
const LAW_ALIAS_MAP: Record<string, string> = {
  // Codes
  'дорожный': 'road_code',
  'дорожный кодекс': 'road_code',
  'дк': 'road_code',
  'уголовный': 'criminal_code',
  'уголовно-административный': 'criminal_code',
  'уголовный кодекс': 'criminal_code',
  'уак': 'criminal_code',
  'ук': 'criminal_code',
  'процессуальный': 'procedural_code',
  'процессуальный кодекс': 'procedural_code',
  'пк': 'procedural_code',
  'судебный': 'judicial_code',
  'судебный кодекс': 'judicial_code',
  'ск': 'judicial_code',
  'трудовой': 'labor_code',
  'трудовой кодекс': 'labor_code',
  'тк': 'labor_code',
  'этический': 'ethical_code',
  'этический кодекс': 'ethical_code',
  'эк': 'ethical_code',
  'конституция': 'constitution',

  // Security / Law Enforcement
  'fib': 'law_fib',
  'фиб': 'law_fib',
  'расследовательского': 'law_fib',
  'sang': 'law_sang',
  'санг': 'law_sang',
  'нацгвардия': 'law_sang',
  'гвардия': 'law_sang',
  'национальная гвардия': 'law_sang',
  'usss': 'law_usss',
  'юссс': 'law_usss',
  'секретная служба': 'law_usss',
  'lspd': 'law_police',
  'lssd': 'law_police',
  'полиция': 'law_police',
  'региональные правоохранительные': 'law_police',
  'fp': 'law_prison',
  'тюрьма': 'law_prison',
  'федеральная тюрьма': 'law_prison',

  // Government
  'правительство': 'law_government',
  'о правительстве': 'law_government',
  'минюст': 'law_prosecutor',
  'прокуратура': 'law_prosecutor',
  'генпрокурор': 'law_prosecutor',
  'прокурор': 'law_prosecutor',
  'минфин': 'law_finance',
  'финансы': 'law_finance',
  'министерство финансов': 'law_finance',
  'адвокаты': 'law_bar',
  'адвокатура': 'law_bar',
  'коллегия адвокатов': 'law_bar',
  'неприкосновенность': 'law_immunity',
  'закрытые территории': 'law_territories',
  'территории': 'law_territories',
  'взаимодействие': 'law_state_coop',
  'оружие': 'law_weapons',
  'оборот оружия': 'law_weapons',
  'здравоохранение': 'law_health',
  'медицина': 'law_health',
  'ems': 'law_health',
  'сми': 'law_media',
  'weazel': 'law_media',
  'гостайна': 'law_docs',
  'документация': 'law_docs',
  'дипломатические': 'law_diplomatic',
  'посольства': 'law_diplomatic',
  'партии': 'law_parties',
  'политические партии': 'law_parties',
  'бизнес': 'law_business',
  'чп': 'law_emergency',
  'вп': 'law_emergency',
  'чрезвычайн': 'law_emergency',
  'чрезвычайное': 'law_emergency',
  'чрезвычайное положение': 'law_emergency',
  'военное положение': 'law_emergency',
  'военном': 'law_emergency',
  'аренда': 'law_rent',
  'природа': 'law_nature',
  'природные ресурсы': 'law_nature',
  'награды': 'law_awards'
};

/**
 * Highly intelligent fuzzy law matcher.
 * Matches by ID, Code ("ДК", "УАК"), title, shortTitle, or natural keywords.
 */
export function findLawByTitleOrCode(query?: string): StateLawDocument | null {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();

  // 1. Direct ID match
  if (COMPILED_LAWS_REGISTRY[q]) {
    return getActiveLaw(q);
  }

  // 2. Check alias map
  for (const [alias, id] of Object.entries(LAW_ALIAS_MAP)) {
    if (q === alias || q.includes(alias) || alias.includes(q)) {
      return getActiveLaw(id);
    }
  }

  // 3. Match by Code or Title
  const allLaws = Object.values(COMPILED_LAWS_REGISTRY);
  const found = allLaws.find((law) => {
    return (
      law.code.toLowerCase() === q ||
      law.title.toLowerCase() === q ||
      law.shortTitle?.toLowerCase() === q ||
      law.title.toLowerCase().includes(q) ||
      q.includes(law.shortTitle?.toLowerCase() || '')
    );
  });

  return found ? getActiveLaw(found.id) : null;
}

/**
 * Gets all registered state laws, incorporating any local edits made by the user.
 */
export function getAllRegisteredLaws(): StateLawDocument[] {
  return Object.keys(COMPILED_LAWS_REGISTRY).map((id) => getActiveLaw(id));
}

/**
 * Gets the active law document from localStorage, falling back to compiled registry.
 */
export function getActiveLaw(lawId: string = 'road_code'): StateLawDocument {
  // If passed an alias/title instead of an ID, resolve first
  const normalizedId = COMPILED_LAWS_REGISTRY[lawId] ? lawId : (findLawByTitleOrCode(lawId)?.id || 'road_code');
  const key = LAW_STORAGE_PREFIX + normalizedId;

  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: StateLawDocument = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.chapters)) {
          // If the document is v1 (unmodified by bills), always sync with the latest clean compiled registry
          const base = COMPILED_LAWS_REGISTRY[normalizedId];
          if ((!parsed.version || parsed.version <= 1) && base) {
            localStorage.setItem(key, JSON.stringify(base));
            return base;
          }
          if (!parsed.activeBBCode) {
            parsed.activeBBCode = compileFullLawBBCode(parsed);
            localStorage.setItem(key, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch {
        // ignore parse error, fallback
      }
    }
  }

  // Fallback to pre-compiled registry
  const baseLaw = COMPILED_LAWS_REGISTRY[normalizedId] || COMPILED_LAWS_REGISTRY['road_code'];
  const fullBBCode = baseLaw.activeBBCode || compileFullLawBBCode(baseLaw);

  const defaultDoc: StateLawDocument = {
    ...baseLaw,
    activeBBCode: fullBBCode
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(defaultDoc));
    } catch {
      // quota or private mode safe
    }
  }

  return defaultDoc;
}

/**
 * Saves the law document and recompiles its master BB-code and parts.
 */
export function saveActiveLaw(law: StateLawDocument): StateLawDocument {
  const key = LAW_STORAGE_PREFIX + law.id;
  const fullBBCode = compileFullLawBBCode(law);

  const updatedDoc: StateLawDocument = {
    ...law,
    activeBBCode: fullBBCode,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, JSON.stringify(updatedDoc));
    window.dispatchEvent(new CustomEvent('legaldraft_law_updated', { detail: { lawId: law.id } }));
  }

  return updatedDoc;
}

/**
 * Resets the law to initial pristine edition from compiled registry.
 */
export function resetLawToDefault(lawId: string = 'road_code'): StateLawDocument {
  const normalizedId = COMPILED_LAWS_REGISTRY[lawId] ? lawId : (findLawByTitleOrCode(lawId)?.id || 'road_code');
  const key = LAW_STORAGE_PREFIX + normalizedId;

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }

  const baseLaw = COMPILED_LAWS_REGISTRY[normalizedId] || COMPILED_LAWS_REGISTRY['road_code'];
  const pristineDoc: StateLawDocument = {
    ...baseLaw,
    version: 1,
    updatedAt: new Date().toISOString(),
    activeBBCode: compileFullLawBBCode(baseLaw)
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, JSON.stringify(pristineDoc));
    window.dispatchEvent(new CustomEvent('legaldraft_law_updated', { detail: { lawId: normalizedId } }));
  }

  return pristineDoc;
}

/**
 * Compiles a specific part of a law for multi-post forum publishing.
 */
export function getLawPartBBCode(lawId: string, partIndex: number): string {
  const law = getActiveLaw(lawId);
  return compileLawPartBBCode(law, partIndex);
}

/**
 * Parses raw becameContent into title, content, exceptions, and sanctions.
 */
function parseRawArticleContent(
  raw: string,
  targetArtNum?: string,
  existingTitle?: string
): { title?: string; content: string; sanctionText?: string; exceptionText?: string } {
  let text = raw.trim();
  let sanctionText: string | undefined;
  let exceptionText: string | undefined;
  let parsedTitle: string | undefined = existingTitle;

  // 1. Strip redundant article number prefix if user typed "Статья 9.1.", "ст. 9.1:" or "9.1." inside becameContent
  if (targetArtNum) {
    const cleanNum = extractArticleNumber(targetArtNum);
    if (cleanNum) {
      const escaped = cleanNum.replace(/\./g, '\\.');
      const numRegex = new RegExp(`^(?:ст(?:атья|\\.)?\\s*)?${escaped}[\\.:\\s—–-]*`, 'i');
      text = text.replace(numRegex, '').trim();
    }
  } else {
    text = text.replace(/^(?:ст(?:атья|\\.)?\\s*)?([0-9]+(?:\.[0-9]+)*)[\\.:\\s—–-]*\\s*/i, '').trim();
  }

  // 2. Extract Title if present at the start of text
  // Pattern A: Title on separate first line: "Территориальная юрисдикция Секретной Службы\n⁃ На территории..."
  const lines = text.split(/\r?\n/);
  if (lines.length > 1) {
    const firstLine = lines[0].trim();
    const isBulletOrSentence = /^[-—⁃*#\d]/.test(firstLine) || /(?:признается|является|наказывается|имеет\s+право|влечет|обязан|запрещено|состоит|включает|может|подлежит|относится)/i.test(firstLine);
    if (!isBulletOrSentence && firstLine.length <= 80 && !firstLine.endsWith('.')) {
      parsedTitle = firstLine.replace(/[:]$/, '').trim();
      text = lines.slice(1).join('\n').trim();
    }
  }

  // Pattern B: Title inline with dot: "Agent Training Department (ATD). Сотрудники отдела..."
  if (!parsedTitle || parsedTitle === existingTitle) {
    const inlineMatch = text.match(/^([А-ЯЁA-Z][^.:\n]{2,60})[.:]\s+(.*)$/s);
    if (inlineMatch) {
      const candidate = inlineMatch[1].trim();
      const isSentence = /(?:признается|является|наказывается|имеет\s+право|влечет|обязан|запрещено|состоит|включает|может|подлежит|относится)/i.test(candidate);
      if (!isSentence) {
        parsedTitle = candidate;
        text = inlineMatch[2].trim();
      }
    }
  }

  // If text still starts with the title, strip it so it doesn't get duplicated in BBCode
  if (parsedTitle && text.startsWith(parsedTitle)) {
    text = text.substring(parsedTitle.length).replace(/^[:.\s—–-]+/, '').trim();
  }

  // 3. Sanction line (e.g. "- Штраф...")
  const sanctionMatch = text.match(/(?:^|\n)\s*[-—⁃]\s*(?:штраф|наказание|административный|лишение|изъятие)[^\n]*/i);
  if (sanctionMatch) {
    sanctionText = sanctionMatch[0].replace(/^[\n\s*[-—⁃]\s*/, '').trim();
    text = text.replace(sanctionMatch[0], '').trim();
  }

  // 4. Exception (e.g. "Исключение: ...")
  const exceptionMatch = text.match(/(?:^|\n)\s*исключение:\s*([^\n]+)/i);
  if (exceptionMatch) {
    const cand = exceptionMatch[1].trim();
    if (cand) {
      exceptionText = cand;
      text = text.replace(exceptionMatch[0], '').trim();
    }
  }

  return {
    title: parsedTitle,
    content: text,
    sanctionText,
    exceptionText
  };
}

/**
 * Patches a single state law document with the provided comparison amendments.
 */
function patchSingleLaw(
  lawId: string,
  comparisons: ComparisonRow[],
  bill: Bill,
  isTotalReform?: boolean,
  totalReformContent?: string
): LawPatchResult {
  const law = getActiveLaw(lawId);
  const affectedArticleNumbers: string[] = [];
  const articleBBCodes: Record<string, string> = {};
  const affectedParts = new Set<number>();

  // Clone chapters and articles
  const updatedChapters = law.chapters.map((ch) => ({
    ...ch,
    articles: ch.articles.map((a) => ({ ...a }))
  }));

  // Helper to find article across all chapters
  const findArticle = (artNum: string): { article: LawArticle; chapterIndex: number } | null => {
    const target = extractArticleNumber(artNum);
    for (let cIdx = 0; cIdx < updatedChapters.length; cIdx++) {
      const art = updatedChapters[cIdx].articles.find(
        (a) => extractArticleNumber(a.articleNumber) === target || a.articleNumber === target
      );
      if (art) return { article: art, chapterIndex: cIdx };
    }
    return null;
  };

  if (isTotalReform && totalReformContent) {
    // Total Law Reform - replace entire law text
    affectedArticleNumbers.push('Все статьи (Общая реформа закона)');
    const newVersion = (law.version || 1) + 1;
    const updatedDoc: StateLawDocument = {
      ...law,
      version: newVersion,
      activeBBCode: totalReformContent,
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LAW_STORAGE_PREFIX + law.id, JSON.stringify(updatedDoc));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      window.dispatchEvent(new CustomEvent('legaldraft_law_updated', { detail: { lawId: law.id } }));
    }

    return {
      updatedLaw: updatedDoc,
      affectedArticleNumbers,
      articleBBCodes: {},
      fullLawBBCode: totalReformContent,
      partBBCodes: {}
    };
  }

  if (comparisons && comparisons.length > 0) {
    for (const comp of comparisons) {
      if (!comp.becameContent || !comp.becameContent.trim()) continue;

      const num = extractArticleNumber(comp.articleTitle || '');
      if (!num) continue;

      const found = findArticle(num);
      const parsed = parseRawArticleContent(comp.becameContent, num, found?.article.title);

      if (found) {
        // Update existing article
        if (parsed.title) {
          found.article.title = parsed.title;
        }
        found.article.content = parsed.content;
        found.article.rawBBCode = undefined; // Force recompilation using forum theme
        found.article.updatedAt = new Date().toISOString();
        found.article.sourceBillId = bill.id;
        found.article.sanctions = parsed.sanctionText ? [{ id: 's_' + Date.now(), text: parsed.sanctionText }] : undefined;
        found.article.clauses = parsed.exceptionText
          ? [
              {
                id: 'c_' + Date.now(),
                prefix: 'Исключение:',
                content: parsed.exceptionText
              }
            ]
          : undefined;

        if (found.article.partIndex) {
          affectedParts.add(found.article.partIndex);
        }

        affectedArticleNumbers.push(found.article.articleNumber);
        articleBBCodes[found.article.articleNumber] = compileArticleBBCode(found.article);
      } else {
        // Create new article into the most suitable chapter
        const newArt: LawArticle = {
          id: 'art_' + num.replace(/\./g, '_') + '_' + Date.now(),
          articleNumber: num,
          title: parsed.title,
          content: parsed.content,
          updatedAt: new Date().toISOString(),
          sourceBillId: bill.id,
          sanctions: parsed.sanctionText ? [{ id: 's_' + Date.now(), text: parsed.sanctionText }] : undefined,
          clauses: parsed.exceptionText ? [{ id: 'c_' + Date.now(), prefix: 'Исключение:', content: parsed.exceptionText }] : undefined
        };

        const majorNum = parseInt(num.split('.')[0], 10);
        let targetChapter = updatedChapters.find((ch) => {
          return ch.articles.some((a) => parseInt(extractArticleNumber(a.articleNumber).split('.')[0], 10) === majorNum);
        });

        if (!targetChapter && updatedChapters.length > 0) {
          targetChapter = updatedChapters[updatedChapters.length - 1];
        }

        if (targetChapter) {
          if (targetChapter.partIndex) {
            newArt.partIndex = targetChapter.partIndex;
            affectedParts.add(targetChapter.partIndex);
          }
          targetChapter.articles.push(newArt);
          targetChapter.articles.sort((a, b) => {
            const nA = extractArticleNumber(a.articleNumber).split('.').map(Number);
            const nB = extractArticleNumber(b.articleNumber).split('.').map(Number);
            for (let i = 0; i < Math.max(nA.length, nB.length); i++) {
              const valA = nA[i] ?? 0;
              const valB = nB[i] ?? 0;
              if (valA !== valB) return valA - valB;
            }
            return 0;
          });
        }

        affectedArticleNumbers.push(num);
        articleBBCodes[num] = compileArticleBBCode(newArt);
      }
    }
  }

  // Increment version
  const newVersion = (law.version || 1) + 1;
  const updatedDoc: StateLawDocument = {
    ...law,
    chapters: updatedChapters,
    version: newVersion,
    updatedAt: new Date().toISOString()
  };

  // Compile master BB-code
  const fullLawBBCode = compileFullLawBBCode(updatedDoc);
  updatedDoc.activeBBCode = fullLawBBCode;

  // Compile part-specific BBCodes
  const partBBCodes: Record<number, string> = {};
  if (updatedDoc.partsMeta && updatedDoc.partsMeta.length > 0) {
    for (const part of updatedDoc.partsMeta) {
      partBBCodes[part.partIndex] = compileLawPartBBCode(updatedDoc, part.partIndex);
    }
  }

  // Persist to localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LAW_STORAGE_PREFIX + law.id, JSON.stringify(updatedDoc));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    window.dispatchEvent(new CustomEvent('legaldraft_law_updated', { detail: { lawId: law.id } }));
  }

  return {
    updatedLaw: updatedDoc,
    affectedArticleNumbers,
    articleBBCodes,
    fullLawBBCode,
    partBBCodes
  };
}

/**
 * Patches one or multiple laws affected by the approved bill.
 * Automatically groups comparison rows by their assigned target law (multi-law omnibus bill support).
 */
export function patchLawWithBill(bill: Bill, targetLawId?: string): LawPatchResult {
  const defaultTargetId = targetLawId || findLawByTitleOrCode(bill.targetLaw)?.id || 'road_code';

  // Group comparison rows by canonical law ID
  const lawGroups = new Map<string, ComparisonRow[]>();

  if (bill.comparisons && bill.comparisons.length > 0) {
    for (const comp of bill.comparisons) {
      const rowTarget = comp.targetLaw || bill.targetLaw || defaultTargetId;
      const matchedLaw = findLawByTitleOrCode(rowTarget) || getActiveLaw(rowTarget);
      const canonicalLawId = matchedLaw ? matchedLaw.id : defaultTargetId;

      const existing = lawGroups.get(canonicalLawId) || [];
      existing.push(comp);
      lawGroups.set(canonicalLawId, existing);
    }
  }

  // If no comparisons, total reform, or only 1 unique law touched
  if (bill.isTotalReform || lawGroups.size <= 1) {
    const singleLawId = lawGroups.size > 0 ? (lawGroups.keys().next().value as string) : defaultTargetId;
    const comps = lawGroups.get(singleLawId) || bill.comparisons || [];
    return patchSingleLaw(singleLawId, comps, bill, bill.isTotalReform, bill.totalReformContent);
  }

  // Multi-law bill: patch each law independently and combine results
  const multiLawResults: Record<string, LawPatchResult> = {};
  const allAffectedArticles: string[] = [];
  let primaryResult: LawPatchResult | null = null;

  for (const [lawId, comps] of lawGroups.entries()) {
    const res = patchSingleLaw(lawId, comps, bill, false, undefined);
    multiLawResults[lawId] = res;
    allAffectedArticles.push(...res.affectedArticleNumbers.map((art) => `[${res.updatedLaw.code || res.updatedLaw.title}] ${art}`));
    if (!primaryResult) {
      primaryResult = res;
    }
  }

  if (!primaryResult) {
    return patchSingleLaw(defaultTargetId, bill.comparisons || [], bill);
  }

  return {
    ...primaryResult,
    affectedArticleNumbers: allAffectedArticles,
    multiLawResults
  };
}

/**
 * Strips XenForo BBCode tags cleanly to produce plain text with authentic layout.
 */
export function stripBBCode(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[SPOILER="?([^"\]]*)"?\][\s\S]*?\[\/SPOILER\]/gi, '')
    .replace(/\[ATTACH[^\]]*\][0-9]+\[\/ATTACH\]/gi, '')
    .replace(/\[IMG[^\]]*\][\s\S]*?\[\/IMG\]/gi, '')
    .replace(/\[\/?[a-zA-Z0-9_-]+(?:\s+[^\]]*|=[^\]]*)?\]/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Returns the 100% complete and authentic text of an article for the "Было" / "Стало" editor.
 * Preserves the official article number, authentic title, disposition, bullet points, exceptions, and sanctions.
 */
function formatArticleFullText(art: LawArticle): string {
  // 1. If pristine authentic forum rawBBCode exists and article wasn't altered by a bill,
  // stripping BBCode yields the exact original forum typography and layout.
  if (art.rawBBCode && !art.sourceBillId) {
    const stripped = stripBBCode(art.rawBBCode);
    if (stripped) {
      return stripped;
    }
  }

  // 2. Programmatic reconstruction with full article header and title
  const numClean = art.articleNumber.replace(/^статья\s+/i, '').trim();
  let header = `Статья ${numClean}`;
  let body = (art.content || '').trim();

  if (art.title && art.title.trim()) {
    const titleTrimmed = art.title.trim();
    // If body already starts with the title, strip it from body to prevent duplicate title
    if (body.startsWith(titleTrimmed)) {
      body = body.substring(titleTrimmed.length).replace(/^[:.\s—–-]+/, '').trim();
    }

    if (body.startsWith('⁃') || body.startsWith('-') || body.startsWith('\n')) {
      header = `${header} ${titleTrimmed}\n`;
    } else {
      const punct = /[.:]$/.test(titleTrimmed) ? '' : '.';
      header = `${header} ${titleTrimmed}${punct} `;
    }
  } else {
    if (!body.startsWith('⁃') && !body.startsWith('-') && !body.startsWith('\n')) {
      header = `${header}. `;
    } else {
      header = `${header}\n`;
    }
  }

  let fullText = header.endsWith('\n') ? `${header}${body}` : `${header}${body}`;

  // Only append non-empty clauses that aren't already included in content
  if (art.clauses && art.clauses.length > 0) {
    for (const c of art.clauses) {
      const cContent = (c.content || '').trim();
      if (!cContent) continue; // Skip empty clauses!
      const prefix = c.prefix || 'Исключение:';
      if (!fullText.includes(cContent) && !fullText.includes(prefix)) {
        fullText += `\n${prefix} ${cContent}`;
      }
    }
  }

  // Only append non-empty sanctions that aren't already included in content
  if (art.sanctions && art.sanctions.length > 0) {
    for (const s of art.sanctions) {
      const sText = (s.text || '').trim();
      if (!sText) continue;
      if (!fullText.includes(sText)) {
        fullText += `\n- ${sText}`;
      }
    }
  }

  return fullText.trim();
}

/**
 * Retrieves the current text of an article from any law to pre-fill "Было" when drafting a new bill.
 */
export function getLatestArticleContent(lawIdOrQuery: string = 'road_code', articleTitleOrNumber: string): string | null {
  const resolved = findLawByTitleOrCode(lawIdOrQuery);
  const law = resolved || getActiveLaw(lawIdOrQuery);
  const num = extractArticleNumber(articleTitleOrNumber);
  if (!num) return null;

  // Check if a specific chapter is requested (e.g. "Гл. 2, ст. 1" or "Глава II Статья 1")
  const chMatch = articleTitleOrNumber.match(/(?:гл(?:ава|\.)?\s*)([IVXLCDM\d]+)/i);
  if (chMatch) {
    const chQuery = chMatch[1].toUpperCase();
    const targetCh = law.chapters.find(
      (c) => c.numberRoman.toUpperCase() === chQuery || 
             c.numberRoman.replace(/^Глава\s+/i, '').toUpperCase() === chQuery ||
             c.title.toUpperCase().includes(chQuery)
    );
    if (targetCh) {
      const art = targetCh.articles.find((a) => extractArticleNumber(a.articleNumber) === num || a.articleNumber === num);
      if (art) return formatArticleFullText(art);
    }
  }

  for (const ch of law.chapters) {
    const art = ch.articles.find((a) => extractArticleNumber(a.articleNumber) === num || a.articleNumber === num);
    if (art) {
      return formatArticleFullText(art);
    }
  }
  return null;
}
