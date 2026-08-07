import React from 'react';

export interface DiffResult {
  wasFormatted: React.ReactNode[];
  becameFormatted: React.ReactNode[];
}

/**
 * Word-level Diff Engine for LegalDraft Pro
 * Highlights deleted text in WAS column with strikethrough & red styling
 * Highlights newly added text in BECAME column with bold & green text styling
 */
export function computeWordDiff(wasText: string, becameText: string): DiffResult {
  if (!wasText && !becameText) {
    return { wasFormatted: [], becameFormatted: [] };
  }

  const wasWords = (wasText || '').split(/(\s+)/);
  const becameWords = (becameText || '').split(/(\s+)/);

  const becameSet = new Set(becameWords.map((w) => w.trim().toLowerCase()).filter(Boolean));
  const wasSet = new Set(wasWords.map((w) => w.trim().toLowerCase()).filter(Boolean));

  // Format WAS column: mark words missing in BECAME as DELETED (Strikethrough + Red)
  const wasFormatted: React.ReactNode[] = wasWords.map((word, idx) => {
    const clean = word.trim().toLowerCase();
    const isWhitespace = /^\s+$/.test(word);

    if (isWhitespace || !clean) {
      return <span key={`w_space_${idx}`}>{word}</span>;
    }

    const isDeleted = !becameSet.has(clean);
    if (isDeleted) {
      return (
        <span
          key={`was_del_${idx}`}
          style={{
            color: '#f87171',
            textDecoration: 'line-through',
            background: 'rgba(248, 113, 113, 0.15)',
            padding: '1px 4px',
            borderRadius: '4px',
            fontWeight: 600,
            margin: '0 1px'
          }}
          title="Удаляемый фрагмент нормы"
        >
          {word}
        </span>
      );
    }

    return <span key={`was_same_${idx}`}>{word}</span>;
  });

  // Format BECAME column: mark words missing in WAS as ADDED (Green text + bold)
  const becameFormatted: React.ReactNode[] = becameWords.map((word, idx) => {
    const clean = word.trim().toLowerCase();
    const isWhitespace = /^\s+$/.test(word);

    if (isWhitespace || !clean) {
      return <span key={`b_space_${idx}`}>{word}</span>;
    }

    const isAdded = !wasSet.has(clean);
    if (isAdded) {
      return (
        <span
          key={`bec_add_${idx}`}
          style={{
            color: '#34d399',
            fontWeight: 700,
            background: 'rgba(52, 211, 153, 0.18)',
            padding: '1px 5px',
            borderRadius: '4px',
            borderBottom: '1.5px solid #34d399',
            margin: '0 1px'
          }}
          title="Добавляемый фрагмент нормы"
        >
          {word}
        </span>
      );
    }

    return <span key={`bec_same_${idx}`}>{word}</span>;
  });

  return { wasFormatted, becameFormatted };
}
