import type { CreateAWSLambdaContextOptions } from "@trpc/server/adapters/aws-lambda";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { createServices } from "../../services";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { TEST_USER } from "../..";

// Create JWT verifier for your Cognito User Pool
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID! ?? "eu-west-2_vaqScMy2f",
  tokenUse: "id", // or "id" depending on which token you're using
  clientId: process.env.COGNITO_CLIENT_ID! ?? "1fi0a5cr78o2jijhmnt4jfkvdt", // Optional, only if you want to verify client ID
});

export const getUser = async (reqOrEvent: any): Promise<User> => {
  if (process.env.NODE_ENV === "development") {
    return TEST_USER;
  }

  try {
    const authHeader =
      reqOrEvent.headers.authorization ||
      reqOrEvent.headers.Authorization ||
      reqOrEvent.headers["Authorization"];

    if (!authHeader) {
      console.log("No authorization header found");
      throw new Error("Unauthorized");
    }

    const trimmedHeader = authHeader.trim();
    if (!trimmedHeader.startsWith("Bearer ")) {
      console.log("Authorization header does not start with Bearer");
      throw new Error("Unauthorized");
    }

    const token = trimmedHeader.substring(7).trim();
    if (!token) {
      console.log("No token found after Bearer");
      throw new Error("Unauthorized");
    }

    // Verify the JWT token with Cognito
    const payload = await jwtVerifier.verify(token);

    if (
      !payload.email ||
      !payload.given_name ||
      !payload.family_name ||
      !payload.sub
    ) {
      console.log(
        `JWT payload is missing required fields: ${JSON.stringify(payload)}`
      );
      throw new Error("Unauthorized");
    }

    const user: User = {
      sub: payload.sub,
      email: payload.email.toString(),
      firstName: payload.given_name.toString(),
      lastName: payload.family_name.toString(),
    };
    return user;
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("Unauthorized");
  }
};

export const createLambdaContext = async ({
  event,
  context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => {
  return {
    event,
    context,
    user: await getUser(event),
    services: createServices(),
  };
};

export type Context = Awaited<ReturnType<typeof createLambdaContext>>;
