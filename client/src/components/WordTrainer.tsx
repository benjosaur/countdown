import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Clock, Send } from "lucide-react";
import { FlashCard } from "./FlashCard";
import { trpc } from "../utils/trpc";
import type { WordPuzzle } from "shared";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const [showLengthWarning, setShowLengthWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: newGame, refetch: getNewGame } = useQuery(
    trpc.wordTrainer.getNewGame.queryOptions(undefined, { enabled: false })
  );

  const submitResult = useMutation(
    trpc.wordTrainer.submitResult.mutationOptions({})
  );

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
        setShowLengthWarning(false);

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
    // Clear length warning when user starts typing again
    if (showLengthWarning) {
      setShowLengthWarning(false);
    }
  };

  const handleSubmitGuess = async () => {
    if (!currentGame || !startTime || !guess.trim() || submitResult.isPending)
      return;

    const upperGuess = guess.toUpperCase();
    
    // Check minimum length requirement
    if (upperGuess.length < 5) {
      setShowLengthWarning(true);
      // Clear the warning after 3 seconds
      setTimeout(() => setShowLengthWarning(false), 3000);
      return;
    }
    
    // Clear any existing warning
    setShowLengthWarning(false);
    
    const currentTime = Date.now();
    const secondsTaken = (currentTime - startTime) / 1000;

    try {
      // Check if guess matches the primary word (target)
      if (currentGame.primaryWords.includes(upperGuess)) {
        // Target word was guessed - success!
        setGuessTime(currentTime - startTime);
        setIsShorterWordGuessed(false);
        setIsCountdownActive(false);
        setGuess("");

        // Submit successful result
        await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: upperGuess,
          timeTaken: secondsTaken,
          isFailed: false,
        });

        setShowWord(true);
      } else if (currentGame.correctWords.includes(upperGuess)) {
        // It's a shorter correct word
        setIsShorterWordGuessed(true);
        setGuess("");

        // Submit partial success (shorter word guessed)
        await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: upperGuess,
          timeTaken: secondsTaken,
          isFailed: false,
        });

        // Continue game - don't show word yet, refocus input
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      } else {
        // Incorrect guess - go to failure screen
        setIsShorterWordGuessed(false);
        setIsCountdownActive(false);
        setGuess("");

        // Submit failed result
        await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: upperGuess,
          timeTaken: secondsTaken,
          isFailed: true,
        });

        setShowWord(true);
      }
    } catch (error) {
      console.error("Failed to submit result:", error);
      // Reset state on error
      setGuess("");
      setIsShorterWordGuessed(false);
    }
  };

  // Timer effects
  useEffect(() => {
    let timer: number;
    if (isCountdownActive && countdown > 0) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (
      countdown === 0 &&
      isCountdownActive &&
      currentGame &&
      startTime
    ) {
      // Time expired - submit failure
      const handleTimeExpiration = async () => {
        setIsCountdownActive(false);
        setIsShorterWordGuessed(false);

        const secondsTaken = (Date.now() - startTime) / 1000;

        // Submit failed result with empty string
        await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: "",
          timeTaken: secondsTaken,
          isFailed: true,
        });

        setShowWord(true);
      };

      handleTimeExpiration();
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountdownActive, currentGame, startTime, submitResult]);

  // Global keydown handler for Enter key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (showWord) {
          startNewRound();
        } else if (isCountdownActive && !submitResult.isPending) {
          handleSubmitGuess();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showWord, guess, isCountdownActive, submitResult.isPending]);

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
            <p
              className={cn(
                "text-red-500 mt-1 font-medium",
                !showLengthWarning && "invisible"
              )}
            >
              You can do better than that!
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
                disabled={!guess.trim() || submitResult.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
                {submitResult.isPending ? "Submitting..." : "Submit Guess"}
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
