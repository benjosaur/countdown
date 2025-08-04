// in repository schemas use default("") instead of shared nullable(), to give values to all optional fields.
// but on way in these need to be stripped so drop null fields after parsing.

import { DynamoDB, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const createRawClient = (): DynamoDBClient => {
  const isProd = process.env.NODE_ENV == "production";
  if (isProd) {
    return new DynamoDB();
  }

  return new DynamoDBClient({
    region: "eu-west-2",
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "dummy",
      secretAccessKey: "dummy",
    },
  });
};

export const TABLE_NAME = "Countdown";

export const client = DynamoDBDocumentClient.from(createRawClient());

export function dropNullFields<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map(dropNullFields)
      .filter(
        (value) => value !== "" && value !== null && value !== undefined
      ) as T;
  } else if (typeof input === "object" && input !== null) {
    const result = {} as any;
    for (const [key, value] of Object.entries(input)) {
      const cleanedValue = dropNullFields(value);
      if (
        cleanedValue !== "" &&
        cleanedValue !== null &&
        cleanedValue !== undefined
      ) {
        result[key] = cleanedValue;
      }
    }
    return result as T;
  }
  return input;
}
