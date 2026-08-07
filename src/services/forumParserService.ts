import type { StateLaw, StateLawArticle } from '../data/stateLaws';

/**
 * Advanced Multi-Proxy Forum Law Parser for forum.gta5rp.com
 * Supports regex pattern extraction for codes, laws, chapters, and articles
 */

export function parseForumTextToLaw(rawTextOrHtml: string, defaultTitle?: string): StateLaw {
  if (!rawTextOrHtml) {
    throw new Error('Пустой текст для парсинга');
  }

  // 1. Clean HTML markup preserving line breaks
  let cleanedText = rawTextOrHtml
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

  const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract Law Title from thread title or first clean line
  let title = defaultTitle || '';
  if (!title && lines.length > 0) {
    for (const l of lines) {
      if (l.length > 5 && l.length < 140 && !l.match(/^(статья|раздел|глава)/i)) {
        title = l.replace(/^[#=*\s]+/, '').trim();
        break;
      }
    }
  }
  if (!title) title = 'Закон Штата San Andreas';

  // Article Regex matching patterns like "Статья 1.1", "Статья 10", "Раздел 5", "Статья 1. "
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
    // Fallback: split by double newlines into sections if no "Статья" keyword found
    const chunks = cleanedText.split(/\n\s*\n/).filter((c) => c.trim().length > 20);
    chunks.forEach((chunk, i) => {
      articles.push({
        id: 'art_par_' + Date.now() + '_' + i,
        articleNumber: `Раздел ${i + 1}`,
        title: `Положения части ${i + 1}`,
        content: chunk.trim()
      });
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

  const lawCodeMatch = title.match(/([А-ЯA-Z]{2,6})/);
  const lawCode = lawCodeMatch ? lawCodeMatch[1] : 'АКТ';

  return {
    id: 'law_forum_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title,
    code: `${lawCode}-SA`,
    category: 'Законы Штата',
    forumUrl: 'https://forum.gta5rp.com',
    articles: articles
  };
}

/**
 * Multi-Proxy Gateway Fetcher for Cloudflare Bypassing
 */
export async function fetchLawFromForumUrl(forumUrl: string): Promise<StateLaw> {
  const cleanUrl = forumUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    throw new Error('Введите корректную ссылку на тему форума (https://forum.gta5rp.com/threads/...)');
  }

  // 5 Proxy Gateway rotation
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`
  ];

  let fetchedText = '';

  for (const proxyUrl of proxyEndpoints) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200 && !text.includes('Just a moment') && !text.includes('Cloudflare')) {
          fetchedText = text;
          break;
        }
      }
    } catch {
      // try next proxy
    }
  }

  if (!fetchedText || fetchedText.includes('Cloudflare') || fetchedText.includes('Just a moment')) {
    throw new Error('CLOUDFLARE_PROTECTED');
  }

  return parseForumTextToLaw(fetchedText);
}
