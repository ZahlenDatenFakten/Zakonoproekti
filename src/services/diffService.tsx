import React from 'react';

export interface DiffToken {
  type: 'same' | 'added' | 'removed';
  value: string;
}

export interface DiffResult {
  wasFormatted: React.ReactNode[];
  becameFormatted: React.ReactNode[];
  unifiedFormatted: React.ReactNode[];
  stats: {
    addedWords: number;
    removedWords: number;
    totalChanges: number;
  };
}

/**
 * 100% Exact Sequence LCS (Longest Common Subsequence) Legal Diff Engine
 * Accurately highlights exact deleted phrases in WAS column (- red strikethrough)
 * and newly inserted phrases in BECAME column (+ neon green background)
 */
export function computeWordDiff(wasText: string, becameText: string): DiffResult {
  const cleanWas = wasText || '';
  const cleanBecame = becameText || '';

  if (!cleanWas && !cleanBecame) {
    return {
      wasFormatted: [],
      becameFormatted: [],
      unifiedFormatted: [],
      stats: { addedWords: 0, removedWords: 0, totalChanges: 0 }
    };
  }

  // Tokenize by word boundaries including spaces and punctuation
  const wasTokens = cleanWas.match(/\S+|\s+/g) || [];
  const becameTokens = cleanBecame.match(/\S+|\s+/g) || [];

  const m = wasTokens.length;
  const n = becameTokens.length;

  // Build LCS matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wasTokens[i - 1] === becameTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack edit script
  let i = m;
  let j = n;
  const edits: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wasTokens[i - 1] === becameTokens[j - 1]) {
      edits.unshift({ type: 'same', value: wasTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      edits.unshift({ type: 'added', value: becameTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      edits.unshift({ type: 'removed', value: wasTokens[i - 1] });
      i--;
    }
  }

  let addedWords = 0;
  let removedWords = 0;

  const wasFormatted: React.ReactNode[] = [];
  const becameFormatted: React.ReactNode[] = [];
  const unifiedFormatted: React.ReactNode[] = [];

  // Special handling for brand new articles that didn't exist previously
  const isBrandNewArticle = cleanWas.includes('отсутствовала') || cleanWas.includes('отсутствовал');

  edits.forEach((token, idx) => {
    const isWord = /\S+/.test(token.value);

    if (token.type === 'removed') {
      if (isWord) removedWords++;
      const node = (
        <span
          key={`was_del_${idx}`}
          style={{
            color: '#ff7b72',
            textDecoration: 'line-through',
            background: 'rgba(248, 81, 73, 0.22)',
            border: '1px solid rgba(248, 81, 73, 0.45)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 700,
            margin: '0 2px',
            display: 'inline-block',
            lineHeight: 1.4
          }}
          title="Исключаемая норма (-)"
        >
          <span style={{ fontSize: '0.72rem', opacity: 0.85, marginRight: '3px', fontWeight: 900 }}>-</span>
          {token.value}
        </span>
      );
      wasFormatted.push(node);
      unifiedFormatted.push(node);
    } else if (token.type === 'added') {
      if (isWord) addedWords++;
      const node = (
        <span
          key={`bec_add_${idx}`}
          style={{
            color: '#56d364',
            fontWeight: 700,
            background: 'rgba(45, 164, 78, 0.25)',
            border: '1px solid rgba(63, 185, 80, 0.45)',
            padding: '2px 6px',
            borderRadius: '4px',
            margin: '0 2px',
            display: 'inline-block',
            lineHeight: 1.4,
            boxShadow: '0 0 8px rgba(63, 185, 80, 0.2)'
          }}
          title="Вносимая поправка (+)"
        >
          <span style={{ fontSize: '0.72rem', opacity: 0.85, marginRight: '3px', fontWeight: 900 }}>+</span>
          {token.value}
        </span>
      );
      becameFormatted.push(node);
      unifiedFormatted.push(node);
    } else {
      const sameNodeWas = <span key={`same_w_${idx}`} style={{ color: 'var(--text-primary)' }}>{token.value}</span>;
      const sameNodeBec = <span key={`same_b_${idx}`} style={{ color: 'var(--text-primary)' }}>{token.value}</span>;
      const sameNodeUni = <span key={`same_u_${idx}`} style={{ color: 'var(--text-primary)' }}>{token.value}</span>;
      wasFormatted.push(sameNodeWas);
      becameFormatted.push(sameNodeBec);
      unifiedFormatted.push(sameNodeUni);
    }
  });

  if (isBrandNewArticle && wasFormatted.length === 0) {
    wasFormatted.push(
      <span key="new_art_was" style={{ color: 'var(--text-accent)', fontStyle: 'italic', fontSize: '0.84rem' }}>
        ✨ Ранее статья в действующей редакции закона отсутствовала (Новая статья)
      </span>
    );
  }

  return {
    wasFormatted,
    becameFormatted,
    unifiedFormatted,
    stats: {
      addedWords,
      removedWords,
      totalChanges: addedWords + removedWords
    }
  };
}
