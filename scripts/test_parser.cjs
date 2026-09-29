const fs = require('fs');
const path = require('path');

// Clean BBCode helper to strip tags for text matching
function stripBBCode(text) {
  return text.replace(/\[\/?(?:[A-Z0-9]+)(?:=[^\]]+)?\]/gi, '').trim();
}

const dir = path.join(process.cwd(), 'laws');
const files = fs.readdirSync(dir);

console.log(`Analyzing ${files.length} files...`);

let totalArticlesParsed = 0;
let totalChaptersParsed = 0;

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split(/\r?\n/);
  
  const chapters = [];
  let currentChapter = null;
  let currentArticle = null;
  const articles = [];
  
  lines.forEach((line, lineIdx) => {
    const clean = stripBBCode(line).trim();
    if (!clean) return;

    // 1. Chapter detection
    // Matches: "Глава I.", "Глава 1.", "ГЛАВА I.", "Раздел I.", "Раздел 1."
    const chapterMatch = clean.match(/^(?:Глава|ГЛАВА|Раздел|РАЗДЕЛ)\s+([IVXLCDM\d]+|[A-Z\d]+)[\.:\s]*(.*)$/i);
    if (chapterMatch && (line.includes('[CENTER]') || line.includes('COLOR=rgb(236, 199, 129)') || line.includes('COLOR=#') || line.includes('[B]Глава') || line.includes('[B]Раздел') || chapterMatch[1])) {
      if (currentArticle) {
        articles.push(currentArticle);
        currentArticle = null;
      }
      currentChapter = {
        number: chapterMatch[1],
        title: chapterMatch[2] ? chapterMatch[2].trim() : '',
        lineIdx
      };
      chapters.push(currentChapter);
      return;
    }

    // 2. Article detection
    // Patterns:
    // a) "Статья 9.1", "Статья 1.2.3", "Статья 1"
    // b) Direct number at line start e.g. "9.1", "1.2", "1.1.1", "1."
    let articleMatch = clean.match(/^Статья\s+([\d]+(?:\.[\d]+)*)[\.:\s-]*(.*)$/i);
    if (!articleMatch) {
      // Check for standalone numeric article like "1.1", "9.1", "1."
      const numMatch = clean.match(/^([\d]+(?:\.[\d]+)+|\d+\.)\s*(.*)$/);
      if (numMatch && (line.includes('[B]') || line.includes('INDENT') || line.includes('COLOR'))) {
        articleMatch = [numMatch[0], numMatch[1].replace(/\.$/, ''), numMatch[2]];
      }
    }

    if (articleMatch) {
      if (currentArticle) {
        articles.push(currentArticle);
      }
      currentArticle = {
        number: articleMatch[1],
        title: articleMatch[2] ? articleMatch[2].trim() : '',
        rawLines: [line],
        lineIdx
      };
    } else if (currentArticle) {
      currentArticle.rawLines.push(line);
    }
  });

  if (currentArticle) {
    articles.push(currentArticle);
  }

  totalChaptersParsed += chapters.length;
  totalArticlesParsed += articles.length;

  console.log(`[${file.slice(0, 45).padEnd(45)}] -> Chapters: ${String(chapters.length).padStart(2)} | Articles: ${String(articles.length).padStart(3)}`);
});

console.log('====================================');
console.log(`Total Chapters parsed: ${totalChaptersParsed}`);
console.log(`Total Articles parsed: ${totalArticlesParsed}`);
