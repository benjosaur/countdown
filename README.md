# Countdown Word Trainer

The number one specialised tool to improve your game in the countdown words round. Specifically, practise jumbles of the [Top 1000 useful words for Countdown](https://countdownresources.wordpress.com/2018/10/13/top-1000-words/). This list has been ranked based on frequency of appearance combined with raw scoring potential, meaning the 1000 words alone enable players to achieve maximum scores in over 20% of all Countdown rounds.

As used by current centurian Daniel Face to achieve his astounding score of 110.

[16.01.26 - Score 110](https://www.channel4.com/programmes/countdown).

**Play now:** https://d2lzkkm86tachs.cloudfront.net

## In Play

<p align="center">
  <img src=".github/images/inplay.png" alt="Countdown Word Trainer - In Game" width="600">
  <br>
    <em>20s to solve!</em>
</p>

## Post Game

<p align="center">
  <img src=".github/images/stats.png" alt="Session Statistics" width="600">
  <br>
  <em>Performance metrics - track your average solve time(s)</em>
</p>

### Adaptive Learning

Based on user feedback, now words that you are worse at will be more likely to appear:

- **Fast solves** (under 10 seconds) reduces likelihood substantially.
- **Slower solves** (10-20 seconds) reduce likelihood less.
- **Fails** increase a word's likelihood.

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

## How It Works

1. Client requests a new game via tRPC
2. Server selects a random word from the top 1000
3. Server pads the word to 9 letters conditionally using the [Countdown distribution](http://www.thecountdownpage.com/letters.htm)
4. Server scrambles the 9-letter combination
5. Client displays scrambled letters with a 20-second countdown
6. Player submits their guess
7. Server validates and returns feedback

## AWS Deployment

- **Frontend:** CloudFront CDN serving static assets from S3
- **Backend:** Available via API Gateway on Lambda

## License

MIT
