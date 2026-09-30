import type { StateLawDocument, LawArticle, LawChapter, LawPatchResult } from '../types/lawAst';
import type { Bill, ComparisonRow } from '../types/bill';
import { COMPILED_LAWS_REGISTRY } from '../data/compiledLawsRegistry';
import { compileArticleBBCode, compileFullLawBBCode, compileLawPartBBCode } from './bbcodeCompiler';

const LAW_STORAGE_PREFIX = 'legaldraft_law_doc_';

/**
 * Normalizes article titles like "Статья 9.1.", "ст. 9.1", "9.1 ", "Гл. 1, ст. 1.5.6" -> "1.5.6"
 */
export function extractArticleNumber(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();

  // 1. Explicit "ст. 1.5.6" or "статья 1.5.6" anywhere in string
  const explicitMatch = trimmed.match(/(?:ст(?:атья|\.)?\s*)([0-9]+(?:\.[0-9]+)*)/i);
  if (explicitMatch) {
    return explicitMatch[1];
  }

  // 2. Standalone number or number at start of string: "1.5.6", "1.5.6.", "1.5.6 Название"
  const startMatch = trimmed.match(/^([0-9]+(?:\.[0-9]+)*)/);
  if (startMatch) {
    return startMatch[1];
  }

  // 3. Any number sequence in the string
  const anyMatch = trimmed.match(/([0-9]+(?:\.[0-9]+)*)/);
  if (anyMatch) {
    return anyMatch[1];
  }

  return trimmed.replace(/^статья\s+/i, '').replace(/[\.:]$/, '').trim();
}

function cleanStr(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/["'«»“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Exact standalone words / abbreviations (Cyrillic-safe)
 */
const EXACT_WORD_ALIASES: Record<string, string> = {
  // Codes
  'дк': 'road_code',
  'ук': 'criminal_code',
  'уак': 'criminal_code',
  'пк': 'procedural_code',
  'ск': 'judicial_code',
  'тк': 'labor_code',
  'эк': 'ethical_code',
  // Special/Agencies & Laws
  'чп': 'law_emergency',
  'вп': 'law_emergency',
  'сми': 'law_media',
  'ems': 'law_health',
  'fp': 'law_prison',
  'fib': 'law_fib',
  'фиб': 'law_fib',
  'фбр': 'law_fib',
  'sang': 'law_sang',
  'санг': 'law_sang',
  'usss': 'law_usss',
  'юссс': 'law_usss',
  'lspd': 'law_police',
  'lssd': 'law_police'
};

/**
 * Multi-word or root patterns for high-confidence legal domain identification
 */
const LAW_ROOT_PATTERNS: Array<{ re: RegExp; id: string }> = [
  { re: /взаимодейств/i, id: 'law_state_coop' },
  { re: /неприкосновенн/i, id: 'law_immunity' },
  { re: /коллеги[яи].*адвокат|адвокат/i, id: 'law_bar' },
  { re: /закрыт.*территор|охраняем.*территор/i, id: 'law_territories' },
  { re: /оружи|боеприпас|спецсредств/i, id: 'law_weapons' },
  { re: /здравоохран|медицин/i, id: 'law_health' },
  { re: /массов.*информ|weazel/i, id: 'law_media' },
  { re: /гостайн|служебн.*тайн|документаци/i, id: 'law_docs' },
  { re: /дипломатическ|посольств/i, id: 'law_diplomatic' },
  { re: /политическ.*парти|парти[яий]/i, id: 'law_parties' },
  { re: /предпринимательск|бизнес/i, id: 'law_business' },
  { re: /чрезвычайн|военн.*положени/i, id: 'law_emergency' },
  { re: /аренд.*государственн|аренд/i, id: 'law_rent' },
  { re: /природн.*ресурс|природ/i, id: 'law_nature' },
  { re: /наград|знак.*отличи/i, id: 'law_awards' },
  { re: /секретн.*служб/i, id: 'law_usss' },
  { re: /нацгварди|национальн.*гварди|гварди/i, id: 'law_sang' },
  { re: /расследовательск.*бюро/i, id: 'law_fib' },
  { re: /федеральн.*тюрьм|тюрьм|prison/i, id: 'law_prison' },
  { re: /региональн.*правоохран|полици/i, id: 'law_police' },
  { re: /прокуратур|прокурор|минюст/i, id: 'law_prosecutor' },
  { re: /министерств.*финанс|минфин|финанс/i, id: 'law_finance' },
  { re: /правительств/i, id: 'law_government' },
  { re: /конституци/i, id: 'constitution' },
  { re: /дорожн.*кодекс|дорожн/i, id: 'road_code' },
  { re: /уголовн.*кодекс|уголовн/i, id: 'criminal_code' },
  { re: /процессуальн.*кодекс|процессуальн/i, id: 'procedural_code' },
  { re: /судебн.*кодекс|судебн/i, id: 'judicial_code' },
  { re: /трудов.*кодекс|трудов/i, id: 'labor_code' },
  { re: /этическ.*кодекс|этическ/i, id: 'ethical_code' },
  { re: /территор/i, id: 'law_territories' }
];

/**
 * Highly intelligent and robust law matcher.
 * Reliably resolves law by ID, Code, exact title, short title, domain root, or abbreviation.
 */
export function findLawByTitleOrCode(query?: string): StateLawDocument | null {
  if (!query || !query.trim()) return null;
  const rawQ = query.trim();
  const q = rawQ.toLowerCase();
  const cleanQ = cleanStr(rawQ);
  const allLaws = Object.values(COMPILED_LAWS_REGISTRY);

  // 1. Direct ID match
  if (COMPILED_LAWS_REGISTRY[q]) {
    return getActiveLaw(q);
  }
  const byId = allLaws.find((l) => l.id.toLowerCase() === q);
  if (byId) return getActiveLaw(byId.id);

  // 2. Exact Code match
  const byCode = allLaws.find((l) => l.code.toLowerCase() === q);
  if (byCode) return getActiveLaw(byCode.id);

  // 3. Exact Title or ShortTitle match
  const byTitle = allLaws.find(
    (l) => l.title.toLowerCase() === q || (l.shortTitle && l.shortTitle.toLowerCase() === q)
  );
  if (byTitle) return getActiveLaw(byTitle.id);

  // 4. Exact cleaned Title / ShortTitle (without quotes and punctuation)
  const byCleanTitle = allLaws.find(
    (l) => cleanStr(l.title) === cleanQ || (l.shortTitle && cleanStr(l.shortTitle) === cleanQ)
  );
  if (byCleanTitle) return getActiveLaw(byCleanTitle.id);

  // 5. Standalone exact alias / word match (e.g. "ук", "дк", "usss", "юссс", "сми", "чп")
  if (EXACT_WORD_ALIASES[cleanQ]) {
    return getActiveLaw(EXACT_WORD_ALIASES[cleanQ]);
  }

  // Check if any word in query matches exact abbreviation (separated by whitespace or punctuation)
  const words = cleanQ.split(/[^a-zA-Zа-яА-ЯёЁ0-9_]+/).filter(Boolean);
  for (const w of words) {
    if (EXACT_WORD_ALIASES[w]) {
      return getActiveLaw(EXACT_WORD_ALIASES[w]);
    }
  }

  // 6. Query contains full clean title or clean short title
  const byContained = allLaws
    .filter((l) => {
      const cTitle = cleanStr(l.title);
      const cShort = l.shortTitle ? cleanStr(l.shortTitle) : '';
      return (cTitle && cleanQ.includes(cTitle)) || (cShort && cleanQ.includes(cShort));
    })
    .sort((a, b) => cleanStr(b.title).length - cleanStr(a.title).length)[0];
  if (byContained) return getActiveLaw(byContained.id);

  // 7. Distinct root patterns (high-confidence legal keywords)
  for (const { re, id } of LAW_ROOT_PATTERNS) {
    if (re.test(rawQ)) {
      return getActiveLaw(id);
    }
  }

  // 8. Substring fallback ONLY for non-abbreviation queries (length >= 5)
  if (cleanQ.length >= 5) {
    const bySub = allLaws
      .filter((l) => {
        const cTitle = cleanStr(l.title);
        return cTitle.includes(cleanQ) || (l.shortTitle && cleanStr(l.shortTitle).includes(cleanQ));
      })
      .sort((a, b) => cleanStr(b.title).length - cleanStr(a.title).length)[0];
    if (bySub) return getActiveLaw(bySub.id);
  }

  return null;
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

const ROMAN_NUMERALS: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5,
  VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
  XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15,
  XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20
};

function normalizeSnippet(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\[\/?(?:b|i|u|color|font|size|center|indent|url|img)[^\]]*\]/gi, '')
    .replace(/[^a-zа-я0-9]/gi, '')
    .trim();
}

/**
 * Smartly finds the exact target article to update across chapters using multi-strategy resolution:
 * 1. Direct number match (e.g. "1.1", "12.3", "1")
 * 2. Snippet match of existing content (wasContent) - guarantees 100% precision when article was chosen from law
 * 3. Chapter + Article notation (e.g. "Глава 1 Статья 1" -> Chapter 1, Article 1.1 or 1)
 * 4. Hierarchical prefix match (e.g. user typed "Статья 1" or "1" for a law using "1.1, 1.2" numbering)
 * 5. Title / keyword substring match
 */
export function findArticleSmart(
  comp: ComparisonRow,
  chapters: LawChapter[]
): { article: LawArticle; chapterIndex: number } | null {
  const title = (comp.articleTitle || '').trim();
  const rawNum = extractArticleNumber(title);

  // Strategy 1: Exact direct match by extracted article number across all chapters
  if (rawNum) {
    for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
      const art = chapters[cIdx].articles.find(
        (a) => a.articleNumber === rawNum || extractArticleNumber(a.articleNumber) === rawNum
      );
      if (art) return { article: art, chapterIndex: cIdx };
    }
  }

  // Strategy 2: Match by wasContent snippet (highest fidelity when drafted from existing law)
  if (comp.wasContent && comp.wasContent.trim().length >= 15) {
    const cleanWas = normalizeSnippet(comp.wasContent);
    const sample = cleanWas.slice(0, 45);
    if (sample.length >= 15) {
      for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
        for (const art of chapters[cIdx].articles) {
          const cleanArt = normalizeSnippet(art.content);
          const cleanBB = art.rawBBCode ? normalizeSnippet(art.rawBBCode) : '';
          if (cleanArt.includes(sample) || cleanBB.includes(sample)) {
            return { article: art, chapterIndex: cIdx };
          }
        }
      }
    }
  }

  // Strategy 3: Chapter + Article notation (e.g. "Глава 1 Статья 1", "Гл. II ст. 1")
  const chMatch = title.match(/(?:гл(?:ава|\.)?\s*)([IVXLCDM\d]+)/i);
  if (chMatch) {
    const chQuery = chMatch[1].toUpperCase();
    const chNum = ROMAN_NUMERALS[chQuery] || parseInt(chQuery, 10);
    const cIdx = chapters.findIndex((c, idx) => {
      const cRoman = c.numberRoman.replace(/^Глава\s+/i, '').replace(/\.$/, '').trim().toUpperCase();
      const cNum = ROMAN_NUMERALS[cRoman] || idx + 1;
      return cNum === chNum || cRoman === chQuery;
    });

    if (cIdx !== -1) {
      const targetCh = chapters[cIdx];
      if (rawNum) {
        // Direct match in chapter
        const art = targetCh.articles.find(
          (a) => a.articleNumber === rawNum || extractArticleNumber(a.articleNumber) === rawNum
        );
        if (art) return { article: art, chapterIndex: cIdx };

        // Hierarchical match: if user wrote "Глава 2 Статья 1", in Ch 2 match "2.1"
        const hierarchicalNum = `${chNum}.${rawNum}`;
        const hierArt = targetCh.articles.find(
          (a) => a.articleNumber === hierarchicalNum || extractArticleNumber(a.articleNumber) === hierarchicalNum
        );
        if (hierArt) return { article: hierArt, chapterIndex: cIdx };

        // Match by 1-based index in chapter
        const idxInCh = parseInt(rawNum, 10) - 1;
        if (idxInCh >= 0 && idxInCh < targetCh.articles.length) {
          return { article: targetCh.articles[idxInCh], chapterIndex: cIdx };
        }
      }
    }
  }

  // Strategy 4: Hierarchical single number mapping (e.g. user typed "Статья 1" or "1" for a law using "1.1, 1.2" numbering)
  if (rawNum && /^\d+$/.test(rawNum)) {
    const singleInt = parseInt(rawNum, 10);
    for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
      const cRoman = chapters[cIdx].numberRoman.replace(/^Глава\s+/i, '').replace(/\.$/, '').trim().toUpperCase();
      const cNum = ROMAN_NUMERALS[cRoman] || cIdx + 1;
      if (cNum === singleInt) {
        const candidate = chapters[cIdx].articles.find(
          (a) => a.articleNumber === `${singleInt}.1` || extractArticleNumber(a.articleNumber) === `${singleInt}.1`
        );
        if (candidate) return { article: candidate, chapterIndex: cIdx };
        if (chapters[cIdx].articles.length > 0) {
          return { article: chapters[cIdx].articles[0], chapterIndex: cIdx };
        }
      }
    }

    if (singleInt === 1 && chapters.length > 0 && chapters[0].articles.length > 0) {
      const candidate = chapters[0].articles.find(
        (a) => a.articleNumber === '1.1' || extractArticleNumber(a.articleNumber) === '1.1'
      );
      if (candidate) return { article: candidate, chapterIndex: 0 };
    }
  }

  // Strategy 5: Title / keyword substring match
  const cleanTitle = title.toLowerCase().replace(/^статья\s+/i, '').replace(/^[\d\.\s—–-]+/, '').trim();
  if (cleanTitle.length >= 4) {
    for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
      const art = chapters[cIdx].articles.find(
        (a) => (a.title && a.title.toLowerCase().includes(cleanTitle)) ||
               a.content.toLowerCase().startsWith(cleanTitle)
      );
      if (art) return { article: art, chapterIndex: cIdx };
    }
  }

  return null;
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

      const found = findArticleSmart(comp, updatedChapters);
      const articleNumberToUse = found ? found.article.articleNumber : (extractArticleNumber(comp.articleTitle || '') || '1');
      const parsed = parseRawArticleContent(comp.becameContent, articleNumberToUse, found?.article.title);

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
        const compiledBB = compileArticleBBCode(found.article);
        articleBBCodes[found.article.articleNumber] = compiledBB;
        if (comp.articleTitle) {
          articleBBCodes[comp.articleTitle] = compiledBB;
        }
        const cleanTitleNum = extractArticleNumber(comp.articleTitle || '');
        if (cleanTitleNum) {
          articleBBCodes[cleanTitleNum] = compiledBB;
        }
      } else {
        // Create new article into the most suitable chapter
        const num = articleNumberToUse;
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
        const compiledNewBB = compileArticleBBCode(newArt);
        articleBBCodes[num] = compiledNewBB;
        if (comp.articleTitle) {
          articleBBCodes[comp.articleTitle] = compiledNewBB;
        }
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
    const res = patchSingleLaw(singleLawId, comps, bill, bill.isTotalReform, bill.totalReformContent);
    return {
      ...res,
      multiLawResults: {
        [singleLawId]: res
      }
    };
  }

  // Multi-law bill: patch each law independently and combine results
  const multiLawResults: Record<string, LawPatchResult> = {};
  const allAffectedArticles: string[] = [];
  const mergedArticleBBCodes: Record<string, string> = {};
  let primaryResult: LawPatchResult | null = null;

  for (const [lawId, comps] of lawGroups.entries()) {
    const res = patchSingleLaw(lawId, comps, bill, false, undefined);
    multiLawResults[lawId] = res;

    // Merge article BB-codes from each law with multiple lookup keys
    for (const [artNum, code] of Object.entries(res.articleBBCodes)) {
      mergedArticleBBCodes[artNum] = code;
      const lawPrefix = res.updatedLaw.code || res.updatedLaw.shortTitle || res.updatedLaw.title;
      mergedArticleBBCodes[`[${lawPrefix}] ${artNum}`] = code;
    }

    for (const comp of comps) {
      const artNum = extractArticleNumber(comp.articleTitle);
      if (res.articleBBCodes[artNum]) {
        mergedArticleBBCodes[comp.articleTitle] = res.articleBBCodes[artNum];
      }
    }

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
    articleBBCodes: mergedArticleBBCodes,
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
    .replace(/\[\*\]\s*/gi, '')
    .replace(/\[\/?list(?:\s+[^\]]*|=[^\]]*)?\]/gi, '')
    .replace(/\[\/?[a-zA-Z0-9_*#-]+(?:\s+[^\]]*|=[^\]]*)?\]/g, '')
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
  if (!law || !law.chapters) return null;

  const pseudoComp: ComparisonRow = {
    id: 'query',
    articleTitle: articleTitleOrNumber,
    wasContent: '',
    becameContent: ''
  };

  const matched = findArticleSmart(pseudoComp, law.chapters);
  if (matched) {
    return formatArticleFullText(matched.article);
  }

  const num = extractArticleNumber(articleTitleOrNumber);
  if (!num) return null;

  // Direct article search by number across all chapters
  for (const ch of law.chapters) {
    const art = ch.articles.find((a) => extractArticleNumber(a.articleNumber) === num || a.articleNumber === num);
    if (art) {
      return formatArticleFullText(art);
    }
  }

  return null;
}
