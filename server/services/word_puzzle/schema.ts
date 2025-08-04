export interface WordData {
  index: number;
  anagrams: string[];
  length: number;
}

export interface JsonUsefulWordsRow {
  index: number;
  words: string;
  score: number;
}
