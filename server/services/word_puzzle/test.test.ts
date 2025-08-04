import { describe, it, expect } from "bun:test";
import { WordService } from "./service";

describe("WordService", () => {
  describe("generatePuzzle", () => {
    it("should generate puzzle with 9 letters", async () => {
      const wordService = new WordService();
      const puzzle = await wordService.generatePuzzle();
      expect(puzzle.letters.length).toBe(9);
    });
  });
});

describe("WordService Private Functions", () => {
  describe("isDictWordPossibleTest", () => {
    const wordService = new WordService();
    it("should return true when dict word possible to form from chosen", () => {
      const result = wordService["isDictWordPossible"]("REDRAW", "DRAWERS");
      expect(result).toBe(true);
    });

    it("should return false when dict word cannot be formed form chosen", () => {
      const result = wordService["isDictWordPossible"]("APTEROUS", "KITTEN");
      expect(result).toBe(false);
    });
  });
});
