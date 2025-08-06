import { test, expect, describe } from "bun:test";
import { TEST_USER } from "../..";
import { WordSessionService } from "./service";

describe("WordSessionService", () => {
  test("should get puzzle for test user", async () => {
    const wordSessionService = new WordSessionService();

    try {
      const puzzle = await wordSessionService.getPuzzle(TEST_USER);

      console.log("Puzzle result:", puzzle);

      // Add assertions based on what you expect
      expect(puzzle).toBeDefined();
      expect(puzzle).not.toBeNull();
      // Add more specific assertions based on your puzzle structure
      // expect(puzzle).toHaveProperty('words');
      // expect(puzzle.words).toBeInstanceOf(Array);
    } catch (error) {
      console.error("Error occurred:", error);
      throw error;
    }
  });

  test("should handle invalid user gracefully", async () => {
    const wordSessionService = new WordSessionService();

    // Test with invalid user - adjust based on your expected behavior
    await expect(async () => {
      await wordSessionService.getPuzzle(null as any);
    }).toThrow(); // or .not.toThrow() if it should handle gracefully
  });

  test("should handle successful MAIDENS submission for index 891", async () => {
    const wordSessionService = new WordSessionService();

    const submission = {
      index: 891,
      isFailed: false,
      submittedWord: "MAIDENS",
      targetAnagrams: ["MAIDENS", "MEDIANS", "MEDINAS", "SIDEMAN"],
      timeTaken: 8.8,
    };

    try {
      const result = await wordSessionService.updateSubmission(
        TEST_USER,
        submission
      );

      console.log("Submission result:", result);

      // Verify the response structure
      expect(result).toBeDefined();
      expect(result.isInDictionary).toBe(true);
      expect(result.isInTop1000).toBe(true);

      // Should have overall metadata
      expect(result.overall).toBeDefined();
      expect(typeof result.overall.oldAverageSuccessTime).toBe("number");
      expect(typeof result.overall.changeInAverageSuccessTime).toBe("number");

      // Should have target word data since this is a direct success
      expect(result.targetWord).toBeDefined();
      expect(result.targetWord.wordData).toBeDefined();
      expect(result.targetWord.wordData.index).toBe(891);
      expect(typeof result.targetWord.changeInLikelihood).toBe("number");
      expect(typeof result.targetWord.oldAverageSuccessTime).toBe("number");
      expect(typeof result.targetWord.changeInAverageSuccessTime).toBe(
        "number"
      );

      // Should not have submittedWord data since it's the target word
      expect(result.submittedWord).toBeUndefined();
    } catch (error) {
      console.error("Error occurred during submission:", error);
      throw error;
    }
  });
});
