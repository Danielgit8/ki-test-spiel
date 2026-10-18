export function levelScore(reference: number, moves: number, won: boolean): number {
  if (!won || moves <= 0) return 0;
  return Math.min(1, (reference / moves) ** 2);
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
