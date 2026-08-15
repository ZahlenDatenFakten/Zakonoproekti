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
 * High-precision Longest Common Subsequence (LCS) Legal Diff Engine
 * Produces clean inline additions (+ emerald highlight) and deletions (- ruby line-through)
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

  // Tokenize by word, legal symbols, punctuation and whitespace boundaries
  const tokenize = (text: string) => text.match(/[\wА-Яа-яЁё0-9]+|[§№%()«»"".,;:\-\–\—\n]|\s+/g) || [];
  const wasTokens = tokenize(cleanWas);
  const becameTokens = tokenize(cleanBecame);

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

  edits.forEach((token, idx) => {
    const isWord = /[\wА-Яа-яЁё0-9]+/.test(token.value);

    if (token.type === 'removed') {
      if (isWord) removedWords++;
      const node = (
        <span
          key={`del_${idx}`}
          className="diff-token-removed"
          title="Исключаемый текст (-)"
        >
          {token.value}
        </span>
      );
      wasFormatted.push(node);
      unifiedFormatted.push(node);
    } else if (token.type === 'added') {
      if (isWord) addedWords++;
      const node = (
        <span
          key={`add_${idx}`}
          className="diff-token-added"
          title="Вносимый текст (+)"
        >
          {token.value}
        </span>
      );
      becameFormatted.push(node);
      unifiedFormatted.push(node);
    } else {
      const sameNodeWas = <span key={`sw_${idx}`} style={{ color: 'var(--text-primary)' }}>{token.value}</span>;
      const sameNodeBec = <span key={`sb_${idx}`} style={{ color: 'var(--text-primary)' }}>{token.value}</span>;
      const sameNodeUni = <span key={`su_${idx}`} style={{ color: 'var(--text-primary)' }}>{token.value}</span>;
      wasFormatted.push(sameNodeWas);
      becameFormatted.push(sameNodeBec);
      unifiedFormatted.push(sameNodeUni);
    }
  });

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
