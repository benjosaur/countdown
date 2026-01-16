import z from "zod";
import { dbEntrySchema } from "../schema";
import type { BaselineWordEntry } from "../../const/baseline_gen";

export const dbWordTrainerWordSchema = dbEntrySchema.extend({
  // pK - USER#{user.sub}
  // sK - WORDTRAINER#BUCKET#{n}#WORD#{word in lower}
  successDirectUnder10: z.number().default(0),
  successDirectBetween10And20: z.number().default(0),
  fail: z.number().default(0),
  successIndirectUnder10: z.number().default(0),
  successIndirectBetween10And20: z.number().default(0),
  averageSuccessTime: z.number().default(0),
  deltaLikelihood: z.number().default(0),
  anagramCounters: z.record(z.string(), z.number()).default({}),
});

export const dbMetaWordTrainerBucketSchema = dbEntrySchema.extend(
  // pK - USER#{user.sub}
  // sK - META#WORDTRAINER#BUCKET#{n}
  dbWordTrainerWordSchema.pick({ deltaLikelihood: true }).shape,
);

export const dbMetaWordTrainerSchema = dbEntrySchema.extend(
  // pK - USER#{user.sub}
  // sK - META#WORDTRAINER
  dbWordTrainerWordSchema.pick({
    successDirectUnder10: true,
    successDirectBetween10And20: true,
    fail: true,
    averageSuccessTime: true,
    deltaLikelihood: true,
  }).shape,
);

export const dbWordTrainerMetaQuerySchema = z.union([
  dbMetaWordTrainerSchema,
  dbMetaWordTrainerBucketSchema,
]);

export type DbWordTrainerWord = z.infer<typeof dbWordTrainerWordSchema>;

export type DbMetaWordTrainer = z.infer<typeof dbMetaWordTrainerSchema>;
export type DbMetaWordTrainerBucket = z.infer<
  typeof dbMetaWordTrainerBucketSchema
>;
export type DbWordTrainerMetaQuery = z.infer<
  typeof dbWordTrainerMetaQuerySchema
>;

export interface DbUpdateWordTrainerFailAttempt {
  submittedBaselineWordEntry: BaselineWordEntry;
  category: "fail";
}

export interface DbUpdateWordTrainerSuccessAttempt extends Omit<
  DbUpdateWordTrainerFailAttempt,
  "category"
> {
  submittedBaselineWordEntry: BaselineWordEntry;
  chosenAnagram: string;
  timeTaken: number;
  category: keyof Omit<
    DbWordTrainerWord,
    | "pK"
    | "sK"
    | "averageSuccessTime"
    | "deltaLikelihood"
    | "anagramCounters"
    | "fail"
  >;
}
