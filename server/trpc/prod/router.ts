import { wordPuzzleSubmissionSchema } from "shared";
import { router, publicProcedure } from "./trpc.ts";

export const wordTrainerRouter = router({
  getNewGame: publicProcedure.query(async ({ ctx }) => {
    const game = await ctx.services.wordSessionService.getPuzzle(ctx.user);
    return game;
  }),
  submitResult: publicProcedure
    .input(wordPuzzleSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.services.wordSessionService.updateSubmission(
        ctx.user,
        input
      );
    }),
});

export const prodAppRouter = router({
  wordTrainer: wordTrainerRouter,
});

export type AppRouter = typeof prodAppRouter;
