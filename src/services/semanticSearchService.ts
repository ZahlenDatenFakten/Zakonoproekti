import { pipeline, env } from '@xenova/transformers';
import type { StateLawArticle } from '../data/stateLaws';

// Run in browser, disable local models
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor: any = null;
let isLoadingModel = false;

// Event target to broadcast loading progress
export const semanticSearchEvents = new EventTarget();

export async function getExtractor() {
  if (extractor) return extractor;
  if (isLoadingModel) {
    // wait until loaded
    while (isLoadingModel) {
      await new Promise(r => setTimeout(r, 100));
    }
    return extractor;
  }

  isLoadingModel = true;
  semanticSearchEvents.dispatchEvent(new CustomEvent('loading', { detail: { status: 'start' } }));
  
  try {
    extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
      progress_callback: (x: any) => {
        semanticSearchEvents.dispatchEvent(new CustomEvent('progress', { detail: x }));
      }
    });
  } catch (error) {
    console.error('Failed to load semantic model', error);
    semanticSearchEvents.dispatchEvent(new CustomEvent('error', { detail: error }));
  } finally {
    isLoadingModel = false;
    semanticSearchEvents.dispatchEvent(new CustomEvent('loading', { detail: { status: 'done' } }));
  }
  
  return extractor;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const ex = await getExtractor();
  if (!ex) return [];
  // Use mean pooling and normalize for cosine similarity
  const output = await ex(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Memory cache for article embeddings
const articleEmbeddingsCache = new Map<string, number[]>();

export async function clearEmbeddingsCache() {
  articleEmbeddingsCache.clear();
}

export async function searchArticlesSemantically(
  query: string,
  articles: StateLawArticle[],
  threshold: number = 0.35
): Promise<{ article: StateLawArticle; score: number }[]> {
  if (!query.trim()) return [];
  
  const queryEmb = await getEmbedding(query);
  if (queryEmb.length === 0) return [];
  
  const results: { article: StateLawArticle; score: number }[] = [];

  for (const art of articles) {
    let artEmb = articleEmbeddingsCache.get(art.id);
    if (!artEmb) {
      const artText = `${art.title}\n${art.content}`;
      artEmb = await getEmbedding(artText);
      if (artEmb.length > 0) {
        articleEmbeddingsCache.set(art.id, artEmb);
      }
    }

    if (artEmb && artEmb.length > 0) {
      const score = cosineSimilarity(queryEmb, artEmb);
      if (score >= threshold) {
        results.push({ article: art, score });
      }
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}
