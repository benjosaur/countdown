import { WordPuzzleService } from "../word_puzzle/service";
import baseline from "../../const/baseline_1000_words.json";
import { WordSessionRepository } from "./repository";
import {
  dbMetaWordTrainerSchema,
  dbWordTrainerWordSchema,
  type DbMetaWordTrainer,
  type DbMetaWordTrainerBucket,
  type DbUpdateWordTrainerSuccessAttempt,
  type DbUpdateWordTrainerFailAttempt,
  type DbWordTrainerWord,
} from "./schema";
import type {
  WordData,
  WordPuzzle,
  WordPuzzleSubmission,
  WordPuzzleSubmissionResponse,
} from "shared";
import z from "zod";
import { convertBaselineEntryToWordData } from "../../utils/words";

interface OverallMetadata {
  successDirectUnder10: number;
  successDirectBetween10And20: number;
  fail: number;
  averageSuccessTime: number;
}

interface WordMetadata {
  successDirectUnder10: number;
  successDirectBetween10And20: number;
  fail: number;
  successIndirectUnder10: number;
  successIndirectBetween10And20: number;
  averageSuccessTime: number;
  anagramCounters: Record<string, number>;
}

export interface GetPuzzleResult {
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

    const overallLikelihoodSum = baseline.overallLikelihoodSum;

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

  async updateSubmission(
    user: User,
    submission: WordPuzzleSubmission
  ): Promise<WordPuzzleSubmissionResponse> {
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
    // 4. Update Success10/successDirectBetween10And20 of Target.
    //    - Update by Finding bucket index via baseline lookup via rank id
    // All Success Table updates should include which anagram of the primary words was used

    // Find word index, find bucket index, find associated entry in db table and then update.
    const submittedWord = submission.submittedWord.toUpperCase();
    const isSubmittedWordTarget =
      submission.targetAnagrams.includes(submittedWord);

    // below targets only relevant for direct success/failures (else update indirects/not at all)
    const targetWordIndex = submission.index;
    const targetWordBaselineDictEntry = baseline.wordEntries.find(
      (wordEntry) => wordEntry.index === targetWordIndex
    );
    if (!targetWordBaselineDictEntry) {
      throw new Error(`Target word with index ${targetWordIndex} not found`);
    }

    if (isSubmittedWordTarget) {
      const update: DbUpdateWordTrainerSuccessAttempt = {
        submittedBaselineWordEntry: targetWordBaselineDictEntry,
        chosenAnagram: submittedWord,
        timeTaken: submission.timeTaken,
        category: this.getSuccessfulTimeCategory({
          time: submission.timeTaken,
          isSuccessDirect: true,
        }),
      };
      const {
        oldWordEntry: oldWordDbEntry,
        oldOverallMetadataEntry,
        changeInOverallAverageSuccessTime,
        changeInWordAverageSuccessTime,
        changeInWordDeltaLikelihood,
      } = await this.wordSessionRepository.updateUserRecord(user, update);
      return {
        isInDictionary: true,
        isInTop1000: true,
        overall: {
          oldLikelihood:
            oldOverallMetadataEntry.deltaLikelihood +
            baseline.overallLikelihoodSum,
          oldAverageSuccessTime: oldOverallMetadataEntry.averageSuccessTime,
          changeInAverageSuccessTime: changeInOverallAverageSuccessTime,
        },
        targetWord: {
          wordData: convertBaselineEntryToWordData(targetWordBaselineDictEntry),
          oldLikelihood: oldWordDbEntry.deltaLikelihood,
          changeInLikelihood: changeInWordDeltaLikelihood,
          oldAverageSuccessTime: oldWordDbEntry.averageSuccessTime,
          changeInAverageSuccessTime: changeInWordAverageSuccessTime,
        },
      };
    }

    if (submission.isFailed) {
      const update: DbUpdateWordTrainerFailAttempt = {
        submittedBaselineWordEntry: targetWordBaselineDictEntry,
        category: "fail",
      };
      const {
        oldWordEntry: oldWordDbEntry,
        oldOverallMetadataEntry,
        // below should be set to 0 and unchanged
        changeInOverallAverageSuccessTime,
        changeInWordAverageSuccessTime,
        changeInWordDeltaLikelihood,
      } = await this.wordSessionRepository.updateUserRecord(user, update);

      return {
        // if fail state activated by FE assume nothing relevant was submitted
        isInDictionary: false,
        isInTop1000: false,
        overall: {
          oldLikelihood:
            oldOverallMetadataEntry.deltaLikelihood +
            baseline.overallLikelihoodSum,
          oldAverageSuccessTime: oldOverallMetadataEntry.averageSuccessTime,
          changeInAverageSuccessTime: changeInOverallAverageSuccessTime,
        },
        targetWord: {
          wordData: convertBaselineEntryToWordData(targetWordBaselineDictEntry),
          oldLikelihood: oldWordDbEntry.deltaLikelihood,
          changeInLikelihood: changeInWordDeltaLikelihood,
          oldAverageSuccessTime: oldWordDbEntry.averageSuccessTime,
          changeInAverageSuccessTime: changeInWordAverageSuccessTime,
        },
      };
    }

    const matchedTop1000WordEntryToSubmitted = baseline.wordEntries.find(
      (entry) => entry.words.includes(submittedWord)
    );
    if (matchedTop1000WordEntryToSubmitted) {
      const update: DbUpdateWordTrainerSuccessAttempt = {
        submittedBaselineWordEntry: matchedTop1000WordEntryToSubmitted,
        timeTaken: submission.timeTaken,
        chosenAnagram: submittedWord,
        category: this.getSuccessfulTimeCategory({
          time: submission.timeTaken,
          isSuccessDirect: false,
        }),
      };
      const {
        oldWordEntry: oldWordDbEntry,
        oldOverallMetadataEntry,
        // below should be set to 0 and unchanged
        changeInOverallAverageSuccessTime,
        changeInWordAverageSuccessTime,
        changeInWordDeltaLikelihood,
      } = await this.wordSessionRepository.updateUserRecord(user, update);

      return {
        isInDictionary: true,
        isInTop1000: true,
        overall: {
          oldLikelihood:
            oldOverallMetadataEntry.deltaLikelihood +
            baseline.overallLikelihoodSum,
          oldAverageSuccessTime: oldOverallMetadataEntry.averageSuccessTime,
          changeInAverageSuccessTime: changeInOverallAverageSuccessTime,
        },
        targetWord: {
          wordData: convertBaselineEntryToWordData(targetWordBaselineDictEntry),
        },
        submittedWord: {
          wordData: convertBaselineEntryToWordData(targetWordBaselineDictEntry),
          oldLikelihood: oldWordDbEntry.deltaLikelihood,
          changeInLikelihood: changeInWordDeltaLikelihood,
          oldAverageSuccessTime: oldWordDbEntry.averageSuccessTime,
          changeInAverageSuccessTime: changeInWordAverageSuccessTime,
        },
      };
    }
    const matchedEntireDictEntryToSubmitted =
      await this.wordPuzzleService.checkWordInDict(submittedWord);
    if (matchedEntireDictEntryToSubmitted) {
      const oldOverallMetadataEntry =
        await this.wordSessionRepository.getOldOverallMetadataEntry(user);
      return {
        isInDictionary: true,
        isInTop1000: false,
        overall: {
          oldLikelihood:
            oldOverallMetadataEntry.deltaLikelihood +
            baseline.overallLikelihoodSum,
          oldAverageSuccessTime: oldOverallMetadataEntry.averageSuccessTime,
          changeInAverageSuccessTime: 0,
        },
        targetWord: {
          wordData: convertBaselineEntryToWordData(targetWordBaselineDictEntry),
        },
      };
    }
    // must still be incorrect despite not being explicitly flagged by FE. Should actually throw error here as FE should catch all errors.
    const update: DbUpdateWordTrainerFailAttempt = {
      submittedBaselineWordEntry: targetWordBaselineDictEntry,
      category: "fail",
    };
    const {
      oldWordEntry: oldWordDbEntry,
      oldOverallMetadataEntry,
      // below should be set to 0 and unchanged
      changeInOverallAverageSuccessTime,
      changeInWordAverageSuccessTime,
      changeInWordDeltaLikelihood,
    } = await this.wordSessionRepository.updateUserRecord(user, update);

    return {
      // if fail state activated by FE assume nothing relevant was submitted
      isInDictionary: false,
      isInTop1000: false,
      overall: {
        oldLikelihood:
          oldOverallMetadataEntry.deltaLikelihood +
          baseline.overallLikelihoodSum,
        oldAverageSuccessTime: oldOverallMetadataEntry.averageSuccessTime,
        changeInAverageSuccessTime: changeInOverallAverageSuccessTime,
      },
      targetWord: {
        wordData: convertBaselineEntryToWordData(targetWordBaselineDictEntry),
        oldLikelihood: oldWordDbEntry.deltaLikelihood,
        changeInLikelihood: changeInWordDeltaLikelihood,
        oldAverageSuccessTime: oldWordDbEntry.averageSuccessTime,
        changeInAverageSuccessTime: changeInWordAverageSuccessTime,
      },
    };
  }

  private async getOverallBucketLikelihoodsAndMetadata(user: User): Promise<{
    userBucketLikelihoods: OverallBucketLikelihoodEntry[];
    overallMetadata: OverallMetadata;
  }> {
    const dbUserMetaRecords =
      await this.wordSessionRepository.getUserOverallAndBucketMetaDataRecords(
        user
      );

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

    const sumUserBucketRecords = baseline.buckets.map((bucket) => {
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
      userBucketLikelihoods: sumUserBucketRecords,
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
      await this.wordSessionRepository.getUserWordRecordsForBucket(
        user,
        bucketIndex
      );

    const overallWordEntriesInBucket = baseline.wordEntries
      .filter((wordEntry) => wordEntry.bucketIndex === bucketIndex)
      .map((baselineEntry) => {
        const matchedUserWordEntry =
          userWordDeltaLikelihoodsInBucket.find(
            (userEntry) =>
              parseInt(userEntry.sK.split("#").pop()!) === baselineEntry.index
          ) ?? {};
        const matchedUserWordEntryWithIndex = {
          ...matchedUserWordEntry,
          wordIndex: baselineEntry.index,
        };

        let parsedUserWordEntry; // if doesnt exist then parsing will fill in blanks.
        try {
          parsedUserWordEntry = dbWordTrainerWordSchema
            .omit({ pK: true, sK: true })
            .extend({ wordIndex: z.number() })
            .parse(matchedUserWordEntryWithIndex);
        } catch (error) {
          console.error("Error parsing user word entry", error); // this is being thrown sometimes with wordIndex undefined.
          console.log(matchedUserWordEntryWithIndex, baselineEntry);
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

  private getSuccessfulTimeCategory({
    time,
    isSuccessDirect,
  }: {
    time: number;
    isSuccessDirect: boolean;
  }): keyof Omit<
    DbWordTrainerWord,
    | "pK"
    | "sK"
    | "averageSuccessTime"
    | "deltaLikelihood"
    | "anagramCounters"
    | "fail"
  > {
    if (isSuccessDirect && time < 10) {
      return "successDirectUnder10";
    } else if (isSuccessDirect && time >= 10) {
      return "successDirectBetween10And20";
    } else if (!isSuccessDirect && time < 10) {
      return "successIndirectUnder10";
    } else if (!isSuccessDirect && time >= 10) {
      return "successIndirectBetween10And20";
    } else {
      throw new Error(`Time: ${time}, Direct: ${isSuccessDirect} broke maths`);
    }
  }
}
