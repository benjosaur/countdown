import { WordPuzzleService } from "./word_puzzle/service.ts";
import { WordSessionService } from "./word_session/service.ts";

export function createServices() {
  return {
    wordPuzzleService: new WordPuzzleService(),
    wordSessionService: new WordSessionService(),
  };
}
