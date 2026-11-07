interface ScoreThreshold {
  threshold: number;
  score: number;
}

export function computeHealthSubScore(
  value: number,
  thresholds: ScoreThreshold[],
): number {
  // Thresholds must be sorted descending by threshold
  const sorted = [...thresholds].sort((a, b) => b.threshold - a.threshold);

  for (let i = 0; i < sorted.length; i++) {
    if (value >= sorted[i].threshold) {
      // If first threshold, return its score
      if (i === 0) return sorted[i].score;

      // Linear interpolation between this and the previous threshold
      const upper = sorted[i - 1];
      const lower = sorted[i];
      const span = upper.threshold - lower.threshold;
      if (!Number.isFinite(span) || span === 0) return lower.score;
      const ratio = (value - lower.threshold) / span;
      return lower.score + ratio * (upper.score - lower.score);
    }
  }

  return sorted[sorted.length - 1].score;
}
