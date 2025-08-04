import { WordPuzzleService } from "./word_puzzle/service.ts";

export function createServices() {
  return {
    wordPuzzleService: new WordPuzzleService(),
  };
}
