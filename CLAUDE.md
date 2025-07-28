# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

This is a countdown word trainer game where users unscramble letters to find hidden words within a 30-second timer. The app displays scrambled letters from a pool that always contains a valid word, and users race against the clock to identify it.

## Monorepo Architecture

This project follows a monorepo structure with three main packages:

- **client/**: React frontend application
- **server/**: Express + tRPC backend API
- **shared/**: Shared types, schemas, and utilities

## Core Architecture

- **Frontend**: Vite + React + TypeScript with Tailwind CSS (in `client/`)
- **Backend**: Express + tRPC server with word generation services (in `server/`)
- **Type Safety**: End-to-end type safety using tRPC and shared schemas
- **State Management**: React hooks with tRPC React Query integration
- **Word System**: Server-side word generation with CSV-based database

## Key Components Structure

### Client (`client/src/`)
- `components/WordTrainer.tsx`: Main game component with tRPC integration
- `components/FlashCard.tsx`: Displays scrambled letters
- `components/HomePage.tsx`: Landing page
- `utils/trpc.ts`: tRPC client setup

### Server (`server/`)
- `services/wordService.ts`: Word generation and scrambling logic
- `trpc/router.ts`: tRPC API endpoints
- `index.ts`: Express server setup

### Shared (`shared/`)
- `schemas/index.ts`: Zod schemas for validation and type inference

## Word Game Logic

The game follows this flow:

1. Client requests new game via tRPC (`wordTrainer.getNewGame`)
2. Server selects random word from top 1000 useful words (from CSV)
3. Server pads word to 9 letters using weighted letter distribution
4. Server scrambles the 9-letter combination
5. Client displays scrambled letters with 30-second countdown
6. User guesses; client submits result via tRPC (`wordTrainer.submitResult`)

## Development Commands

### Root Level
- `bun run dev` - Start client development server
- `bun run dev:server` - Start server in watch mode
- `bun run dev:full` - Start both client and server concurrently
- `bun run build` - Build client for production
- `bun run build:server` - Build server

### Individual Packages
- `cd client && bun run dev` - Client development
- `cd server && bun run dev` - Server development

## Code Style Guidelines

- camelCase for variables, functions, methods
- PascalCase for classes and components
- Be parsimonious with edits, avoid comments
- Always prefer idiomatic solution

## Tech Stack

### Frontend (client/)
- Bun (runtime and package manager)
- React 19 with TypeScript
- Tailwind CSS 4.x with Vite plugin
- React Router 7.x
- Lucide React icons
- tRPC React Query integration

### Backend (server/)
- Bun runtime
- Express.js server
- tRPC for type-safe APIs
- CORS configuration
- CSV file processing

### Shared (shared/)
- Zod for schema validation
- TypeScript for type definitions

### Build Tools
- Vite as build tool and dev server (client)
- TypeScript compiler (server)
- Workspace support with Bun

## Important File Locations

- Word database: `useful_words.csv` and `letter_distribution.csv` (root level)
- Client entry: `client/src/main.tsx`
- Server entry: `server/index.ts`
- Shared types: `shared/schemas/index.ts`
- tRPC setup: `client/src/utils/trpc.ts` and `server/trpc/router.ts`

## Development Process

- If there is ambiguity ask for clarification
- Use workspace commands from root for coordinated development
- Client and server can be developed independently
- Shared types ensure type safety across the full stack
