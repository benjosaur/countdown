import { WordService } from "./word_trainer/service.ts";

export function createServices() {
  return {
    wordService: new WordService(),
  };
}
