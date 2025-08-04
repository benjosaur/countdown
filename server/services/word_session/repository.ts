import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { client, TABLE_NAME } from "../dynamo";
import {
  dbWordTrainerMetaQuerySchema,
  dbWordTrainerWordSchema,
  type DbWordTrainerMetaQuery,
  type DbWordTrainerWord,
} from "./schema";

export class WordSessionRepository {
  async getTargetWordsUserMetaRecords(
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
      console.log(result.Items);
      const parsedItems = dbWordTrainerMetaQuerySchema
        .array()
        .parse(result.Items);
      return parsedItems;
    } catch (error) {
      console.error("Repository Layer Error getting user targets:", error);
      throw error;
    }
  }

  async getTargetWordsUserRecordsInBucket(
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
}
