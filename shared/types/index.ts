import z from "zod";

export const wordPuzzleSubmissionSchema = z.object({
  index: z.number(),
  targetAnagrams: z.array(z.string()),
  submittedWord: z.string().transform((arg) => arg.toUpperCase()),
  timeTaken: z.number(),
  isFailed: z.boolean(),
});

export interface WordData {
  index: number;
  anagrams: string[];
  length: number;
}
export interface WordPuzzle {
  letters: string;
  primaryWords: string[];
  correctWords: string[];
  index: number;
}

export interface WordPuzzleSubmission {
  index: number;
  targetAnagrams: string[];
  submittedWord: string;
  timeTaken: number;
  isFailed: boolean;
}

export interface WordPuzzleSubmissionResponse {
  isInDictionary: boolean;
  isInTop1000: boolean;
  // below provided in success cases.
  overall: {
    oldLikelihood?: number;
    oldAverageSuccessTime?: number;
    changeInAverageSuccessTime?: number;
  };
  targetWord: {
    // should already have wordData in FE
    wordData: WordData;
    oldLikelihood?: number;
    // below is same for overall's change in likelihood
    changeInLikelihood?: number;
    oldAverageSuccessTime?: number;
    changeInAverageSuccessTime?: number;
  };
  submittedWord?: {
    wordData: WordData;
    // below only available if in tracked words (top 1000)
    oldLikelihood?: number;
    // below would be same for overall's change in likelihood
    changeInLikelihood?: number;
    oldAverageSuccessTime?: number;
    changeInAverageSuccessTime?: number;
  };
}
