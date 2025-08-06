import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Clock, Send } from "lucide-react";
import { FlashCard } from "./FlashCard";
import { trpc } from "../utils/trpc";
import type { WordPuzzle } from "shared";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/utils/cn";
import { getCurrentUser } from "aws-amplify/auth";

export function WordTrainer() {
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for mock user first (local development)
        const mockUserData = localStorage.getItem("mockUser");
        if (mockUserData) {
          return; // User is authenticated via mock
        }

        // Check for real authentication
        await getCurrentUser();
      } catch (error) {
        // User not authenticated, redirect to login
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

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
      console.log(result.data);
      if (result.data) {
        setCurrentGame(result.data.puzzle);
        setCountdown(20);
        setIsCountdownActive(true);
        setShowWord(false);
        setGuess("");
        setStartTime(Date.now());
        setGuessTime(null);
        setRestartCountdown(null);
        setIsShorterWordGuessed(false);

        // Focus input after state updates
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load puzzle:", error);
    }
  }, [getNewGame]);

  const handleGuessChange = (value: string) => {
    setGuess(value);
  };

  const handleSubmitGuess = () => {
    if (!currentGame || !startTime || !guess.trim()) return;

    const upperGuess = guess.toUpperCase();

    // Check if guess matches the primary word
    if (currentGame.primaryWords.includes(upperGuess)) {
      const endTime = Date.now();
      const timeUsed = endTime - startTime;
      setGuessTime(timeUsed);
      setIsShorterWordGuessed(false);
      setIsCountdownActive(false);
      setShowWord(true);
    } else if (currentGame.correctWords.includes(upperGuess)) {
      // It's a shorter correct word
      setIsShorterWordGuessed(true);
    } else {
      // Reset the shorter word flag if guess is incorrect
      setIsShorterWordGuessed(false);
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
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountdownActive, currentGame, startTime]);

  // Global keydown handler for Enter key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (showWord) {
          startNewRound();
        } else if (isCountdownActive) {
          handleSubmitGuess();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showWord, guess]);

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
            to="/dashboard"
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
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">
              Countdown Word Trainer
            </h1>
            <p className="text-blue-700">
              Find the hidden word in the scrambled letters below!
            </p>
            <p
              className={cn(
                "text-green-600 mt-1",
                !isShorterWordGuessed && "invisible"
              )}
            >
              Correct! But there's a longer word you can find!
            </p>
          </div>

          <FlashCard
            letters={currentGame.letters}
            timeLeft={countdown}
            onGuessChange={handleGuessChange}
            guess={guess}
            disabled={!isCountdownActive}
            inputRef={inputRef}
          />

          {isCountdownActive && (
            <div className="mt-4 text-center">
              <button
                onClick={handleSubmitGuess}
                disabled={!guess.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
                Submit Guess
              </button>
            </div>
          )}

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

              <div className="mt-6">
                <button
                  onClick={startNewRound}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Next Round
                </button>
                <p className="text-sm text-blue-600 mt-2">
                  Press Enter or click the button to continue
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
