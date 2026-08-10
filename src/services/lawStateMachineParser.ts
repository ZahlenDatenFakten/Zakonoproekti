import type { StateLaw, StateLawArticle } from '../data/stateLaws';

/**
 * ══════════════════════════════════════════════════════════════
 * HIERARCHICAL LAW PARSER — STATE MACHINE + REGEX ENGINE v2.0
 * ══════════════════════════════════════════════════════════════
 * 
 * Step 1: PDF Noise Cleanup & Text Normalization
 * Step 2: State Machine Traversal (Chapters → Articles → Subpoints)
 * Step 3: Cross-Reference Extraction & Linking
 * Step 4: Document Tree → StateLaw Conversion
 */

export interface ParsedSubpoint {
  num: string;
  text: string;
}

export interface ParsedArticle {
  articleNum: string;
  articleTitle: string;
  paragraphs: string[];
  subpoints: ParsedSubpoint[];
}

export interface ParsedChapter {
  chapterNum: string;
  chapterTitle: string;
  articles: ParsedArticle[];
}

export interface LawDocumentTree {
  title: string;
  chapters: ParsedChapter[];
  unattachedArticles: ParsedArticle[];
  crossReferences: string[];
}

// ═══════════════════════════════════════
// 1. PDF NOISE CLEANUP & NORMALIZATION
// ═══════════════════════════════════════

/** Known forum/PDF header noise patterns to strip */
const PDF_NOISE_PATTERNS: RegExp[] = [
  /Форум\s+GTA\s*5?\s*RP[^\n]*/gi,
  /forum\.gta5rp\.com[^\n]*/gi,
  /Новый\s+уровень\s+ролевой\s+игры[^\n]*/gi,
  /^Страница\s+\d+\s*(из\s*\d+)?$/gim,
  /^\d+\s*\/\s*\d+$/gm, // Page numbers like "3/12"
  /^={3,}$/gm,
  /^-{3,}$/gm,
  /^_{3,}$/gm,
  /^\s*Нравится\s*$/gim,
  /^\s*Цитата\s*$/gim,
  /^\s*Ответить\s*$/gim,
  /^\s*Пожаловаться\s*$/gim,
  /^\s*Поделиться\s*$/gim,
  /Последнее редактирование модератором[^\n]*/gi,
  /Discord:\s*[^\n]*/gim,
  /\d{2}\.\d{2}\.\d{4},\s*\d{2}:\d{2}\s*SA-GOV[^\n]*/gim,
  /Закон\s+О\s+регулировании[^\n]*https:\/\/[^\n]*/gim,
];

export function normalizeLawText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText
    // Unicode cleanup
    .replace(/\u200b/g, '')
    .replace(/\xa0/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    // HTML tag cleanup
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // HTML entity cleanup
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // Strip PDF noise (headers, footers, page numbers)
  for (const pattern of PDF_NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }

  // Merge broken lines from PDF extraction:
  // If a line ends without punctuation and the next starts with lowercase → join
  const lines = text.split('\n');
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { merged.push(''); continue; }

    if (
      merged.length > 0 &&
      merged[merged.length - 1] &&
      !merged[merged.length - 1].match(/[.;:!?\n]$/) &&
      line[0] === line[0].toLowerCase() &&
      line[0] !== line[0].toUpperCase() &&
      !CHAPTER_RX.test(line) &&
      !ARTICLE_RX.test(line) &&
      !SUBPOINT_NUM_RX.test(line) &&
      !SUBPOINT_LETTER_RX.test(line)
    ) {
      merged[merged.length - 1] += ' ' + line;
    } else {
      merged.push(line);
    }
  }

  return merged.join('\n');
}

// ═══════════════════════════════════════
// 2. COMPILED REGEX PATTERNS
// ═══════════════════════════════════════

const CHAPTER_RX = /^(?:Глава|Раздел|ГЛАВА|РАЗДЕЛ)\s+([IVXLCDM\d]+)\s*[.:]?\s*(.*)/i;
const ARTICLE_RX = /^(?:(?:Статья|СТАТЬЯ|Ст\.)\s+|(?=\d+(?:\.\d+)+\s+[А-ЯA-Z]))(\d+(?:\.\d+)*)\s*[.:]?\s*(.*)/i;
const SUBPOINT_NUM_RX = /^\s*(\d+(?:\.\d+)?)\s*[.)]\s*(.*)/;
const SUBPOINT_LETTER_RX = /^\s*([а-яa-z])\s*[.)]\s*(.*)/i;
const CROSS_REF_RX = /(?:ст\.|стать[яиеюямх]+\.?)\s*(\d+(?:\.\d+)*)\s*([A-ЯA-Z]{2,10})?/gi;
const ABBREVIATION_RX = /\b(УАК|ПК|ДК|ТК|ЗАК|АК|СК)\b/g;

// ═══════════════════════════════════════
// 3. STATE MACHINE PARSER
// ═══════════════════════════════════════

export function parseLawWithStateMachine(rawText: string, defaultTitle?: string): LawDocumentTree {
  const normalized = normalizeLawText(rawText);
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  const documentTree: LawDocumentTree = {
    title: defaultTitle || '',
    chapters: [],
    unattachedArticles: [],
    crossReferences: []
  };

  // Auto-detect title from first meaningful line
  if (!documentTree.title && lines.length > 0) {
    for (const line of lines) {
      if (
        line.length > 5 &&
        line.length < 200 &&
        !CHAPTER_RX.test(line) &&
        !ARTICLE_RX.test(line) &&
        !SUBPOINT_NUM_RX.test(line)
      ) {
        documentTree.title = line
          .replace(/^[#=*\s]+/, '')
          .replace(/["']/g, '')
          .trim();
        break;
      }
    }
  }
  if (!documentTree.title) documentTree.title = 'Закон Штата San Andreas';

  let currentChapter: ParsedChapter | null = null;
  let currentArticle: ParsedArticle | null = null;

  // Extract cross-references from the entire text
  let refMatch: RegExpExecArray | null;
  const refRegex = new RegExp(CROSS_REF_RX.source, CROSS_REF_RX.flags);
  while ((refMatch = refRegex.exec(normalized)) !== null) {
    const refStr = `Статья ${refMatch[1]}${refMatch[2] ? ' ' + refMatch[2] : ''}`;
    if (!documentTree.crossReferences.includes(refStr)) {
      documentTree.crossReferences.push(refStr);
    }
  }

  // ═══ State Machine Loop ═══
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Scan for cross-references in every line
    let refMatch;
    while ((refMatch = CROSS_REF_RX.exec(line)) !== null) {
      const code = refMatch[2] ? ` ${refMatch[2]}` : '';
      const ref = `Статья ${refMatch[1]}${code}`;
      if (!documentTree.crossReferences.includes(ref)) {
        documentTree.crossReferences.push(ref);
      }
    }

    // Scan for semantic abbreviations (УАК, ПК, ДК)
    let abbrMatch;
    while ((abbrMatch = ABBREVIATION_RX.exec(line)) !== null) {
      if (!documentTree.crossReferences.includes(abbrMatch[1])) {
        documentTree.crossReferences.push(abbrMatch[1]);
      }
    }

    // ── Check Chapter Match ──
    const chapMatch = CHAPTER_RX.exec(line);
    if (chapMatch) {
      // If chapter title is on next line (empty title)
      let chTitle = chapMatch[2].trim();
      if (!chTitle && i + 1 < lines.length && !CHAPTER_RX.test(lines[i + 1]) && !ARTICLE_RX.test(lines[i + 1])) {
        chTitle = lines[i + 1].trim();
        i++; // skip the title line
      }
      
      currentChapter = {
        chapterNum: chapMatch[1],
        chapterTitle: chTitle || `Глава ${chapMatch[1]}`,
        articles: []
      };
      documentTree.chapters.push(currentChapter);
      currentArticle = null;
      continue;
    }

    // ── Check Article Match ──
    const artMatch = ARTICLE_RX.exec(line);
    if (artMatch) {
      // If article title is on next line (common in PDF)
      let artTitle = artMatch[2].trim();
      if (!artTitle && i + 1 < lines.length && !CHAPTER_RX.test(lines[i + 1]) && !ARTICLE_RX.test(lines[i + 1]) && !SUBPOINT_NUM_RX.test(lines[i + 1])) {
        artTitle = lines[i + 1].trim();
        i++;
      }

      currentArticle = {
        articleNum: artMatch[1], // Store ONLY the number part (e.g. "15.6")
        articleTitle: artTitle || 'Положения статьи',
        paragraphs: [],
        subpoints: []
      };

      if (currentChapter) {
        currentChapter.articles.push(currentArticle);
      } else {
        documentTree.unattachedArticles.push(currentArticle);
      }
      continue;
    }

    // ── Check Subpoint Match ──
    if (currentArticle) {
      // Numeric subpoints: 1. ... , 1) ...
      const subNumMatch = SUBPOINT_NUM_RX.exec(line);
      if (subNumMatch) {
        currentArticle.subpoints.push({
          num: subNumMatch[1],
          text: subNumMatch[2].trim()
        });
        continue;
      }

      // Letter subpoints: а) ... , б) ...
      const subLetterMatch = SUBPOINT_LETTER_RX.exec(line);
      if (subLetterMatch && line.length > 3) {
        currentArticle.subpoints.push({
          num: subLetterMatch[1],
          text: subLetterMatch[2].trim()
        });
        continue;
      }

      // Regular paragraph text
      currentArticle.paragraphs.push(line);
    }
  }

  return documentTree;
}

// ═══════════════════════════════════════
// 4. DOCUMENT TREE → STATELAW CONVERSION
// ═══════════════════════════════════════

export function convertDocumentTreeToStateLaw(tree: LawDocumentTree, forumUrl?: string): StateLaw {
  const articles: StateLawArticle[] = [];
  let articleIdx = 0;

  const processArticle = (art: ParsedArticle, chapterPrefix?: string) => {
    let fullContent = '';

    if (art.paragraphs.length > 0) {
      fullContent += art.paragraphs.join('\n\n');
    }

    if (art.subpoints.length > 0) {
      if (fullContent) fullContent += '\n\n';
      fullContent += art.subpoints.map((sp) => `${sp.num}. ${sp.text}`).join('\n');
    }

    if (!fullContent) {
      if (art.articleTitle && art.articleTitle !== 'Положения статьи') {
        fullContent = art.articleTitle;
      } else {
        fullContent = 'Содержание статьи...';
      }
    }

    const displayNum = `Статья ${art.articleNum}`;

    articles.push({
      id: 'art_sm_' + Date.now() + '_' + articleIdx++,
      articleNumber: displayNum,
      title: art.articleTitle,
      content: fullContent,
      chapterRef: chapterPrefix || undefined
    });
  };

  // Process chapters → articles
  tree.chapters.forEach((ch) => {
    const prefix = `Глава ${ch.chapterNum}. ${ch.chapterTitle}`;
    ch.articles.forEach((art) => processArticle(art, prefix));
  });

  // Process unattached articles
  tree.unattachedArticles.forEach((art) => processArticle(art));

  // Fallback if nothing was parsed
  if (articles.length === 0) {
    articles.push({
      id: 'art_sm_fb_1',
      articleNumber: 'Статья 1.1',
      title: 'Общие положения',
      content: 'Действующая редакция нормативно-правового акта Штата San Andreas.'
    });
  }

  const lawCodeMatch = tree.title.match(/([А-ЯA-Z]{2,6})/);
  const lawCode = lawCodeMatch ? lawCodeMatch[1] : 'АКТ';

  return {
    id: 'law_sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: tree.title,
    code: `${lawCode}-SA`,
    category: 'Законы Штата',
    forumUrl: forumUrl || '',
    articles,
    crossReferences: tree.crossReferences
  };
}
