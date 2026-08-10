import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import type { StateLaw, StateLawArticle } from '../data/stateLaws';

export async function parsePdfWithAI(
  rawText: string,
  fileName: string,
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<StateLaw> {
  if (!apiKey) throw new Error('API Key is missing');

  onProgress?.('Инициализация Gemini AI...');
  
  const ai = new GoogleGenAI({ apiKey });

  const lawTitle = fileName.replace(/\.pdf$/i, '').trim();

  // We ask the model to return a structured JSON matching this schema
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      chapters: {
        type: Type.ARRAY,
        description: 'Список глав или разделов закона',
        items: {
          type: Type.OBJECT,
          properties: {
            chapterNum: { type: Type.STRING, description: 'Номер главы (например, "I" или "1")' },
            chapterTitle: { type: Type.STRING, description: 'Название главы (например, "Общие положения")' },
            articles: {
              type: Type.ARRAY,
              description: 'Список статей внутри главы',
              items: {
                type: Type.OBJECT,
                properties: {
                  articleNum: { type: Type.STRING, description: 'Номер статьи (например, "1.1" или "15.6")' },
                  articleTitle: { type: Type.STRING, description: 'Название статьи (если есть)' },
                  content: { 
                    type: Type.STRING, 
                    description: 'Полный текст статьи, включая все пункты и подпункты. Сохраняйте форматирование текста (переносы строк).' 
                  }
                },
                required: ['articleNum', 'content']
              }
            }
          },
          required: ['chapterNum', 'chapterTitle', 'articles']
        }
      },
      unattachedArticles: {
        type: Type.ARRAY,
        description: 'Статьи, которые не принадлежат ни одной главе',
        items: {
          type: Type.OBJECT,
          properties: {
            articleNum: { type: Type.STRING },
            articleTitle: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ['articleNum', 'content']
        }
      }
    },
    required: ['chapters', 'unattachedArticles']
  };

  onProgress?.('Отправка текста в нейросеть (это может занять 5-15 секунд)...');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Проанализируй следующий текст закона и преобразуй его в строго структурированный JSON. Игнорируй мусор (номера страниц, колонтитулы). Текст:\n\n${rawText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1 // Low temp for structured data extraction
      }
    });

    onProgress?.('Обработка ответа от ИИ...');

    const jsonText = response.text;
    if (!jsonText) throw new Error('Пустой ответ от ИИ');

    const data = JSON.parse(jsonText);
    
    // Map AI response to StateLaw
    const articles: StateLawArticle[] = [];
    let artIdx = 0;

    const processArt = (a: any, chRef?: string) => {
      articles.push({
        id: 'art_ai_' + Date.now() + '_' + artIdx++,
        articleNumber: `Статья ${a.articleNum}`,
        title: a.articleTitle || 'Положения статьи',
        content: a.content || 'Нет содержания',
        chapterRef: chRef
      });
    };

    if (data.chapters && Array.isArray(data.chapters)) {
      data.chapters.forEach((ch: any) => {
        const prefix = `Глава ${ch.chapterNum}. ${ch.chapterTitle}`;
        if (ch.articles && Array.isArray(ch.articles)) {
          ch.articles.forEach((a: any) => processArt(a, prefix));
        }
      });
    }

    if (data.unattachedArticles && Array.isArray(data.unattachedArticles)) {
      data.unattachedArticles.forEach((a: any) => processArt(a));
    }

    // Default cross-references will be built dynamically during save or UI render later,
    // or we can run the regex scanner on the result.
    const ABBREVIATION_RX = /\b(УАК|ПК|ДК|ТК|ЗАК|АК|СК)\b/g;
    const crossReferences: string[] = [];
    articles.forEach(art => {
      let abbrMatch;
      while ((abbrMatch = ABBREVIATION_RX.exec(art.content)) !== null) {
        if (!crossReferences.includes(abbrMatch[1])) crossReferences.push(abbrMatch[1]);
      }
    });

    const lawCodeMatch = lawTitle.match(/([А-ЯA-Z]{2,6})/);
    const lawCode = lawCodeMatch ? lawCodeMatch[1] : 'АКТ';

    return {
      id: 'law_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: lawTitle,
      code: `${lawCode}-SA`,
      category: 'Законы Штата',
      forumUrl: '',
      articles,
      crossReferences
    };

  } catch (error: any) {
    console.error('AI Parsing Error:', error);
    throw new Error('Ошибка ИИ: ' + (error.message || 'Неизвестная ошибка'));
  }
}
