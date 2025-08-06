import type { LetterPool } from "./types";

import {
  LETTER_DISTRIBUTION,
  VOWELS,
  CONSONANTS,
  MAX_RETRIES,
  TOTAL_LETTERS,
  THREE_VOWEL_CHANCE,
  FOUR_VOWEL_CHANCE,
} from "../../const/letters";
import { WordPuzzleRepository } from "./repository";
import type { WordData, WordPuzzle } from "shared";

let cachedWords: WordData[] | null = null; // store outside class to avoid reloading on every instance creation

export class WordPuzzleService {
  private wordPuzzleRepository = new WordPuzzleRepository();
  private words: WordData[] = [];

  constructor() {
    if (cachedWords) {
      this.words = cachedWords;
    } else {
      this.words = this.wordPuzzleRepository.getWords();
      if (this.words.length === 0) {
        throw new Error("No words available in repository");
      }
      cachedWords = this.words;
    }
  }

  async generatePuzzle(wordIndex: number): Promise<WordPuzzle> {
    /*
    0. Decide if aim toward 3V, 4V, 5V based on distribution
    1. Select a random word from top 1000
    2. Find valid letters to fill remainder by 9
     - Letters should come from distribution of remaining letter pool
     - Letters should not form longer or equal other words than the target word+anagrams
     - Letters should also contain at least 3 vowels and 4 consonants as per countdown rules
     - If any fail, retry MAX_RETRIES times. Fall back to Xs otherwise.
    */
    const targetVowels =
      Math.random() < THREE_VOWEL_CHANCE
        ? 3
        : Math.random() < THREE_VOWEL_CHANCE + FOUR_VOWEL_CHANCE
        ? 4
        : 5;

    const targetWord = this.words[wordIndex];
    if (!targetWord) {
      throw new Error("No words available");
    }

    // have checked length of anagrams > 0 in repository
    const filteredWordPool = this.removeImpossibleWordsFromPool(
      targetWord.anagrams[0]!
    );

    const spacesLeftToFill = TOTAL_LETTERS - targetWord.anagrams[0]!.length;

    const filteredLetterPool = this.removeLettersFromLetterPool(
      targetWord.anagrams[0]!
    );

    const gameLetters = this.fillRemainingLetters(
      filteredLetterPool,
      filteredWordPool,
      targetWord.anagrams[0]!,
      spacesLeftToFill,
      targetVowels
    );

    const correctWords = [...targetWord.anagrams];

    for (const word of filteredWordPool) {
      if (word.anagrams[0]!.length < 5) continue; // Skip words that are too short. There are no words shorter than 5 letters in the top 1000.
      if (targetWord.anagrams[0]! == word.anagrams[0]!) continue;
      // if (word.length >= targetWord.length) continue; // This condition should not be met as fillRemainingLetters ensures we only fill with shorter words. In rare case it does then fine.
      if (
        !this.doLettersContainWordLetters(
          gameLetters.join(""),
          word.anagrams[0]!
        )
      ) {
        continue; // Word cannot be formed with available letters
      } else {
        const shorterValidWord = word.anagrams[0]!;
        correctWords.push(shorterValidWord, ...word.anagrams);
      }
    }

    const puzzle = {
      letters: this.scrambleLetters(gameLetters),
      primaryWords: targetWord.anagrams,
      correctWords: correctWords,
      index: targetWord.index,
    };
    // console.log(puzzle);
    return puzzle;
  }

  async checkWordInDict(submittedWord: string): Promise<WordData | null> {
    // for use by WordSessionService
    for (const entry of this.words) {
      if (entry.anagrams.includes(submittedWord.toUpperCase())) return entry;
      continue;
    }
    return null;
  }

  private removeLettersFromLetterPool(word: string): LetterPool {
    const newPool = { ...LETTER_DISTRIBUTION };
    for (const letter of word.toUpperCase()) {
      if (newPool[letter] == null) {
        // console.log(letter, "not in pool", newPool);
        throw new Error(`Letter ${letter} not found in pool`);
      }
      newPool[letter]--;
    }
    return newPool;
  }

  private fillRemainingLetters(
    letterPool: LetterPool,
    wordPool: WordData[],
    chosenWord: string,
    numberLeftToFill: number,
    targetVowels: number
  ): string[] {
    // sample candidate letters first then check constraints.
    for (let i = 0; i < MAX_RETRIES; i++) {
      // need a copy *here* to anchor conditional prob of below sample without replacement BUT if fail then need to reset letter pool.
      const letterPoolCopy = { ...letterPool };
      const letters: string[] = chosenWord.split("");
      for (let letterCount = 0; letterCount < numberLeftToFill; letterCount++) {
        const { vowelCount: currentVowelCount } = this.countVowelsAndConsonants(
          letters.join("")
        );
        if (currentVowelCount >= targetVowels) {
          // console.log(letters, "already enough vowels");
          letters.push(
            this.sampleLetterFromPool({
              letterPool: letterPoolCopy,
              isVowel: false,
            })
          );
          // console.log(letters, "already enough vowels");
        } else {
          // console.log(letters, "not enough vowels");
          letters.push(
            this.sampleLetterFromPool({
              letterPool: letterPoolCopy,
              isVowel: true,
            })
          );
          // console.log(letters, "not enough vowels");
        }
      }
      const { vowelCount, consonantCount } = this.countVowelsAndConsonants(
        letters.join("")
      );
      if (i === MAX_RETRIES - 1) {
        // Give Up Arm
        const remainingFilledWithX = letters.concat(
          Array(TOTAL_LETTERS - letters.length).fill("X")
        );
        if (remainingFilledWithX.length !== TOTAL_LETTERS) {
          throw new Error(
            `Unexpected: remainingFilledWithX length ${remainingFilledWithX.length} does not match TOTAL_LETTERS ${TOTAL_LETTERS}`
          );
        }
        return remainingFilledWithX;
      }
      if (vowelCount < 3 || consonantCount < 4)
        throw new Error(
          "Unexpected: vowel targeting should have prevented this from failing"
        );
      // Retry if letters can form better or equal words.
      if (this.hasEqualOrLongerWords(letters.join(""), wordPool, chosenWord)) {
        // console.log("failed here");
        continue;
      }
      return letters;
    }
    throw new Error("Unexpected: loop should always return");
  }

  private sampleLetterFromPool({
    letterPool,
    isVowel,
  }: {
    letterPool: LetterPool;
    isVowel: boolean;
  }): string {
    const frequencyMap: Record<string, number> = {};
    for (const letter in letterPool) {
      if (letterPool[letter] == null) {
        console.error(`Letter ${letter} not found in letter pool`);
        console.dir(letterPool);
        throw new Error(`Letter ${letter} not found in letter pool`);
      }
      if (letterPool[letter] > 0) {
        if (
          (isVowel && VOWELS.has(letter)) ||
          (!isVowel && CONSONANTS.has(letter))
        ) {
          frequencyMap[letter] = letterPool[letter];
        }
      }
    }

    if (Object.keys(frequencyMap).length === 0) {
      throw new Error("No valid letters available in pool");
    }

    return this.sampleItemFromFrequencyMapWithoutReplacement(frequencyMap);
  }

  private sampleItemFromFrequencyMapWithoutReplacement(
    frequencyMap: Record<string, number>
  ): string {
    // console.log(frequencyMap);
    const totalFrequency = Object.values(frequencyMap).reduce(
      (sum, freq) => sum + freq,
      0
    );
    const randomIndex = Math.floor(Math.random() * totalFrequency);
    let cumulativeCount = 0;
    for (const item in frequencyMap) {
      if (frequencyMap[item] == null) {
        console.error(`Item ${item} not found in frequency map`);
        console.dir(frequencyMap);
        throw new Error(`Item ${item} not found in frequency map`);
      }
      cumulativeCount += frequencyMap[item];
      if (cumulativeCount > randomIndex) {
        frequencyMap[item]--;
        return item;
      }
    }
    // console.log(frequencyMap, cumulativeCount, randomIndex);
    throw new Error("frequencyMap exhausted");
  }

  private isDictWordPossible(chosenWord: string, dictWord: string): boolean {
    const necessaryOverlap =
      chosenWord.length + dictWord.length - TOTAL_LETTERS;
    const sharedLetters = this.getSharedNumberOfLetters(chosenWord, dictWord);
    if (sharedLetters < necessaryOverlap) {
      return false;
    }
    return true;
  }

  private getSharedNumberOfLetters(
    chosenWord: string,
    dictWord: string
  ): number {
    const chosenLetterCounts: Record<string, number> = {};
    for (const letter of chosenWord) {
      chosenLetterCounts[letter] = (chosenLetterCounts[letter] || 0) + 1;
    }

    let sharedCount = 0;
    for (const letter of dictWord) {
      if (chosenLetterCounts[letter]) {
        sharedCount++;
        chosenLetterCounts[letter]--;
      }
    }
    return sharedCount;
  }

  private removeImpossibleWordsFromPool(chosenWord: string): WordData[] {
    const validWords: WordData[] = [];

    for (const word of this.words) {
      if (this.isDictWordPossible(chosenWord, word.anagrams[0]!)) {
        validWords.push(word);
      }
    }

    return validWords;
  }

  private hasEqualOrLongerWords(
    letters: string,
    wordPool: WordData[],
    chosenWord: string
  ): boolean {
    for (const word of wordPool) {
      if (word.anagrams[0]! == chosenWord) continue;
      if (word.anagrams[0]!.length < chosenWord.length) continue;
      const isWordFormableByLetters = this.doLettersContainWordLetters(
        letters,
        word.anagrams[0]!
      );
      if (!isWordFormableByLetters) continue;
      return true; // Found a possible word that is equal or longer
    }
    return false;
  }

  private doLettersContainWordLetters(letters: string, word: string): boolean {
    const letterCounts: Record<string, number> = {};

    for (const letter of letters) {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    for (const letter of word) {
      if (!letterCounts[letter] || letterCounts[letter] <= 0) {
        return false;
      }
      letterCounts[letter]--;
    }
    return true; // All letters in word can be formed from available letters
  }

  private countVowelsAndConsonants(word: string): {
    vowelCount: number;
    consonantCount: number;
  } {
    let vowelCount = 0;
    let consonantCount = 0;

    for (const letter of word) {
      if (VOWELS.has(letter)) {
        vowelCount++;
      } else if (CONSONANTS.has(letter)) {
        consonantCount++;
      }
    }

    return { vowelCount, consonantCount };
  }

  private scrambleLetters(letters: string[]): string {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = letters[i];
      const swap = letters[j];
      if (temp !== undefined && swap !== undefined) {
        letters[i] = swap;
        letters[j] = temp;
      }
    }

    return letters.join("");
  }
}
