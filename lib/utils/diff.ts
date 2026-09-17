export type DiffToken = { text: string; type: "same" | "added" | "removed" };

/** Longest-common-subsequence based word diff. Good enough for short resume
 * bullets/sentences; not intended for huge documents. */
export function wordDiff(a: string, b: string): DiffToken[] {
  const aWords = a.split(/(\s+)/);
  const bWords = b.split(/(\s+)/);

  const m = aWords.length;
  const n = bWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = aWords[i] === bWords[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aWords[i] === bWords[j]) {
      tokens.push({ text: aWords[i], type: "same" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      tokens.push({ text: aWords[i], type: "removed" });
      i++;
    } else {
      tokens.push({ text: bWords[j], type: "added" });
      j++;
    }
  }
  while (i < m) tokens.push({ text: aWords[i++], type: "removed" });
  while (j < n) tokens.push({ text: bWords[j++], type: "added" });

  return tokens;
}
