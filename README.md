# Countdown Word Trainer

A fast-paced word unscrambling game where players race against a 30-second timer to find hidden words in scrambled letter pools.

**Play now:** https://d2lzkkm86tachs.cloudfront.net

## Overview

Countdown Word Trainer is a practice tool designed to help players master the [Top 1000 useful words for Countdown](https://countdownresources.wordpress.com/2018/10/13/top-1000-words/). This curated list, compiled by Countdown community experts, represents the most strategically valuable words that appear frequently in the game due to their favorable letter combinations and anagram potential. These 1000 words alone enable players to achieve maximum scores in over 20% of all Countdown rounds.

The app challenges players to identify valid words from 9 scrambled letters. Each round presents a new puzzle with a guaranteed solution, testing vocabulary skills and pattern recognition under time pressure.

### Adaptive Learning System

The trainer employs an intelligent **adaptive likelihood function** that adjusts which words you practice based on your performance:

- **Successful quick solves** (under 10 seconds) reduce a word's likelihood of reappearing
- **Slower successes** (10-20 seconds) have less impact on likelihood
- **Failed attempts** significantly increase a word's likelihood of being shown again
- **Direct vs indirect success** tracking ensures comprehensive word mastery

This ensures you spend more time practicing your weakest areas, maximizing learning efficiency.

## Features

- **30-second countdown timer** for each round
- **9-letter scrambled puzzles** with guaranteed valid words
- **Adaptive learning algorithm** that prioritizes your weakest words
- **Real-time performance metrics:**
  - Average time taken per word
  - Overall session statistics
  - Immediate feedback to track improvement
- **Comprehensive progress tracking** with success rates and failure counts
- **Responsive design** with Tailwind CSS
- **Full-stack type safety** with tRPC

## Tech Stack

### Frontend
- **Runtime:** Bun
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4.x
- **Routing:** React Router 7.x
- **Icons:** Lucide React
- **Build Tool:** Vite
- **API Client:** tRPC React Query

### Backend
- **Runtime:** Bun
- **Server:** Express.js
- **API:** tRPC for type-safe endpoints
- **Word Database:** CSV-based word and letter distribution files

### Shared
- **Validation:** Zod schemas
- **Type Safety:** End-to-end TypeScript types via tRPC

## Project Structure

```
countdown/
├── client/           # React frontend application
├── server/           # Express + tRPC backend
├── shared/           # Shared types and schemas
├── useful_words.csv  # Word database
└── letter_distribution.csv  # Letter frequency data
```

## Development

### Prerequisites

- Bun runtime installed

### Setup

```bash
# Install dependencies
bun install
```

### Running Locally

```bash
# Start both client and server
bun run dev:full

# Or run individually:
bun run dev          # Client only (port 5173)
bun run dev:server   # Server only (port 3000)
```

### Building

```bash
# Build client for production
bun run build

# Build server
bun run build:server
```

### Other Commands

```bash
bun run lint         # Lint client code
bun run preview      # Preview production build
bun test             # Run tests
bun test:watch       # Run tests in watch mode
```

## How It Works

1. Client requests a new game via tRPC
2. Server selects a random word from the curated word list
3. Server pads the word to 9 letters using weighted letter distribution
4. Server scrambles the 9-letter combination
5. Client displays scrambled letters with a 30-second countdown
6. Player submits their guess
7. Server validates and returns feedback

## Deployment

The application is deployed on AWS:
- **Frontend:** CloudFront CDN serving static assets from S3
- **Backend:** Available via API Gateway or EC2/ECS (depending on infrastructure setup)

## License

MIT
