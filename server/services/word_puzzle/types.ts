// deprecated ??

export interface DictionaryWordEntry {
  index: number;
  alphagram: string;
  words: string[];
  removedAnagrams: string;
  length: number;
  mostFrequent: number;
  usefulness: number;
  bestSingle: string;
  takes: string;
  validBefore2015: boolean;
}

export interface LetterDistribution {
  letter: string;
  frequency: number;
  type: "vowel" | "consonant";
}

export interface LetterPool {
  [letter: string]: number;
}
