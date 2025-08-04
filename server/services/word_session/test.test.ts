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
});
