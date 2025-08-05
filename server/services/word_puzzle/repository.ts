import type { JsonUsefulWordsRow } from "./schema";
import rawWordsData from "../../const/useful_words.json";
import type { WordData } from "shared";

export class WordPuzzleRepository {
  getWords(): WordData[] {
    const words: WordData[] = [];

    const wordsData = rawWordsData as JsonUsefulWordsRow[];
    for (const row of wordsData) {
      const index = row.index;
      if (!index) continue;

      const wordColumn = row.words;
      if (!wordColumn) continue;

      const wordsInCell = wordColumn.split("/");

      const anagrams = wordsInCell.map((w: string) => w.trim()).filter(Boolean);

      if (anagrams.length === 0)
        throw new Error(
          `No words found for index ${index}, row: ${JSON.stringify(row)}`
        );

      // Only include words with length <= 9
      if (anagrams[0] && anagrams[0].length <= 9) {
        const wordData: WordData = {
          index,
          anagrams,
          length: anagrams[0].length,
        };

        words.push(wordData);
      }
    }

    return words;
  }
}
