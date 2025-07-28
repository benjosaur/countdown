import type { CreateAWSLambdaContextOptions } from "@trpc/server/adapters/aws-lambda";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { createServices } from "../../services";

export const createLambdaContext = async ({
  event,
  context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => {
  return {
    event,
    context,
    services: createServices(),
  };
};

export type Context = Awaited<ReturnType<typeof createLambdaContext>>;
