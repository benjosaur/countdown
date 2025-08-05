import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateLikelihood } from "../utils/words";

export interface BaselineWordEntry {
  index: number;
  words: string;
  score: number;
  likelihood: number;
  bucketIndex: number;
}

interface BucketMetadata {
  index: number;
  likelihoodSum: number;
}

interface BaselineWordData {
  wordEntries: BaselineWordEntry[];
  buckets: BucketMetadata[];
  overallLikelihoodSum: number;
}

export function getTop1000WordsWithLikelihoods(): BaselineWordData {
  const jsonPath = join(__dirname, "useful_words.json");
  const jsonContent = readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(jsonContent);

  const wordEntries: BaselineWordEntry[] = [];
  const buckets: BucketMetadata[] = [];
  let currentBucket = 0;
  let currentBucketSum = 0;
  let itemsInCurrentBucket = 0;
  let overallLikelihoodSum = 0;

  for (let i = 0; i < Math.min(1000, data.length); i++) {
    const item = data[i];
    const index = parseInt(item.index);
    const words = item.words;
    const score = parseInt(item.score);

    if (!words || isNaN(score)) continue;

    const likelihood = generateLikelihood({
      score,
    });

    overallLikelihoodSum += likelihood;

    // Check if we need to start a new bucket
    if (itemsInCurrentBucket === 40) {
      buckets.push({
        index: currentBucket,
        likelihoodSum: currentBucketSum,
      });
      currentBucket++;
      currentBucketSum = 0;
      itemsInCurrentBucket = 0;
    }

    wordEntries.push({
      index,
      words,
      score,
      likelihood,
      bucketIndex: currentBucket,
    });

    currentBucketSum += likelihood;
    itemsInCurrentBucket++;
  }

  // Add the last bucket if it has items
  if (itemsInCurrentBucket > 0) {
    buckets.push({
      index: currentBucket,
      likelihoodSum: currentBucketSum,
    });
  }

  return {
    wordEntries,
    buckets,
    overallLikelihoodSum,
  };
}

function exportTop1000WordsToJson(): void {
  const wordData = getTop1000WordsWithLikelihoods();
  const jsonPath = join(__dirname, "baseline_1000_words.json");

  writeFileSync(jsonPath, JSON.stringify(wordData, null, 2), "utf-8");
  console.log(`Exported ${wordData.wordEntries.length} words to ${jsonPath}`);
  console.log(`Total buckets: ${wordData.buckets.length}`);
}

exportTop1000WordsToJson();
