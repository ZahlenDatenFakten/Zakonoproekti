import type { LawArticle, LawChapter, StateLawDocument } from '../types/lawAst';

export const FORUM_THEME = {
  font: 'verdana',
  size: '4',
  accentColor: 'rgb(236, 199, 129)', // #ECC781 GTA5RP Official Gold
  textColor: 'rgb(255, 255, 255)',   // #FFFFFF GTA5RP Official White
  bannerImage: 'https://i.imgur.com/bQG2kud.png',
  dividerImage: 'https://i.imgur.com/eoOV353.png'
};

/**
 * Validates and balances XenForo BBCode tags.
 * Ensures zero unclosed tags and no broken forum page styling.
 */
export function validateAndBalanceBBCode(bbcode: string): { isValid: boolean; balancedBBCode: string } {
  // Matches [TAG], [TAG=val], [TAG attr="val"]
  const openTagRegex = /\[([A-Za-z0-9_-]+)(?:\s+[^\]]*|=[^\]]*)?\]/gi;
  const closeTagRegex = /\[\/([A-Za-z0-9_-]+)\s*\]/gi;
  const voidTags = new Set(['HR', 'BR']);

  const stack: string[] = [];
  const tagTokens: Array<{ type: 'open' | 'close'; tag: string; raw: string; index: number }> = [];

  let match: RegExpExecArray | null;

  // Collect open tags
  while ((match = openTagRegex.exec(bbcode)) !== null) {
    const raw = match[0];
    const tag = match[1].toUpperCase();
    if (!raw.startsWith('[/') && !voidTags.has(tag)) {
      tagTokens.push({ type: 'open', tag, raw, index: match.index });
    }
  }

  // Collect close tags
  while ((match = closeTagRegex.exec(bbcode)) !== null) {
    const tag = match[1].toUpperCase();
    if (!voidTags.has(tag)) {
      tagTokens.push({ type: 'close', tag, raw: match[0], index: match.index });
    }
  }

  // Sort by index in text
  tagTokens.sort((a, b) => a.index - b.index);

  let balanced = bbcode;
  for (const token of tagTokens) {
    if (token.type === 'open') {
      stack.push(token.tag);
    } else if (token.type === 'close') {
      const last = stack.lastIndexOf(token.tag);
      if (last !== -1) {
        stack.splice(last, 1);
      }
    }
  }

  // If there are unclosed tags, close them in reverse order
  if (stack.length > 0) {
    const closingSuffix = stack.reverse().map((t) => `[/${t}]`).join('');
    balanced += closingSuffix;
    return { isValid: false, balancedBBCode: balanced };
  }

  return { isValid: true, balancedBBCode: bbcode };
}

/**
 * Compiles a single law article into 100% clean XenForo BB-code.
 */
export function compileArticleBBCode(article: LawArticle): string {
  // If the article has an authentic raw BBCode from forum and was not altered by a bill, preserve 100% of formatting
  if (article.rawBBCode && !article.sourceBillId) {
    return article.rawBBCode;
  }

  const lines: string[] = [];
  const { font, size, accentColor, textColor } = FORUM_THEME;

  // Clean article number (e.g. "9.1", "Статья 9.1" -> "9.1")
  const numClean = article.articleNumber.replace(/^статья\s+/i, '').trim();

  // 1. Article header & main content
  const articleTitle = article.title ? `[COLOR=${textColor}][B]${article.title}:[/B][/COLOR] ` : '';
  lines.push(
    `[INDENT=2][FONT=${font}][SIZE=${size}][B][COLOR=${accentColor}]Статья ${numClean}[/COLOR][/B] ${articleTitle}[COLOR=${textColor}]${article.content.trim()}[/COLOR][/SIZE][/FONT][/INDENT]`
  );

  // 2. Clauses (Exceptions, Notes, subclauses)
  if (article.clauses && article.clauses.length > 0) {
    for (const clause of article.clauses) {
      const prefix = clause.prefix || 'Исключение:';
      lines.push(
        `[INDENT=2][FONT=${font}][SIZE=${size}][I][COLOR=${accentColor}]${prefix}[/COLOR][/I] [COLOR=${textColor}]${clause.content.trim()}[/COLOR][/SIZE][/FONT][/INDENT]`
      );

      if (clause.subclauses && clause.subclauses.length > 0) {
        for (const sub of clause.subclauses) {
          const subTitle = sub.title ? `[B]${sub.title}[/B] ` : '';
          lines.push(
            `[INDENT=3][FONT=${font}][SIZE=${size}][B][COLOR=${accentColor}]${sub.bullet} [/COLOR][/B]${subTitle}[COLOR=${textColor}]${sub.content.trim()}[/COLOR][/SIZE][/FONT][/INDENT]`
          );
          if (sub.sanction) {
            lines.push(
              `[INDENT=4][FONT=${font}][SIZE=${size}][I][COLOR=${accentColor}]- [/COLOR][COLOR=${textColor}]${sub.sanction.trim()}[/COLOR][/I][/SIZE][/FONT][/INDENT]`
            );
          }
        }
      }
    }
  }

  // 3. Sanctions
  if (article.sanctions && article.sanctions.length > 0) {
    for (const sanction of article.sanctions) {
      let text = sanction.text.trim();
      // Remove leading dash if present
      if (text.startsWith('-') || text.startsWith('—') || text.startsWith('⁃')) {
        text = text.substring(1).trim();
      }
      lines.push(
        `[INDENT=3][FONT=${font}][SIZE=${size}][I][COLOR=${accentColor}]- [/COLOR][COLOR=${textColor}]${text}[/COLOR][/I][/SIZE][/FONT][/INDENT]`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Compiles a chapter header into XenForo BB-code.
 */
export function compileChapterHeaderBBCode(chapter: LawChapter, dividerImageUrl: string): string {
  if (chapter.rawHeaderBBCode) {
    return chapter.rawHeaderBBCode;
  }

  const { font, size, accentColor, textColor } = FORUM_THEME;
  const num = chapter.numberRoman.replace(/^Глава\s+/i, '').replace(/\.$/, '').trim();

  return [
    `[CENTER][FONT=${font}][SIZE=${size}][IMG]${dividerImageUrl}[/IMG]`,
    '',
    `[COLOR=${accentColor}][B]Глава ${num}.[/B][/COLOR] [COLOR=${textColor}]${chapter.title.trim()}[/COLOR][/SIZE][/FONT][/CENTER]`
  ].join('\n');
}

/**
 * Compiles a full chapter with its header and all articles.
 */
export function compileChapterBBCode(chapter: LawChapter, dividerImageUrl: string): string {
  const header = compileChapterHeaderBBCode(chapter, dividerImageUrl);
  const articles = chapter.articles.map((art) => compileArticleBBCode(art)).join('\n');
  return `${header}\n\n${articles}`;
}

/**
 * Compiles a specific Part of a law for multi-part forum publishing.
 */
export function compileLawPartBBCode(law: StateLawDocument, partIndex: number): string {
  const { font, size, dividerImage, bannerImage } = FORUM_THEME;
  const banner = law.bannerImageUrl || bannerImage;
  const divider = law.dividerImageUrl || dividerImage;

  const partMeta = law.partsMeta?.find((p) => p.partIndex === partIndex);
  const chapters = law.chapters.filter((ch) => !ch.partIndex || ch.partIndex === partIndex);

  const parts: string[] = [];

  if (partMeta?.headerBBCode) {
    parts.push(partMeta.headerBBCode);
  } else {
    const partTitleSuffix = partMeta?.title ? `\n[SIZE=4][B]${partMeta.title}[/B][/SIZE]` : '';
    parts.push(
      `[CENTER][FONT=${font}][IMG]${banner}[/IMG]\n[B]${law.title}[/B]${partTitleSuffix}\n[SIZE=${size}][IMG]${divider}[/IMG]\n[/SIZE][/FONT][/CENTER]`
    );
  }

  for (const chapter of chapters) {
    parts.push(compileChapterBBCode(chapter, divider));
  }

  if (partMeta?.footerBBCode) {
    parts.push(partMeta.footerBBCode);
  } else {
    parts.push(`[CENTER][SIZE=${size}][FONT=${font}][IMG]${divider}[/IMG][/FONT][/SIZE][/CENTER]`);
  }

  const rawResult = parts.join('\n\n');
  const { balancedBBCode } = validateAndBalanceBBCode(rawResult);
  return balancedBBCode;
}

/**
 * Compiles an entire Law Document into pristine, forum-ready BB-code.
 */
export function compileFullLawBBCode(law: StateLawDocument): string {
  const { font, size, dividerImage, bannerImage } = FORUM_THEME;
  const banner = law.bannerImageUrl || bannerImage;
  const divider = law.dividerImageUrl || dividerImage;

  const parts: string[] = [];

  // 1. Top Cover & Banner
  parts.push(
    `[CENTER][FONT=${font}][IMG]${banner}[/IMG]\n[B]${law.title}[/B]\n[SIZE=${size}][IMG]${divider}[/IMG]\n[/SIZE][/FONT][/CENTER]`
  );

  // 2. Chapters & Articles
  for (const chapter of law.chapters) {
    parts.push(compileChapterBBCode(chapter, divider));
  }

  // 3. Final closing divider
  parts.push(`[CENTER][SIZE=${size}][FONT=${font}][IMG]${divider}[/IMG][/FONT][/SIZE][/CENTER]`);

  const rawResult = parts.join('\n\n');
  const { balancedBBCode } = validateAndBalanceBBCode(rawResult);
  return balancedBBCode;
}

