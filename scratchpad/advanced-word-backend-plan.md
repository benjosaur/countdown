# Advanced Word Game Backend Logic Plan

## Overview
Transform the countdown word trainer from simple frontend word selection to sophisticated backend logic that ensures optimal puzzle generation with comprehensive validation.

## Current State Analysis
- **Frontend**: React + TypeScript, simple random word selection from CSV
- **Backend**: Minimal tRPC setup (only hello endpoint)
- **Data**: `useful_words.csv` (1000 ranked words with anagrams) + `letter_distribution.csv`
- **Current Logic**: Random word → pad to 9 letters → scramble (no validation)

## Proposed Architecture Changes

### 1. Backend Data Layer (`src/server/wordService.ts`)
- Load entire `useful_words.csv` into memory as structured dictionary
- Parse `letter_distribution.csv` for weighted letter sampling  
- Create efficient word lookup structures (by length, by letters)
- Handle anagram parsing (split Word(s) column on "/")

### 2. Advanced Letter Generation Algorithm
**Process Flow:**
1. **Word Selection**: Random word from dictionary
2. **Impossibility Filter**: Calculate max(0, N+W-9) overlap requirement, filter out impossible words
3. **Constraint-Aware Letter Sampling**: 
   - Remove chosen word letters from distribution
   - **Vowel/Consonant Constraints**: Ensure minimum 3 vowels and 4 consonants in final 9-letter set
   - Sample remaining letters with constraint enforcement to reach 9 total
   - **Validation**: Ensure no equal/longer words can be formed from letter set
   - **Retry**: If validation or constraints fail, resample and repeat
4. **Anagram Handling**: Include all anagram variants as valid answers
5. **Shorter Word Discovery**: Add all shorter valid words to answer set

### 3. tRPC API Endpoints (`src/server/router.ts`)
- `getWordPuzzle()`: Returns optimized puzzle with all valid answers
- Response: `{ letters: string, correctWords: string[], primaryWords: string[], rank: number }`

### 4. Frontend Integration (`src/components/WordTrainer.tsx`)
- Replace frontend logic with tRPC call to `getWordPuzzle()`
- Handle multiple valid answers in guess validation
- Update UI to show all discovered words in results
- Display primary words (anagrams of same length) as equally valid main answers

### 5. File Structure
```
scratchpad/
  └── advanced-word-backend-plan.md (this document)
src/server/
  ├── wordService.ts (new - core algorithm)
  ├── router.ts (enhanced)
  └── types.ts (new - shared types)
```

## Technical Challenges
- **Performance**: Efficient word validation against large dictionary
- **Algorithm Complexity**: Iterative sampling with constraint satisfaction  
- **Memory Management**: In-memory dictionary with fast lookups
- **Vowel/Consonant Constraints**: Ensuring minimum 3 vowels and 4 consonants while maintaining puzzle solvability
- **Edge Cases**: Anagram handling, minimum word lengths, letter frequency limits, constraint satisfaction failures

## Implementation Priority
1. Create backend word service with CSV loading
2. Implement core letter generation algorithm  
3. Add tRPC endpoints
4. Update frontend to use backend API
5. Comprehensive testing with edge cases

## Key Correction
- **primaryWords**: Array of anagrams with same length as the selected word (all equally valid main answers)
- **correctWords**: All shorter valid words that can be formed from the letter set

This plan transforms the game into a sophisticated word puzzle generator that ensures every puzzle has exactly the intended difficulty and answer set.