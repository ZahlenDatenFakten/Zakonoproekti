export interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export function computeWordDiff(oldStr: string, newStr: string): DiffToken[] {
  // Very simple word-level LCS algorithm
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  const matrix: number[][] = Array(oldWords.length + 1).fill(null).map(() => Array(newWords.length + 1).fill(0));

  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  let i = oldWords.length;
  let j = newWords.length;
  const result: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'unchanged', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      result.unshift({ type: 'added', value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      result.unshift({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }

  // Combine adjacent tokens of the same type for cleaner output
  const optimized: DiffToken[] = [];
  for (const token of result) {
    if (optimized.length > 0 && optimized[optimized.length - 1].type === token.type) {
      optimized[optimized.length - 1].value += token.value;
    } else {
      optimized.push({ ...token });
    }
  }

  return optimized;
}
