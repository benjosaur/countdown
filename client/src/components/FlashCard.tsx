interface FlashCardProps {
  letters: string;
  timeLeft: number;
  onGuessChange: (value: string) => void;
  guess: string;
  disabled: boolean;
}

export function FlashCard({
  letters,
  timeLeft,
  onGuessChange,
  guess,
  disabled,
}: FlashCardProps) {
  console.log(letters);
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border-2 border-blue-200 p-3 sm:p-6">
        <div className="text-center">
          <div className="text-blue-900 text-sm font-semibold mb-6 uppercase tracking-wider">
            Letters
          </div>

          {/* Letters horizontal layout */}
          <div className="flex justify-center gap-1 mb-6 overflow-x-auto">
            {letters.split("").map((letter, index) => (
              <div
                key={`${letter}-${index}`}
                className="w-[8vw] h-[8vw] sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 text-white border-2 border-blue-700 flex items-center justify-center flex-shrink-0 text-xl sm:text-4xl md:text-5xl font-bold font-mono"
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Input field for guessing */}
          <div className="mt-6">
            <label
              htmlFor="guess-input"
              className="block text-blue-900 text-sm font-semibold mb-2 uppercase tracking-wider"
            >
              Your Guess
            </label>
            <input
              id="guess-input"
              type="text"
              value={guess}
              onChange={(e) => onGuessChange(e.target.value)}
              disabled={disabled}
              placeholder="Type your guess here..."
              className="w-full p-3 text-center text-lg font-semibold bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
