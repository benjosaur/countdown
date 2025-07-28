import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createServices } from "../../services";

export const createExpressContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  return {
    req,
    res,
    services: createServices(),
  };
};

export type ExpressContext = Awaited<ReturnType<typeof createExpressContext>>;
