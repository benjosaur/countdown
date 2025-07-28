import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Clock } from "lucide-react";
import { FlashCard } from "./FlashCard";
import { trpc } from "../utils/trpc";
import type { WordPuzzle } from "shared";
import { useQuery } from "@tanstack/react-query";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick: () => void;
  className?: string;
}

function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
}: ButtonProps) {
  const baseClasses =
    "px-6 py-2 font-semibold text-base transition-all duration-200 border focus:outline-none focus:ring-2";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-300",
    secondary:
      "bg-white text-blue-600 border-blue-600 hover:bg-blue-50 focus:ring-blue-300",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function WordTrainer() {
  const [currentGame, setCurrentGame] = useState<WordPuzzle | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [guess, setGuess] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [guessTime, setGuessTime] = useState<number | null>(null);
  const [restartCountdown, setRestartCountdown] = useState<number | null>(null);
  const [isShorterWordGuessed, setIsShorterWordGuessed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: newGame, refetch: getNewGame } = useQuery(
    trpc.wordTrainer.getNewGame.queryOptions(undefined, { enabled: false })
  );

  // const submitResult = trpc.wordTrainer.submitResult.useMutation();

  const startNewRound = useCallback(async () => {
    try {
      const result = await getNewGame();
      if (result.data) {
        setCurrentGame(result.data);
        setCountdown(30);
        setIsCountdownActive(true);
        setShowWord(false);
        setGuess("");
        setStartTime(Date.now());
        setGuessTime(null);
        setRestartCountdown(null);
        
        // Focus input after state updates
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load puzzle:", error);
    }
  }, [getNewGame]);

  const handleGuessChange = async (value: string) => {
    setGuess(value);

    if (!currentGame || !startTime) return;

    const upperGuess = value.toUpperCase();

    if (
      !currentGame.primaryWords.includes(upperGuess) &&
      currentGame.correctWords.includes(upperGuess)
    ) {
      setIsShorterWordGuessed(true);
    }

    // Check if guess matches the word
    if (currentGame.primaryWords.includes(upperGuess)) {
      const endTime = Date.now();
      const timeUsed = endTime - startTime;
      setGuessTime(timeUsed);
      setIsShorterWordGuessed(false);
      setIsCountdownActive(false);
      setShowWord(true);
      setRestartCountdown(3);
    }
  };

  // Timer effects
  useEffect(() => {
    let timer: number;
    if (isCountdownActive && countdown > 0) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && isCountdownActive) {
      setIsCountdownActive(false);
      setIsShorterWordGuessed(false);
      setShowWord(true);
      setRestartCountdown(3);
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountdownActive, currentGame, startTime]);

  useEffect(() => {
    let timer: number;
    if (restartCountdown !== null && restartCountdown > 0) {
      timer = window.setTimeout(
        () => setRestartCountdown(restartCountdown - 1),
        1000
      );
    } else if (restartCountdown === 0) {
      startNewRound();
    }
    return () => clearTimeout(timer);
  }, [restartCountdown, startNewRound]);

  // Start first round on mount
  useEffect(() => {
    startNewRound();
  }, []);

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Home</span>
          </Link>

          <div className="flex items-center gap-2 text-blue-800">
            <Clock size={20} />
            <span className="text-xl font-bold">{countdown}s</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">
              Countdown Word Trainer
            </h1>
            <p className="text-blue-700">
              Find the hidden word in the scrambled letters below!
            </p>
            {isShorterWordGuessed && (
              <p className="text-green-600 mt-2">
                Correct! But there's a longer word you can find!
              </p>
            )}
          </div>

          <FlashCard
            letters={currentGame.letters}
            timeLeft={countdown}
            onGuessChange={handleGuessChange}
            guess={guess}
            disabled={!isCountdownActive}
            inputRef={inputRef}
          />

          {showWord && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="text-yellow-500" size={24} />
                <h2 className="text-2xl font-bold text-blue-900">
                  {guessTime ? "Congratulations!" : "Time's Up!"}
                </h2>
              </div>

              <p className="text-lg mb-4">
                The word(s) was:{" "}
                <span className="font-bold text-blue-800">
                  {currentGame.primaryWords.join(", ")}
                </span>
              </p>

              {guessTime && (
                <p className="text-green-600 mb-4">
                  You found it in {(guessTime / 1000).toFixed(1)} seconds!
                </p>
              )}

              {restartCountdown !== null && (
                <p className="text-blue-600">
                  Next round starting in {restartCountdown} seconds...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
