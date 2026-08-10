import { parseLawWithStateMachine, normalizeLawText, convertDocumentTreeToStateLaw } from './lawStateMachineParser';
import type { StateLaw } from '../data/stateLaws';

/**
 * Extract text from a PDF file using pdfjs-dist.
 * Runs entirely client-side — no server needed.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Use CDN worker to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageText = '';
    let lastY = null;

    for (const rawItem of textContent.items) {
      const item = rawItem as any;
      if (item.str === undefined) continue;
      
      const y = item.transform ? item.transform[5] : null;
      
      // If Y coordinate changed significantly (e.g. > 4 points) or hasEOL is true, it's a new line
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        pageText += '\n';
      } else if (item.hasEOL) {
        pageText += '\n';
      } else if (lastY !== null && item.str.trim() !== '') {
         // Same line, add a space if needed
         if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
           pageText += ' ';
         }
      }
      
      pageText += item.str;
      if (y !== null) lastY = y;
    }
    
    pages.push(pageText);
  }

  return pages.join('\n');
}

/**
 * Parse a PDF file into a structured StateLaw object.
 */
export async function parsePdfToStateLaw(file: File, customTitle?: string): Promise<StateLaw> {
  const rawText = await extractTextFromPdf(file);
  
  if (!rawText || rawText.trim().length < 50) {
    throw new Error('PDF-файл пуст или содержит слишком мало текста.');
  }

  const normalized = normalizeLawText(rawText);
  const title = customTitle || file.name.replace(/\.pdf$/i, '').trim() || 'Загруженный закон';
  const tree = parseLawWithStateMachine(normalized, title);
  const law = convertDocumentTreeToStateLaw(tree);

  if (law.articles.length === 0) {
    throw new Error('Не удалось распознать ни одной статьи в PDF. Проверьте формат документа.');
  }

  return law;
}
