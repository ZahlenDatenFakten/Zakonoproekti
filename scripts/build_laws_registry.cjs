const fs = require('fs');
const path = require('path');
const lawsMetadata = require('./lawsMetadata.cjs');

// Clean BBCode helper to strip tags for text matching
function stripBBCode(text) {
  if (!text) return '';
  return text
    .replace(/\[SPOILER="?([^"\]]*)"?\][\s\S]*?\[\/SPOILER\]/gi, '')
    .replace(/\[ATTACH[^\]]*\][0-9]+\[\/ATTACH\]/gi, '')
    .replace(/\[IMG[^\]]*\][\s\S]*?\[\/IMG\]/gi, '')
    .replace(/\[\/?[a-zA-Z0-9_-]+(?:\s+[^\]]*|=[^\]]*)?\]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractTitleAndDisposition(rawAfterNumber) {
  if (!rawAfterNumber) return { title: undefined, dispositionPrefix: '' };
  const text = rawAfterNumber.trim();
  if (!text) return { title: undefined, dispositionPrefix: '' };

  if (/^[а-яa-z]/.test(text)) {
    return { title: undefined, dispositionPrefix: text };
  }

  const isSentence = /(?:признается|является|наказывается|имеет\s+право|влечет|обязан|запрещено|состоит|включает|может|подлежит|относится)/i.test(text);

  const splitMatch = text.match(/^([А-ЯЁA-Z][^.:]{2,45})\.\s+(.*)$/);
  if (splitMatch && !/(?:признается|является|имеет|наказывается)/i.test(splitMatch[1])) {
    return {
      title: splitMatch[1].trim(),
      dispositionPrefix: splitMatch[2].trim()
    };
  }

  const bracketMatch = text.match(/^[\[\(]([^\]\)]+)[\]\)]\s*(.*)$/);
  if (bracketMatch) {
    return {
      title: bracketMatch[1].trim(),
      dispositionPrefix: bracketMatch[2].trim()
    };
  }

  if (text.length <= 45 && !text.includes('.') && !isSentence) {
    return {
      title: text,
      dispositionPrefix: ''
    };
  }

  return { title: undefined, dispositionPrefix: text };
}

function parseRawSanctions(raw) {
  const sanctions = [];
  const lines = raw.split(/\r?\n/);
  lines.forEach(l => {
    const clean = stripBBCode(l).trim();
    if (/^[-—⁃]\s*(?:штраф|наказание|административный|лишение|изъятие|предупреждение|выговор|увольнение)/i.test(clean) ||
        /(?:штраф\s+до|\$[0-9\.]+|судимост)/i.test(clean)) {
      sanctions.push({
        id: 's_' + Math.random().toString(36).substring(2, 9),
        text: clean.replace(/^[-—⁃]\s*/, '').trim()
      });
    }
  });
  return sanctions.length > 0 ? sanctions : undefined;
}

function parseRawClauses(raw) {
  const clauses = [];
  const lines = raw.split(/\r?\n/);
  lines.forEach(l => {
    const clean = stripBBCode(l).trim();
    const match = clean.match(/^(Исключение|Примечание|Пояснение)[\s\d]*:\s*(.*)$/i);
    if (match) {
      clauses.push({
        id: 'c_' + Math.random().toString(36).substring(2, 9),
        prefix: match[1] + ':',
        content: match[2].trim()
      });
    }
  });
  return clauses.length > 0 ? clauses : undefined;
}

function parseLawFile(filePath, partIndex = 1) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  let headerLines = [];
  let footerLines = [];
  const chapters = [];
  let currentChapter = null;
  let currentArticle = null;
  let hasEncounteredChapterOrArticle = false;

  lines.forEach((line, lineIdx) => {
    const clean = stripBBCode(line).trim();

    // 1. Chapter detection
    const chapterMatch = clean.match(/^(?:Глава|ГЛАВА|Раздел|РАЗДЕЛ)\s+([IVXLCDM\d]+|[A-Z\d]+)[\.:\s-]*(.*)$/i);
    const isChapterLine = chapterMatch && (
      line.includes('[CENTER]') || 
      line.includes('COLOR=rgb(236, 199, 129)') || 
      line.includes('COLOR=#') || 
      line.includes('[B]Глава') || 
      line.includes('[B]Раздел') ||
      line.includes('[SIZE=') ||
      chapterMatch[1]
    );

    if (isChapterLine) {
      hasEncounteredChapterOrArticle = true;
      const chapterPrefixLines = [];

      if (currentArticle) {
        // Pop any trailing dividers or center tags that actually belong to the upcoming chapter
        while (currentArticle.rawLines.length > 1) {
          const last = currentArticle.rawLines[currentArticle.rawLines.length - 1];
          const stripped = stripBBCode(last);
          if (!stripped || last.includes('[CENTER]') || last.includes('[IMG]') || last.includes('eoOV353.png') || last.includes('bQG2kud.png')) {
            chapterPrefixLines.unshift(currentArticle.rawLines.pop());
          } else {
            break;
          }
        }

        if (currentChapter) {
          currentChapter.articles.push(finalizeArticle(currentArticle));
        }
        currentArticle = null;
      }

      // Check if previous chapter had 0 articles (e.g. "Раздел 1. Преступление")
      if (currentChapter && currentChapter.articles.length === 0 && !currentChapter.title.includes('УТРАТИЛА') && !currentChapter.title.includes('Упразднена')) {
        const sectionTitle = currentChapter.title;
        const prevHeader = currentChapter.rawHeaderBBCode;
        chapters.pop(); // Remove the empty section shell
        currentChapter = {
          id: 'ch_' + chapterMatch[1] + '_' + partIndex + '_' + lineIdx,
          numberRoman: chapterMatch[1],
          title: sectionTitle ? `${sectionTitle} — ${chapterMatch[2] ? chapterMatch[2].trim() : ''}` : (chapterMatch[2] ? chapterMatch[2].trim() : ''),
          partIndex,
          rawHeaderBBCode: [prevHeader, ...chapterPrefixLines, line].filter(Boolean).join('\n'),
          articles: []
        };
      } else {
        currentChapter = {
          id: 'ch_' + chapterMatch[1] + '_' + partIndex + '_' + lineIdx,
          numberRoman: chapterMatch[1],
          title: chapterMatch[2] ? chapterMatch[2].trim() : '',
          partIndex,
          rawHeaderBBCode: [...chapterPrefixLines, line].filter(Boolean).join('\n'),
          articles: []
        };
      }

      chapters.push(currentChapter);
      return;
    }

    // 2. Article detection
    let articleMatch = clean.match(/^Статья\s+([\d]+(?:\.[\d]+)*)[\.:\s-]*(.*)$/i);
    if (!articleMatch) {
      const numMatch = clean.match(/^([\d]+(?:\.[\d]+)+|\d+\.)[\s-]*(.*)$/);
      if (numMatch && (line.includes('[B]') || line.includes('INDENT') || line.includes('COLOR'))) {
        articleMatch = [numMatch[0], numMatch[1].replace(/\.$/, ''), numMatch[2]];
      }
    }

    if (articleMatch) {
      hasEncounteredChapterOrArticle = true;
      if (!currentChapter) {
        currentChapter = {
          id: 'ch_implicit_' + partIndex,
          numberRoman: 'I',
          title: 'Основные положения',
          partIndex,
          articles: []
        };
        chapters.push(currentChapter);
      }

      if (currentArticle) {
        currentChapter.articles.push(finalizeArticle(currentArticle));
      }

      const { title } = extractTitleAndDisposition(articleMatch[2]);

      currentArticle = {
        id: 'art_' + articleMatch[1].replace(/\./g, '_') + '_' + partIndex + '_' + lineIdx,
        articleNumber: articleMatch[1],
        title: title || undefined,
        rawLines: [line],
        partIndex
      };
      return;
    }

    if (currentArticle) {
      currentArticle.rawLines.push(line);
    } else if (!hasEncounteredChapterOrArticle) {
      headerLines.push(line);
    } else {
      footerLines.push(line);
    }
  });

  if (currentArticle && currentChapter) {
    currentChapter.articles.push(finalizeArticle(currentArticle));
  }

  return {
    headerBBCode: headerLines.join('\n').trim(),
    footerBBCode: footerLines.join('\n').trim(),
    chapters,
    rawBBCode: content
  };
}

function finalizeArticle(art) {
  const rawText = art.rawLines.join('\n');
  let cleanLines = art.rawLines.map(l => stripBBCode(l)).filter(l => l.length > 0);
  
  if (cleanLines.length > 0) {
    const artNumRegex = new RegExp(`^Статья\\s+${art.articleNumber.replace(/\\./g, '\\.')}[\\.:\\s-]*`, 'i');
    if (artNumRegex.test(cleanLines[0])) {
      cleanLines[0] = cleanLines[0].replace(artNumRegex, '').trim();
    }
    if (art.title && cleanLines[0].startsWith(art.title)) {
      cleanLines[0] = cleanLines[0].substring(art.title.length).replace(/^[\.:\s-]+/, '').trim();
    }
    cleanLines = cleanLines.filter(l => l.length > 0);
  }

  const cleanBody = cleanLines.join('\n');
  return {
    id: art.id,
    articleNumber: art.articleNumber,
    title: art.title || undefined,
    content: cleanBody,
    clauses: parseRawClauses(rawText),
    sanctions: parseRawSanctions(rawText),
    updatedAt: new Date('2026-09-01').toISOString(),
    partIndex: art.partIndex,
    rawBBCode: rawText
  };
}

const compiledRegistry = {};
const lawsDir = path.join(process.cwd(), 'laws');

lawsMetadata.forEach(meta => {
  const allChapters = [];
  const partsMeta = [];
  let totalArticles = 0;

  meta.parts.forEach(part => {
    const filePath = path.join(lawsDir, part.sourceFile);
    if (!fs.existsSync(filePath)) {
      console.error(`File missing: ${filePath}`);
      return;
    }
    const parsed = parseLawFile(filePath, part.partIndex);
    allChapters.push(...parsed.chapters);
    
    partsMeta.push({
      partIndex: part.partIndex,
      title: part.title,
      sourceFile: part.sourceFile,
      headerBBCode: parsed.headerBBCode,
      footerBBCode: parsed.footerBBCode,
      rawBBCode: parsed.rawBBCode
    });
  });

  allChapters.forEach(ch => {
    totalArticles += ch.articles.length;
  });

  // Calculate master authentic raw BBCode
  const masterRawBBCode = partsMeta.map(p => p.rawBBCode).join('\n\n');

  compiledRegistry[meta.id] = {
    id: meta.id,
    code: meta.code,
    title: meta.title,
    shortTitle: meta.shortTitle,
    category: meta.category,
    subCategory: meta.subCategory,
    bannerImageUrl: meta.bannerImageUrl,
    dividerImageUrl: meta.dividerImageUrl,
    chapters: allChapters,
    version: 1,
    updatedAt: new Date('2026-09-01').toISOString(),
    partsMeta,
    activeBBCode: masterRawBBCode,
    totalArticlesCount: totalArticles
  };

  console.log(`[COMPILED] ${meta.title} (${meta.id}) -> ${allChapters.length} chapters, ${totalArticles} articles`);
});

const tsOutput = `// AUTO-GENERATED LAWS REGISTRY - 100% FAITHFUL REPRODUCTION
// Generated: ${new Date().toISOString()}
import type { StateLawDocument } from '../types/lawAst';

export const COMPILED_LAWS_REGISTRY: Record<string, StateLawDocument> = ${JSON.stringify(compiledRegistry, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/compiledLawsRegistry.ts'), tsOutput, 'utf8');
console.log('SUCCESS: Written src/data/compiledLawsRegistry.ts');
