import { wordPuzzleSubmissionSchema } from "shared";
import { localRouter, publicProcedure } from "./trpc.ts";

export const wordTrainerRouter = localRouter({
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
      return response;
    }),
});

export const localAppRouter = localRouter({
  wordTrainer: wordTrainerRouter,
});
