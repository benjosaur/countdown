interface LikelihoodProps {
  score: number;
  successUnder10?: number;
  successBetween10And20?: number;
  successIndirectly?: number;
  fail?: number;
}

export function generateLikelihood({
  score,
  successUnder10 = 0,
  successBetween10And20 = 0,
  successIndirectly = 0,
  fail = 0,
}: LikelihoodProps): number {
  const historyScore =
    1 +
    successUnder10 +
    0.5 * successBetween10And20 +
    0.25 * successIndirectly -
    fail;
  const historyMultiplier = 1 / Math.max(historyScore, 1);
  return historyMultiplier * score;
}
