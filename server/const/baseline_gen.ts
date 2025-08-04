import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { generateLikelihood } from "../utils/words";

interface WordEntry {
  rank: number;
  word: string;
  usefulness: number;
  likelihood: number;
  bucket: number;
}

interface BucketMetadata {
  bucket: number;
  likelihoodSum: number;
}

interface WordData {
  entries: WordEntry[];
  buckets: BucketMetadata[];
  totalLikelihoodSum: number;
}

export function getTop1000WordsWithLikelihoods(): WordData {
  const jsonPath = join(__dirname, "useful_words.json");
  const jsonContent = readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(jsonContent);

  const entries: WordEntry[] = [];
  const buckets: BucketMetadata[] = [];
  let totalLikelihoodSum = 0;
  let currentBucket = 1;
  let currentBucketSum = 0;
  let itemsInCurrentBucket = 0;

  for (let i = 0; i < Math.min(1000, data.length); i++) {
    const item = data[i];
    const rank = parseInt(item.Rank);
    const word = item["Best Single Word"];
    const usefulness = parseInt(item["Usefulness Score"]);

    if (!word || isNaN(usefulness)) continue;

    const likelihood = generateLikelihood({
      usefulness,
    });

    // Check if we need to start a new bucket
    if (itemsInCurrentBucket === 40) {
      buckets.push({
        bucket: currentBucket,
        likelihoodSum: currentBucketSum,
      });
      currentBucket++;
      currentBucketSum = 0;
      itemsInCurrentBucket = 0;
    }

    entries.push({
      rank,
      word,
      usefulness,
      likelihood,
      bucket: currentBucket,
    });

    currentBucketSum += likelihood;
    totalLikelihoodSum += likelihood;
    itemsInCurrentBucket++;
  }

  // Add the last bucket if it has items
  if (itemsInCurrentBucket > 0) {
    buckets.push({
      bucket: currentBucket,
      likelihoodSum: currentBucketSum,
    });
  }

  return {
    entries,
    buckets,
    totalLikelihoodSum,
  };
}

function exportTop1000WordsToJson(): void {
  const wordData = getTop1000WordsWithLikelihoods();
  const jsonPath = join(__dirname, "baseline_1000_words.json");

  writeFileSync(jsonPath, JSON.stringify(wordData, null, 2), "utf-8");
  console.log(`Exported ${wordData.entries.length} words to ${jsonPath}`);
  console.log(`Total buckets: ${wordData.buckets.length}`);
  console.log(`Total likelihood sum: ${wordData.totalLikelihoodSum}`);
}

exportTop1000WordsToJson();
