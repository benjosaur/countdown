import { QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { client, TABLE_NAME } from "../dynamo";
import {
  dbMetaWordTrainerSchema,
  dbWordTrainerMetaQuerySchema,
  dbWordTrainerWordSchema,
  type DbMetaWordTrainer,
  type DbUpdateWordTrainerFailAttempt,
  type DbUpdateWordTrainerSuccessAttempt,
  type DbWordTrainerMetaQuery,
  type DbWordTrainerWord,
} from "./schema";
import { generateLikelihood } from "../../utils/words";
import type { User } from "shared";

export class WordSessionRepository {
  async getUserOverallAndBucketMetaDataRecords(
    user: User
  ): Promise<DbWordTrainerMetaQuery[]> {
    // bucket sums and overall sums
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk AND begins_with(sK,:sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${user.sub}`,
        ":sk": `META#WORDTRAINER`,
      },
    });
    try {
      const result = await client.send(command);
      const parsedItems = dbWordTrainerMetaQuerySchema
        .array()
        .parse(result.Items);
      return parsedItems;
    } catch (error) {
      console.error("Repository Layer Error getting user targets:", error);
      throw error;
    }
  }

  async getUserWordRecordsForBucket(
    user: User,
    bucketIndex: number
  ): Promise<DbWordTrainerWord[]> {
    // bucket sums and overall sums
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pK = :pk AND begins_with(sK,:sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${user.sub}`,
        ":sk": `WORDTRAINER#BUCKET#${bucketIndex}`,
      },
    });
    try {
      const result = await client.send(command);
      const parsedItems = dbWordTrainerWordSchema.array().parse(result.Items);
      return parsedItems;
    } catch (error) {
      console.error(
        "Repository Layer Error getting user target word data:",
        error
      );
      throw error;
    }
  }

  async updateUserRecord(
    user: User,
    update: DbUpdateWordTrainerSuccessAttempt | DbUpdateWordTrainerFailAttempt
  ) {
    // need bucket id, word id, time taken, and which of the enums it was.

    const oldWordEntry = await this.getOldWordEntry(
      user,
      update.submittedBaselineWordEntry.bucketIndex,
      update.submittedBaselineWordEntry.index
    );

    const newAnagramCounters =
      update.category !== "fail"
        ? {
            ...oldWordEntry.anagramCounters,
            [update.chosenAnagram]:
              (oldWordEntry.anagramCounters[update.chosenAnagram] || 0) + 1,
          }
        : oldWordEntry.anagramCounters;

    // only compute new times and deltalikelihoods, count update left for ddb update expression
    const { changeInWordDeltaLikelihood, changeInWordAverageSuccessTime } =
      this.computeChangeInWordMetrics(oldWordEntry, update);

    const oldOverallMetadataEntry = await this.getOldOverallMetadataEntry(user);

    const { changeInOverallAverageSuccessTime } =
      this.computeChangeInOverallMetrics(oldOverallMetadataEntry, update);

    const transactWriteCommand = new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE_NAME,
            Key: {
              pK: `USER#${user.sub}`,
              sK: `WORDTRAINER#BUCKET#${update.submittedBaselineWordEntry.bucketIndex}#WORD#${update.submittedBaselineWordEntry.index}`,
            },
            UpdateExpression:
              "ADD #attemptCategory :one, #deltaLikelihood :changeInDeltaLikelihood, #averageSuccessTime :changeInAverageSuccessTime SET #anagramCounts = :anagramCounts",
            ExpressionAttributeNames: {
              "#attemptCategory": update.category,
              "#deltaLikelihood": "deltaLikelihood",
              "#averageSuccessTime": "averageSuccessTime",
              "#anagramCounts": "anagramCounters",
            },

            ExpressionAttributeValues: {
              ":one": 1,
              ":changeInAverageSuccessTime": changeInWordAverageSuccessTime,
              ":changeInDeltaLikelihood": changeInWordDeltaLikelihood,
              ":anagramCounts": newAnagramCounters,
            },
          },
        },
        {
          Update: {
            TableName: TABLE_NAME,
            Key: {
              pK: `USER#${user.sub}`,
              sK: `META#WORDTRAINER#BUCKET#${update.submittedBaselineWordEntry.bucketIndex}`,
            },
            UpdateExpression: "ADD #deltaLikelihood :changeInDeltaLikelihood",
            ExpressionAttributeNames: {
              "#deltaLikelihood": "deltaLikelihood",
            },
            ExpressionAttributeValues: {
              ":changeInDeltaLikelihood": changeInWordDeltaLikelihood,
            },
          },
        },
        {
          Update: {
            TableName: TABLE_NAME,
            Key: {
              pK: `USER#${user.sub}`,
              sK: `META#WORDTRAINER`,
            },
            UpdateExpression:
              "ADD #attemptCategory :one, #averageSuccessTime :changeInAverageSuccessTime, #deltaLikelihood :changeInDeltaLikelihood",
            ExpressionAttributeNames: {
              "#attemptCategory": update.category,
              "#averageSuccessTime": "averageSuccessTime",
              "#deltaLikelihood": "deltaLikelihood",
            },
            ExpressionAttributeValues: {
              ":one": 1,
              ":changeInAverageSuccessTime": changeInOverallAverageSuccessTime,
              ":changeInDeltaLikelihood": changeInWordDeltaLikelihood,
            },
          },
        },
      ],
    });
    try {
      await client.send(transactWriteCommand);
    } catch (error) {
      console.error("Error sending transaction write command:", error);
    }
    return {
      oldWordEntry,
      oldOverallMetadataEntry,
      changeInWordDeltaLikelihood,
      changeInWordAverageSuccessTime,
      changeInOverallAverageSuccessTime,
    };
  }

  private async getOldWordEntry(
    user: User,
    bucketIndex: number,
    wordIndex: number
  ): Promise<DbWordTrainerWord> {
    const oldWordEntriesInBucketData = await this.getUserWordRecordsForBucket(
      user,
      bucketIndex
    );

    let oldWordEntry = oldWordEntriesInBucketData.find((entry) => {
      const wordIndexInBucket = parseInt(entry.sK.split("#").pop()!);
      return wordIndexInBucket === wordIndex;
    });

    if (!oldWordEntry) {
      oldWordEntry = dbWordTrainerWordSchema.parse({
        pK: "",
        sK: "",
      });
    }
    return oldWordEntry;
  }

  async getOldOverallMetadataEntry(user: User) {
    const oldBucketsAndOverallMetadata =
      await this.getUserOverallAndBucketMetaDataRecords(user);

    let oldWordTrainerMetadata = oldBucketsAndOverallMetadata.find(
      (entry): entry is DbMetaWordTrainer => entry.sK == "META#WORDTRAINER"
    );

    if (!oldWordTrainerMetadata) {
      oldWordTrainerMetadata = dbMetaWordTrainerSchema.parse({
        pK: "",
        sK: "",
      });
    }
    return oldWordTrainerMetadata;
  }

  private computeChangeInWordMetrics(
    oldWordEntry: DbWordTrainerWord,
    update: DbUpdateWordTrainerSuccessAttempt | DbUpdateWordTrainerFailAttempt
  ) {
    //delta likelihood "delta" is strictly the running difference vs baseline likelihood @ 0 guesses. NOT delta in a time series/guess to guess sense.
    const {
      pK,
      sK,
      averageSuccessTime,
      deltaLikelihood,
      anagramCounters,
      ...oldCounts
    } = oldWordEntry;

    const newCounts = {
      ...oldCounts,
      [update.category]: oldWordEntry[update.category] + 1,
    };

    const newLikelihood = generateLikelihood({
      score: update.submittedBaselineWordEntry.score,
      ...newCounts,
    });

    const baseLikelihood = generateLikelihood({
      score: update.submittedBaselineWordEntry.score,
    });

    const changeInWordDeltaLikelihood =
      newLikelihood - baseLikelihood - deltaLikelihood;

    let changeInWordAverageSuccessTime = 0;

    const isFailure = update.category === "fail";

    if (!isFailure) {
      const { fail, ...oldSuccessCounts } = oldCounts;
      const rawAttempts = Object.values(oldSuccessCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      const newAverageTime =
        (rawAttempts * averageSuccessTime + update.timeTaken) /
        (rawAttempts + 1);
      changeInWordAverageSuccessTime = newAverageTime - averageSuccessTime;
    }
    return {
      changeInWordDeltaLikelihood,
      changeInWordAverageSuccessTime,
    };
  }

  private computeChangeInOverallMetrics(
    oldWordTrainerMetadata: DbMetaWordTrainer,
    update: DbUpdateWordTrainerSuccessAttempt | DbUpdateWordTrainerFailAttempt
  ) {
    const {
      pK: overallPk,
      sK: overallSk,
      averageSuccessTime: averageOverallSuccessTime,
      deltaLikelihood,
      ...oldOverallCounts
    } = oldWordTrainerMetadata;

    const { fail: overallFail, ...oldOverallSuccessCounts } = oldOverallCounts;

    let changeInOverallAverageSuccessTime = 0;

    const isFailure = update.category === "fail";

    if (!isFailure) {
      const rawOverallAttempts = Object.values(oldOverallSuccessCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      const newOverallAverageTime =
        (rawOverallAttempts * averageOverallSuccessTime + update.timeTaken) /
        (rawOverallAttempts + 1);
      averageOverallSuccessTime + update.timeTaken;
      changeInOverallAverageSuccessTime =
        newOverallAverageTime - averageOverallSuccessTime;
    }
    return {
      changeInOverallAverageSuccessTime,
    };
  }
}
