import { wordPuzzleSubmissionSchema } from "shared";
import { router, protectedProcedure } from "./trpc.ts";

export const wordTrainerRouter = router({
  getNewGame: protectedProcedure.query(async ({ ctx }) => {
    const game = await ctx.services.wordSessionService.getPuzzle(ctx.user);
    return game;
  }),
  submitResult: protectedProcedure
    .input(wordPuzzleSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const response = await ctx.services.wordSessionService.updateSubmission(
        ctx.user,
        input
      );
      return response;
    }),
});

export const prodAppRouter = router({
  wordTrainer: wordTrainerRouter,
});

export type AppRouter = typeof prodAppRouter;
