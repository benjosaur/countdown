import z from "zod";

export const dbEntrySchema = z.object({
  pK: z.string(),
  sK: z.string(),
});
