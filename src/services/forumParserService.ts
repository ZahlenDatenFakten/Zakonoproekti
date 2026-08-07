import type { StateLaw, StateLawArticle } from '../data/stateLaws';

/**
 * Intelligent Forum Law Parser Service for forum.gtap5rp.com
 * Automatically extracts law titles, article numbers, article headers, and content
 */

export function parseForumTextToLaw(rawTextOrHtml: string, defaultTitle?: string): StateLaw {
  // Strip HTML tags if raw HTML was passed, but preserve line breaks
  let cleanedText = rawTextOrHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract Law Title
  let title = defaultTitle || 'Закон Штата';
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 120 && !firstLine.match(/^Статья\s+\d+/i)) {
      title = firstLine.replace(/^[#=*\s]+/, '').trim();
    }
  }

  // Regex pattern matching "Статья 1.1", "Статья 5.2", "Статья 12", "Глава 1. Статья 2"
  const articleRegex = /(?:Статья|Раздел)\s+(\d+(?:\.\d+)?)(?:\.|\:|\s+–|\s+—|\s+-)?\s*([^\n\r.]+)?/gi;

  const articles: StateLawArticle[] = [];
  const matches: { index: number; artNum: string; artTitle: string; fullMatch: string }[] = [];

  let match: RegExpExecArray | null;
  while ((match = articleRegex.exec(cleanedText)) !== null) {
    matches.push({
      index: match.index,
      artNum: `Статья ${match[1]}`,
      artTitle: (match[2] || '').trim(),
      fullMatch: match[0]
    });
  }

  if (matches.length === 0) {
    // Fallback: If no "Статья X.X" regex matched, treat paragraphs as sections
    articles.push({
      id: 'art_gen_' + Date.now(),
      articleNumber: 'Раздел 1',
      title: title,
      content: cleanedText.substring(0, 4000)
    });
  } else {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextIndex = i < matches.length - 1 ? matches[i + 1].index : cleanedText.length;
      
      const contentChunk = cleanedText.substring(current.index + current.fullMatch.length, nextIndex).trim();

      articles.push({
        id: 'art_' + Date.now() + '_' + i,
        articleNumber: current.artNum,
        title: current.artTitle || 'Положения нормы',
        content: contentChunk || 'Содержание статьи...'
      });
    }
  }

  const lawCode = title.match(/([А-ЯA-Z]{2,6})/)?.[1] || 'АКТ';

  return {
    id: 'law_forum_' + Date.now(),
    title: title,
    code: `${lawCode}-2026`,
    category: 'Законы с Форума',
    forumUrl: 'https://forum.gtap5rp.com',
    articles: articles
  };
}

/**
 * Fetch and Parse Law from forum URL using CORS proxies
 */
export async function fetchLawFromForumUrl(forumUrl: string): Promise<StateLaw> {
  const cleanUrl = forumUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    throw new Error('Введите корректную ссылку на тему форума (https://forum.gtap5rp.com/threads/...)');
  }

  // List of CORS Proxy gateways
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`
  ];

  let rawHtml = '';

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        rawHtml = await res.text();
        if (rawHtml && rawHtml.includes('Статья')) {
          break;
        }
      }
    } catch {
      // try next proxy
    }
  }

  if (!rawHtml || rawHtml.includes('Cloudflare') || rawHtml.includes('Just a moment')) {
    throw new Error('CLOUDFLARE_PROTECTED');
  }

  return parseForumTextToLaw(rawHtml);
}
