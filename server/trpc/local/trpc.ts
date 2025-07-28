import { initTRPC } from "@trpc/server";
import type { ExpressContext } from "./context";

export const t = initTRPC.context<ExpressContext>().create();

export const localRouter = t.router;
export const publicProcedure = t.procedure;
