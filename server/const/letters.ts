export interface LetterFrequency {
  [letter: string]: number;
}

export const MIN_VOWELS = 3;
export const MIN_CONSONANTS = 4;
export const TOTAL_LETTERS = 9;
export const MAX_RETRIES = 100;

export const THREE_VOWEL_CHANCE = 0.28;
export const FOUR_VOWEL_CHANCE = 0.6;
export const FIVE_VOWEL_CHANCE = 0.12;

export const LETTER_DISTRIBUTION: LetterFrequency = {
  A: 15,
  E: 21,
  I: 13,
  O: 13,
  U: 5,
  B: 2,
  C: 3,
  D: 6,
  F: 2,
  G: 3,
  H: 2,
  J: 1,
  K: 1,
  L: 5,
  M: 4,
  N: 8,
  P: 4,
  Q: 1,
  R: 9,
  S: 9,
  T: 9,
  V: 1,
  W: 1,
  X: 1,
  Y: 1,
  Z: 1,
};

export const VOWELS = new Set(["A", "E", "I", "O", "U"]);
export const CONSONANTS = new Set([
  "B",
  "C",
  "D",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "V",
  "W",
  "X",
  "Y",
  "Z",
]);
