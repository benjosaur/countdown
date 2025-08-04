import { WordPuzzleService } from "../word_puzzle/service";
import baseline from "../../const/baseline_1000_words.json";
import { WordSessionRepository } from "./repository";
import {
  dbMetaWordTrainerSchema,
  dbWordTrainerWordSchema,
  type DbMetaWordTrainer,
  type DbMetaWordTrainerBucket,
} from "./schema";
import type { WordPuzzle } from "shared";
import z from "zod";

interface OverallMetadata {
  successUnder10: number;
  successBetween10And20: number;
  fail: number;
  averageSuccessTime: number;
}

interface WordMetadata {
  successUnder10: number;
  successBetween10And20: number;
  fail: number;
  successIndirectUnder10: number;
  successIndirectBetween10And20: number;
  averageSuccessTime: number;
  anagramCounters: Record<string, number>;
}

interface GetPuzzleResult {
  puzzle: WordPuzzle;
  metadata: {
    word: WordMetadata;
    overall: OverallMetadata;
  };
}

interface OverallBucketLikelihoodEntry {
  bucketIndex: number;
  likelihoodSum: number;
}

interface OverallWordLikelihoodEntryWithMetadata extends WordMetadata {
  wordIndex: number;
  likelihoodSum: number;
}

export class WordSessionService {
  private wordSessionRepository = new WordSessionRepository();
  private wordPuzzleService = new WordPuzzleService();

  async getPuzzle(user: User): Promise<GetPuzzleResult> {
    // Get word index
    // - Load in baseline of top 1000 & baseline bucket sums & baseline sum.
    // - Load in DynamoDB bucket delta sum metadatas and overall delta sum metadata
    // - Compute running dict of actual overall sum and bucket sums
    // - Let sampledLikelihood = floor of math.random*overallLikelihoodSum
    // - Find which bucket this lives in
    // - Take sampledLikelihood - sum up to this bucket
    // - Find which index this lives in
    // - Generate puzzle for this word index.
    // - Return puzzle and also append overall meta AND word data. (FE will display deltas that should mirror BE changes)

    const { userBucketLikelihoods, overallMetadata } =
      await this.getOverallBucketLikelihoodsAndMetadata(user);

    const overallLikelihoodSum = userBucketLikelihoods.reduce(
      (sum, record) => sum + record.likelihoodSum,
      0
    );

    const sampledLikelihood = Math.floor(Math.random() * overallLikelihoodSum);

    const chosenBucketIndex = this.findBucketContainingSampledLikelihood(
      sampledLikelihood,
      userBucketLikelihoods
    );

    const residualSampledLikelihoodWithinBucket =
      sampledLikelihood -
      userBucketLikelihoods.reduce((sum, record, index) => {
        if (index < chosenBucketIndex) {
          return sum + record.likelihoodSum;
        }
        return sum;
      }, 0);

    const userWordLikelihoodsInBucketWithMetadata =
      await this.getOverallWordLikelihoodsInBucketAndMetadata(
        user,
        chosenBucketIndex
      );

    const chosenWordIndex = this.findWordEntryContainingSampledLikelihood(
      residualSampledLikelihoodWithinBucket,
      userWordLikelihoodsInBucketWithMetadata
    );

    const chosenUserWordEntry = userWordLikelihoodsInBucketWithMetadata.find(
      (entry) => entry.wordIndex === chosenWordIndex
    )!;

    const puzzle = await this.wordPuzzleService.generatePuzzle(chosenWordIndex);

    return {
      puzzle,
      metadata: {
        word: chosenUserWordEntry,
        overall: overallMetadata,
      },
    };
  }

  private async getOverallBucketLikelihoodsAndMetadata(user: User): Promise<{
    userBucketLikelihoods: OverallBucketLikelihoodEntry[];
    overallMetadata: OverallMetadata;
  }> {
    const dbUserMetaRecords =
      await this.wordSessionRepository.getTargetWordsUserMetaRecords(user);

    const dbOverallMetadata =
      dbUserMetaRecords.find(
        (record): record is DbMetaWordTrainer =>
          record.sK === "META#WORDTRAINER"
      ) ?? {};

    let overallMetadata: OverallMetadata;
    try {
      overallMetadata = dbMetaWordTrainerSchema
        .omit({ pK: true, sK: true })
        .parse(dbOverallMetadata);
    } catch (error) {
      console.error("Error parsing Overall Metadata", error);
      throw error;
    }

    const userBucketDeltaLikelihoods = dbUserMetaRecords
      .filter((record): record is DbMetaWordTrainerBucket => {
        const isBucketSumRecord = record.sK.startsWith(
          "META#WORDTRAINER#BUCKET"
        );
        return isBucketSumRecord;
      })
      .map((record) => {
        const bucketIndex = record.sK.split("#").pop();
        if (!bucketIndex) {
          throw new Error(`Bucket index: ${bucketIndex} not found in record`);
        }
        return {
          bucketIndex: parseInt(bucketIndex),
          deltaLikelihood: record.deltaLikelihood,
        };
      });

    const overallUserBucketRecords = baseline.buckets.map((bucket) => {
      const matchedUserBucket = userBucketDeltaLikelihoods.find(
        (record) => record.bucketIndex === bucket.index
      ) ?? {
        bucketIndex: bucket.index,
        deltaLikelihood: 0,
      };
      return {
        bucketIndex: bucket.index,
        likelihoodSum: bucket.likelihoodSum + matchedUserBucket.deltaLikelihood,
      };
    });

    return {
      overallMetadata,
      userBucketLikelihoods: overallUserBucketRecords,
    };
  }

  private findBucketContainingSampledLikelihood(
    sampledLikelihood: number,
    overallUserBucketRecords: OverallBucketLikelihoodEntry[]
  ): number {
    let cumulativeSum = 0;
    for (let i = 0; i < overallUserBucketRecords.length; i++) {
      const record = overallUserBucketRecords[i];
      if (!record) throw new Error(`Record at index ${i} is undefined`);
      cumulativeSum += record.likelihoodSum;
      if (sampledLikelihood < cumulativeSum) {
        return i; // Return the index of the bucket containing the sampled likelihood
      }
    }
    throw new Error(
      `No valid bucket found for sampled likelihood ${sampledLikelihood}`
    );
  }
  private async getOverallWordLikelihoodsInBucketAndMetadata(
    user: User,
    bucketIndex: number
  ): Promise<OverallWordLikelihoodEntryWithMetadata[]> {
    const userWordDeltaLikelihoodsInBucket =
      await this.wordSessionRepository.getTargetWordsUserRecordsInBucket(
        user,
        bucketIndex
      );

    const overallWordEntriesInBucket = baseline.wordEntries
      .filter((wordEntry) => wordEntry.bucketIndex === bucketIndex)
      .map((baselineEntry) => {
        const matchedUserWordEntry = userWordDeltaLikelihoodsInBucket.find(
          (userEntry) =>
            parseInt(userEntry.sK.split("#").pop()!) === baselineEntry.index
        ) ?? {
          wordIndex: baselineEntry.index,
        };

        let parsedUserWordEntry;
        try {
          parsedUserWordEntry = dbWordTrainerWordSchema
            .omit({ pK: true, sK: true })
            .extend({ wordIndex: z.number() })
            .parse(matchedUserWordEntry);
        } catch (error) {
          console.error("Error parsing user word entry", error);
          throw error;
        }

        const { deltaLikelihood, ...wordEntry } = parsedUserWordEntry;

        const likelihoodSum = baselineEntry.likelihood + deltaLikelihood;
        return {
          likelihoodSum,
          ...wordEntry,
        };
      });
    return overallWordEntriesInBucket;
  }

  private findWordEntryContainingSampledLikelihood(
    residualSampledLikelihood: number,
    overallWordEntriesInBucket: OverallWordLikelihoodEntryWithMetadata[]
  ): number {
    let cumulativeSum = 0;
    for (let i = 0; i < overallWordEntriesInBucket.length; i++) {
      const record = overallWordEntriesInBucket[i];
      if (!record) throw new Error(`Record at index ${i} is undefined`);
      cumulativeSum += record.likelihoodSum;
      if (residualSampledLikelihood < cumulativeSum) {
        return record.wordIndex; // Return the index of the word entry containing the sampled likelihood
      }
    }
    throw new Error(
      `No valid word entry found for sampled likelihood ${residualSampledLikelihood}`
    );
  }
}

// Failed Submission
// Update Fail of Target.
//    - Update by Finding bucket index via baseline lookup via index

// Successful Submission
// Input 1. WordId/Rank 2. Submitted Word 3. As Primary or Secondary? 4. Record (Time or Fail)
// Possibilities (FE Should ensure anything submitted to BE is at least target word length AND valid from letter scramble)
// => 1. Submitted Word is NOT in dictionary
// => 2. Submitted Word IS in dictionary BUT NOT in tracked top 1000
// => 3. Submitted Word IS in dictionary AND in tracked top 1000 BUT NOT Target Word
// => 4. Submitted Word IS in dictionary AND in tracked top 1000 AND Target Word

// 1. Return Error
// 2. Return OK
// 3. Update SuccessIndirect10/Between10And20 in DDB Table. & Return OK
//    - Update by Finding bucket index via baseline lookup via rank id
// 4. Update Success10/SuccessBetween10And20 of Target.
//    - Update by Finding bucket index via baseline lookup via rank id

// All Success Table updates should include which anagram of the primary words was used
