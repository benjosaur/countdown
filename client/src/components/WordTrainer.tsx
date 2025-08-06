import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Clock,
  Send,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { FlashCard } from "./FlashCard";
import { trpc } from "../utils/trpc";
import type { WordPuzzle, WordPuzzleSubmissionResponse } from "shared";
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
  const [sessionSubmissions, setSessionSubmissions] = useState<
    WordPuzzleSubmissionResponse[]
  >([]);
  const [initialOverallLikelihood, setInitialOverallLikelihood] = useState<
    number | null
  >(null);
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
        // Reset session data on new round
        setSessionSubmissions([]);
        setInitialOverallLikelihood(null);

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
        const result = await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: upperGuess,
          timeTaken: secondsTaken,
          isFailed: false,
        });

        // Store submission for session tracking
        setSessionSubmissions((prev) => [...prev, result]);
        if (initialOverallLikelihood === null && result.overall.oldLikelihood) {
          setInitialOverallLikelihood(result.overall.oldLikelihood);
        }

        setShowWord(true);
      } else if (currentGame.correctWords.includes(upperGuess)) {
        // It's a shorter correct word
        setIsShorterWordGuessed(true);
        setGuess("");

        // Submit partial success (shorter word guessed)
        const result = await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: upperGuess,
          timeTaken: secondsTaken,
          isFailed: false,
        });

        // Store submission for session tracking
        setSessionSubmissions((prev) => [...prev, result]);
        if (initialOverallLikelihood === null && result.overall.oldLikelihood) {
          setInitialOverallLikelihood(result.overall.oldLikelihood);
        }

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
        const result = await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: upperGuess,
          timeTaken: secondsTaken,
          isFailed: true,
        });

        // Store submission for session tracking
        setSessionSubmissions((prev) => [...prev, result]);
        if (initialOverallLikelihood === null && result.overall.oldLikelihood) {
          setInitialOverallLikelihood(result.overall.oldLikelihood);
        }

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
        const result = await submitResult.mutateAsync({
          index: currentGame.index,
          targetAnagrams: currentGame.primaryWords,
          submittedWord: "",
          timeTaken: secondsTaken,
          isFailed: true,
        });

        // Store submission for session tracking
        setSessionSubmissions((prev) => [...prev, result]);
        if (initialOverallLikelihood === null && result.overall.oldLikelihood) {
          setInitialOverallLikelihood(result.overall.oldLikelihood);
        }

        setShowWord(true);
      };

      handleTimeExpiration();
    }
    return () => clearTimeout(timer);
  }, [countdown, isCountdownActive, currentGame, startTime, submitResult]);

  // Helper function to calculate accumulated deltas
  const calculateAccumulatedDeltas = () => {
    const totalOverallAverageSuccessTimeDelta = sessionSubmissions.reduce(
      (sum, submission) =>
        sum + (submission.overall.changeInAverageSuccessTime || 0),
      0
    );

    const wordDeltas = sessionSubmissions.reduce(
      (acc, submission) => {
        const wordIndex = submission.targetWord.wordData.index;
        if (!acc[wordIndex]) {
          acc[wordIndex] = {
            wordData: submission.targetWord.wordData,
            oldLikelihood: submission.targetWord.oldLikelihood,
            totalLikelihoodDelta: 0,
            oldAverageSuccessTime: submission.targetWord.oldAverageSuccessTime,
            totalAverageSuccessTimeDelta: 0,
          };
        }
        acc[wordIndex].totalLikelihoodDelta +=
          submission.targetWord.changeInLikelihood || 0;
        acc[wordIndex].totalAverageSuccessTimeDelta +=
          submission.targetWord.changeInAverageSuccessTime || 0;
        return acc;
      },
      {} as Record<
        number,
        {
          wordData: any;
          oldLikelihood?: number;
          totalLikelihoodDelta: number;
          oldAverageSuccessTime?: number;
          totalAverageSuccessTimeDelta: number;
        }
      >
    );

    const submittedWordDeltas = sessionSubmissions.reduce(
      (acc, submission) => {
        if (submission.submittedWord) {
          const wordIndex = submission.submittedWord.wordData.index;
          if (!acc[wordIndex]) {
            acc[wordIndex] = {
              wordData: submission.submittedWord.wordData,
              oldLikelihood: submission.submittedWord.oldLikelihood,
              totalLikelihoodDelta: 0,
              oldAverageSuccessTime:
                submission.submittedWord.oldAverageSuccessTime,
              totalAverageSuccessTimeDelta: 0,
            };
          }
          acc[wordIndex].totalLikelihoodDelta +=
            submission.submittedWord.changeInLikelihood || 0;
          acc[wordIndex].totalAverageSuccessTimeDelta +=
            submission.submittedWord.changeInAverageSuccessTime || 0;
        }
        return acc;
      },
      {} as Record<
        number,
        {
          wordData: any;
          oldLikelihood?: number;
          totalLikelihoodDelta: number;
          oldAverageSuccessTime?: number;
          totalAverageSuccessTimeDelta: number;
        }
      >
    );

    return {
      totalOverallAverageSuccessTimeDelta,
      wordDeltas: Object.values(wordDeltas),
      submittedWordDeltas: Object.values(submittedWordDeltas),
    };
  };

  // Helper function to render delta with color coding
  const renderDelta = (value: number, isTime = false, precision = 1) => {
    if (value === 0) return null;
    const formatted = isTime
      ? `${value.toFixed(precision)}s`
      : value.toFixed(precision);
    const icon =
      value > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
    const colorClass = value > 0 ? "text-red-500" : "text-green-500";
    return (
      <span className={`inline-flex items-center gap-1 ${colorClass}`}>
        {icon} {value > 0 ? "+" : ""}
        {formatted}
      </span>
    );
  };

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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
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
          <div className="text-center">
            <p
              className={cn(
                "text-green-600",
                !isShorterWordGuessed && "invisible"
              )}
            >
              Correct! But there's a longer word you can find!
            </p>
            <p
              className={cn(
                "text-red-500font-medium",
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

              {sessionSubmissions.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900 border-b pb-2">
                    Session Statistics
                  </h3>

                  {/* Overall Statistics */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Overall Performance
                    </h4>
                    {initialOverallLikelihood && (
                      <p className="text-sm text-blue-700">
                        Prev Average Likelihood:{" "}
                        {(initialOverallLikelihood / 1000).toFixed(3)}
                      </p>
                    )}
                    {(() => {
                      const { totalOverallAverageSuccessTimeDelta } =
                        calculateAccumulatedDeltas();
                      return (
                        totalOverallAverageSuccessTimeDelta !== 0 && (
                          <p className="text-sm">
                            Prev Average Success Time:{" "}
                            {renderDelta(
                              totalOverallAverageSuccessTimeDelta,
                              true,
                              2
                            )}
                          </p>
                        )
                      );
                    })()}
                  </div>

                  {/* Word-specific Statistics */}
                  {(() => {
                    const { wordDeltas, submittedWordDeltas } =
                      calculateAccumulatedDeltas();
                    const allWordDeltas = [
                      ...wordDeltas,
                      ...submittedWordDeltas,
                    ];
                    const uniqueWordDeltas = allWordDeltas.reduce(
                      (acc, word) => {
                        const existing = acc.find(
                          (w) => w.wordData.index === word.wordData.index
                        );
                        if (!existing) {
                          acc.push(word);
                        } else {
                          // Combine deltas for same word
                          existing.totalLikelihoodDelta +=
                            word.totalLikelihoodDelta;
                          existing.totalAverageSuccessTimeDelta +=
                            word.totalAverageSuccessTimeDelta;
                        }
                        return acc;
                      },
                      [] as typeof allWordDeltas
                    );

                    return (
                      uniqueWordDeltas.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-blue-800">
                            Word Performance Changes
                          </h4>
                          {uniqueWordDeltas.map((word, index) => (
                            <div
                              key={word.wordData.index}
                              className="bg-gray-50 p-3 rounded border-l-4 border-blue-400"
                            >
                              <p className="font-medium text-gray-900">
                                {word.wordData.anagrams.join(", ")} (Length:{" "}
                                {word.wordData.length})
                              </p>
                              {word.oldLikelihood !== undefined && (
                                <p className="text-sm text-gray-600">
                                  Prev Likelihood:{" "}
                                  {word.oldLikelihood.toFixed(1)}
                                  {word.totalLikelihoodDelta !== 0 && (
                                    <span className="ml-2">
                                      {renderDelta(word.totalLikelihoodDelta)}
                                    </span>
                                  )}
                                </p>
                              )}
                              {word.oldAverageSuccessTime !== undefined && (
                                <p className="text-sm text-gray-600">
                                  Prev Avg Success Time:{" "}
                                  {word.oldAverageSuccessTime.toFixed(2)}s
                                  {word.totalAverageSuccessTimeDelta !== 0 && (
                                    <span className="ml-2">
                                      {renderDelta(
                                        word.totalAverageSuccessTimeDelta,
                                        true,
                                        2
                                      )}
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    );
                  })()}

                  {/* Individual Submissions */}
                  {sessionSubmissions.length > 1 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800">
                        Individual Submission Deltas
                      </h4>
                      {sessionSubmissions.map((submission, index) => (
                        <div
                          key={index}
                          className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400"
                        >
                          <p className="font-medium text-gray-900">
                            Submission {index + 1}:{" "}
                            {submission.targetWord.wordData.anagrams.join(", ")}
                          </p>
                          <div className="text-sm text-gray-600 space-y-1">
                            {submission.overall.changeInAverageSuccessTime !==
                              undefined &&
                              submission.overall.changeInAverageSuccessTime !==
                                0 && (
                                <p>
                                  Overall Avg Success Time:{" "}
                                  {renderDelta(
                                    submission.overall
                                      .changeInAverageSuccessTime,
                                    true,
                                    2
                                  )}
                                </p>
                              )}
                            {submission.targetWord.changeInLikelihood !==
                              undefined &&
                              submission.targetWord.changeInLikelihood !==
                                0 && (
                                <p>
                                  Target Word Likelihood:{" "}
                                  {renderDelta(
                                    submission.targetWord.changeInLikelihood
                                  )}
                                </p>
                              )}
                            {submission.targetWord
                              .changeInAverageSuccessTime !== undefined &&
                              submission.targetWord
                                .changeInAverageSuccessTime !== 0 && (
                                <p>
                                  Target Word Avg Time:{" "}
                                  {renderDelta(
                                    submission.targetWord
                                      .changeInAverageSuccessTime,
                                    true,
                                    2
                                  )}
                                </p>
                              )}
                            {submission.submittedWord &&
                              submission.submittedWord.changeInLikelihood !==
                                undefined &&
                              submission.submittedWord.changeInLikelihood !==
                                0 && (
                                <p>
                                  Submitted Word (
                                  {submission.submittedWord.wordData.anagrams.join(
                                    ", "
                                  )}
                                  ) Likelihood:{" "}
                                  {renderDelta(
                                    submission.submittedWord.changeInLikelihood
                                  )}
                                </p>
                              )}
                            {submission.submittedWord &&
                              submission.submittedWord
                                .changeInAverageSuccessTime !== undefined &&
                              submission.submittedWord
                                .changeInAverageSuccessTime !== 0 && (
                                <p>
                                  Submitted Word Avg Time:{" "}
                                  {renderDelta(
                                    submission.submittedWord
                                      .changeInAverageSuccessTime,
                                    true,
                                    2
                                  )}
                                </p>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8">
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
