import type { WordData } from "shared";
import type { BaselineWordEntry } from "../const/baseline_gen";

interface LikelihoodProps {
  score: number;
  successDirectUnder10?: number;
  successDirectBetween10And20?: number;
  successIndirectUnder10?: number;
  successIndirectBetween10And20?: number;
  fail?: number;
}

export function generateLikelihood({
  score,
  successDirectUnder10 = 0,
  successDirectBetween10And20 = 0,
  successIndirectUnder10 = 0,
  successIndirectBetween10And20 = 0,
  fail = 0,
}: LikelihoodProps): number {
  const historyScore =
    1 +
    successDirectUnder10 +
    0.5 * successDirectBetween10And20 +
    0.25 * (successIndirectUnder10 + successIndirectBetween10And20) -
    fail;
  const historyMultiplier = 1 / Math.max(historyScore, 1);
  return historyMultiplier * score;
}

export function convertBaselineEntryToWordData(
  entry: BaselineWordEntry
): WordData {
  const anagrams = entry.words
    .split("/")
    .map((w) => w.trim())
    .filter(Boolean);
  return {
    index: entry.index,
    anagrams: anagrams,
    length: anagrams[0]?.length ?? 0,
  };
}
