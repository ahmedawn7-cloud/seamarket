export function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function scaleValue(value: number, minData: number, maxData: number, minScore: number, maxScore: number): number {
  if (maxData === minData) return maxScore;
  const scaled = ((value - minData) / (maxData - minData)) * (maxScore - minScore) + minScore;
  return clamp(scaled, minScore, maxScore);
}
