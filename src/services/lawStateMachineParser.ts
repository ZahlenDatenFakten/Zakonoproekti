import type { StateLaw, StateLawArticle } from '../data/stateLaws';

/**
 * Hierarchical Law Parser using State Machine & Regex Engine
 * Step 1: Preprocessing & Normalization
 * Step 2: State Machine Context Traversal (Chapters -> Articles -> Subpoints)
 * Step 3: Cross-reference Extraction & Data Structuring
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

// 1. Preprocessing & Normalization
export function normalizeLawText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    .replace(/\u200b/g, '')
    .replace(/\xa0/g, ' ')
    .replace(/[–—−]/g, '-')
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

// 2. Compiled Regex Patterns
const CHAPTER_RX = /^(?:Глава|Раздел)\s+([IVXLCDM\d]+)\.?\s*(.*)/i;
const ARTICLE_RX = /^Статья\s+(\d+(?:\.\d+)*)\.?\s*(.*)/i;
const SUBPOINT_RX = /^\s*(\d+(?:\.\d+)?)\.\s*(.*)/;
const CROSS_REF_RX = /(?:ст\.|стать[яиеюямх]+\.?)\s*(\d+(?:\.\d+)*)\s*([A-ЯA-Z]{2,10})?/gi;

// 3. State Machine Parser
export function parseLawWithStateMachine(rawText: string, defaultTitle?: string): LawDocumentTree {
  const normalized = normalizeLawText(rawText);
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

  const documentTree: LawDocumentTree = {
    title: defaultTitle || '',
    chapters: [],
    unattachedArticles: [],
    crossReferences: []
  };

  // Find document title if not provided
  if (!documentTree.title && lines.length > 0) {
    for (const line of lines) {
      if (line.length > 5 && line.length < 150 && !CHAPTER_RX.test(line) && !ARTICLE_RX.test(line)) {
        documentTree.title = line.replace(/^[#=*\s]+/, '').trim();
        break;
      }
    }
  }
  if (!documentTree.title) documentTree.title = 'Закон Штата San Andreas';

  let currentChapter: ParsedChapter | null = null;
  let currentArticle: ParsedArticle | null = null;

  // Extract Cross-references
  let refMatch: RegExpExecArray | null;
  while ((refMatch = CROSS_REF_RX.exec(normalized)) !== null) {
    const refStr = `Статья ${refMatch[1]}${refMatch[2] ? ' ' + refMatch[2] : ''}`;
    if (!documentTree.crossReferences.includes(refStr)) {
      documentTree.crossReferences.push(refStr);
    }
  }

  // State Machine Loop
  for (const line of lines) {
    // Check Chapter Match
    const chapMatch = CHAPTER_RX.exec(line);
    if (chapMatch) {
      currentChapter = {
        chapterNum: chapMatch[1],
        chapterTitle: chapMatch[2].trim() || `Глава ${chapMatch[1]}`,
        articles: []
      };
      documentTree.chapters.push(currentChapter);
      currentArticle = null;
      continue;
    }

    // Check Article Match
    const artMatch = ARTICLE_RX.exec(line);
    if (artMatch) {
      currentArticle = {
        articleNum: `Статья ${artMatch[1]}`,
        articleTitle: artMatch[2].trim() || 'Положения статьи',
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

    // Check Subpoint Match inside Article
    if (currentArticle) {
      const subMatch = SUBPOINT_RX.exec(line);
      if (subMatch) {
        currentArticle.subpoints.push({
          num: subMatch[1],
          text: subMatch[2].trim()
        });
      } else {
        currentArticle.paragraphs.push(line);
      }
    }
  }

  return documentTree;
}

// Convert Document Tree to StateLaw Object
export function convertDocumentTreeToStateLaw(tree: LawDocumentTree, forumUrl?: string): StateLaw {
  const articles: StateLawArticle[] = [];
  let articleIdx = 0;

  const processArticle = (art: ParsedArticle) => {
    let fullContent = '';
    
    if (art.paragraphs.length > 0) {
      fullContent += art.paragraphs.join('\n\n');
    }

    if (art.subpoints.length > 0) {
      if (fullContent) fullContent += '\n\n';
      fullContent += art.subpoints.map((sp) => `${sp.num}. ${sp.text}`).join('\n');
    }

    if (!fullContent) {
      fullContent = 'Содержание статьи...';
    }

    articles.push({
      id: 'art_sm_' + Date.now() + '_' + articleIdx++,
      articleNumber: art.articleNum,
      title: art.articleTitle,
      content: fullContent
    });
  };

  // Process all chapters and articles
  tree.chapters.forEach((ch) => ch.articles.forEach(processArticle));
  tree.unattachedArticles.forEach(processArticle);

  // Fallback if no articles matched
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
    forumUrl: forumUrl || 'https://forum.gta5rp.com',
    articles: articles
  };
}
