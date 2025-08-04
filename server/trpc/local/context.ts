import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createServices } from "../../services";
import { getUser } from "../prod/context";

export const createExpressContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  return {
    req,
    res,
    user: await getUser(req),
    services: createServices(),
  };
};

export type ExpressContext = Awaited<ReturnType<typeof createExpressContext>>;
