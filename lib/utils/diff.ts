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

/** Maps each index of `before` to its counterpart index in `after` (and vice
 * versa) by matching a stable identity key (e.g. a record `id`), so entries
 * that were only reordered — not added or removed — are recognized as the
 * same item even though their position changed. */
export function matchByKey<T>(before: T[], after: T[], keyFn: (item: T) => string): {
  beforeToAfter: (number | null)[];
  afterToBefore: (number | null)[];
} {
  const afterIndexByKey = new Map<string, number>();
  after.forEach((item, idx) => afterIndexByKey.set(keyFn(item), idx));
  const beforeIndexByKey = new Map<string, number>();
  before.forEach((item, idx) => beforeIndexByKey.set(keyFn(item), idx));

  const beforeToAfter = before.map((item) => afterIndexByKey.get(keyFn(item)) ?? null);
  const afterToBefore = after.map((item) => beforeIndexByKey.get(keyFn(item)) ?? null);
  return { beforeToAfter, afterToBefore };
}

/** Like matchByKey, but for plain strings that may repeat (e.g. skill
 * items) — matches equal strings one-to-one rather than by a separate key,
 * consuming each match so duplicates don't all bind to the same slot. */
export function matchExactStrings(before: string[], after: string[]): {
  beforeToAfter: (number | null)[];
  afterToBefore: (number | null)[];
} {
  const usedAfter = new Set<number>();
  const beforeToAfter: (number | null)[] = before.map(() => null);
  const afterToBefore: (number | null)[] = after.map(() => null);

  before.forEach((b, bi) => {
    const ai = after.findIndex((a, idx) => !usedAfter.has(idx) && a === b);
    if (ai !== -1) {
      usedAfter.add(ai);
      beforeToAfter[bi] = ai;
      afterToBefore[ai] = bi;
    }
  });

  return { beforeToAfter, afterToBefore };
}

/** Greedy, similarity-based matching for two lists of free text (e.g. resume
 * bullets) that may have been reordered, reworded, trimmed, or added to.
 * Unlike matchByKey, there's no stable id to rely on — pairs are chosen by
 * word overlap, so a reworded-but-recognizable bullet is still linked to its
 * original rather than showing up as one wholesale removal plus one
 * wholesale addition. */
export function matchTextLists(before: string[], after: string[]): {
  beforeToAfter: (number | null)[];
  afterToBefore: (number | null)[];
} {
  function similarity(a: string, b: string): number {
    if (a === b) return 1;
    const aw = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
    const bw = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
    if (aw.size === 0 || bw.size === 0) return 0;
    let shared = 0;
    for (const w of aw) if (bw.has(w)) shared++;
    return shared / Math.max(aw.size, bw.size);
  }

  const candidates: { bi: number; ai: number; score: number }[] = [];
  for (let bi = 0; bi < before.length; bi++) {
    for (let ai = 0; ai < after.length; ai++) {
      const score = similarity(before[bi], after[ai]);
      if (score > 0.4) candidates.push({ bi, ai, score });
    }
  }
  candidates.sort((x, y) => y.score - x.score);

  const usedBefore = new Set<number>();
  const usedAfter = new Set<number>();
  const beforeToAfter: (number | null)[] = before.map(() => null);
  const afterToBefore: (number | null)[] = after.map(() => null);

  for (const c of candidates) {
    if (usedBefore.has(c.bi) || usedAfter.has(c.ai)) continue;
    usedBefore.add(c.bi);
    usedAfter.add(c.ai);
    beforeToAfter[c.bi] = c.ai;
    afterToBefore[c.ai] = c.bi;
  }

  return { beforeToAfter, afterToBefore };
}
