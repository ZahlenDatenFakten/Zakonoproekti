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
    
    // Structure: map of Y coordinate (rounded) to array of items
    const linesMap = new Map<number, { str: string; x: number }[]>();

    for (const rawItem of textContent.items) {
      const item = rawItem as any;
      if (item.str === undefined || item.str.trim() === '') continue;
      
      const x = item.transform ? item.transform[4] : 0;
      const y = item.transform ? item.transform[5] : 0;
      
      // Group by Y with a tolerance of 4 points to handle slight misalignment
      let matchedY = Array.from(linesMap.keys()).find(key => Math.abs(key - y) < 4);
      if (matchedY === undefined) {
        matchedY = Math.round(y);
        linesMap.set(matchedY, []);
      }
      
      linesMap.get(matchedY)!.push({ str: item.str.trim(), x });
    }

    // PDF Y-coordinates typically start from the bottom left, so higher Y means higher on the page.
    // Sort Y descending to read top-to-bottom.
    const sortedYKeys = Array.from(linesMap.keys()).sort((a, b) => b - a);
    
    let pageText = '';
    let previousY: number | null = null;

    for (const yKey of sortedYKeys) {
      const itemsOnLine = linesMap.get(yKey)!;
      // Sort items on the line by X ascending (left-to-right)
      itemsOnLine.sort((a, b) => a.x - b.x);
      
      const lineStr = itemsOnLine.map(i => i.str).join(' ');
      
      if (previousY !== null) {
        // If the gap between lines is large (> 18 points), treat it as a new paragraph
        if (Math.abs(previousY - yKey) > 18) {
          pageText += '\n\n';
        } else {
          pageText += '\n';
        }
      }
      
      pageText += lineStr;
      previousY = yKey;
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
