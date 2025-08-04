export interface WordPuzzle {
  letters: string;
  primaryWords: string[];
  correctWords: string[];
  index: number;
  // Indicates if puzzle could not avoid existence of another word \geq target
  isExistsEqualOrBetterWord: boolean;
}
