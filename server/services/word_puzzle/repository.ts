interface WordData {
  rank: number;
  word: string;
  anagrams: string[];
  length: number;
}

interface CSVRow {
  [key: string]: string;
}

export class WordPuzzleRepository {
  getWords(): WordData[] {
    const words: WordData[] = [];

    // Cast the imported JSON data
    const wordsData = require("../../const/useful_words.json") as CSVRow[];

    for (const row of wordsData) {
      // Get the rank - look for common rank column names
      const rankStr = row.rank || row.Rank || row["0"] || Object.values(row)[0];
      if (!rankStr) continue;

      const rank = parseInt(rankStr);
      if (isNaN(rank)) continue;

      // Get the word column - look for common word column names
      const wordColumn =
        row.word ||
        row.Word ||
        row.words ||
        row.Words ||
        row["2"] ||
        Object.values(row)[2];
      if (!wordColumn) continue;

      // Parse words separated by "/"
      const wordsInCell = wordColumn.split("/");
      const firstWord = wordsInCell[0]?.trim();
      if (!firstWord) continue;

      const primaryWord = firstWord;
      const anagrams = wordsInCell
        .slice(1)
        .map((w: string) => w.trim())
        .filter(Boolean);

      // Only include words with length <= 9
      if (primaryWord && primaryWord.length <= 9) {
        const wordData: WordData = {
          rank,
          word: primaryWord,
          anagrams,
          length: primaryWord.length,
        };

        words.push(wordData);
      }
    }

    return words;
  }
}
