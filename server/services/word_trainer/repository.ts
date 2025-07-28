import wordsCSV from "../../const/useful_words.csv?raw";

interface WordData {
  rank: number;
  word: string;
  anagrams: string[];
  length: number;
}

export class WordRepository {
  getWords(): WordData[] {
    const words = this.loadWordData();
    return words;
  }

  private loadWordData() {
    const words: WordData[] = [];
    const lines = wordsCSV.split("\n");

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const columns = line.split(",");
      if (columns.length < 3) continue;

      const rankStr = columns[0];
      const wordColumn = columns[2];

      if (!rankStr || !wordColumn) continue;

      const rank = parseInt(rankStr);
      if (isNaN(rank)) continue;

      const wordsInCell = wordColumn.split("/");
      const firstWord = wordsInCell[0];
      if (!firstWord) continue;

      const primaryWord = firstWord;
      const anagrams = wordsInCell.slice(1).map((w: string) => w);

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
