import { localRouter, publicProcedure } from "./trpc.ts";

export const wordTrainerRouter = localRouter({
  getNewGame: publicProcedure.query(async ({ ctx }) => {
    const game = await ctx.services.wordService.generatePuzzle();
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

export const localAppRouter = localRouter({
  wordTrainer: wordTrainerRouter,
});
