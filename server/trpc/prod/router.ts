import { router, publicProcedure } from "./trpc.ts";

export const wordTrainerRouter = router({
  getNewGame: publicProcedure.query(async ({ ctx }) => {
    const game = await ctx.services.wordSessionService.generatePuzzle(
      ctx.user.sub
    );
    return game;
  }),

  // submitResult: publicProcedure
  //   .input(GameResultSchema)
  //   .mutation(async ({ input }) => {
  //     // Here you could save results to a database
  //     console.log("Game result:", input);
  //     return { success: true };
  //   }),
});

export const prodAppRouter = router({
  wordTrainer: wordTrainerRouter,
});

export type AppRouter = typeof prodAppRouter;
