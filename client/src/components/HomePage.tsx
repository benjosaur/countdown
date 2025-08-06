import { Link } from 'react-router-dom'
import { Clock, Brain, Trophy, ArrowRight } from 'lucide-react'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Clock className="w-12 h-12 text-blue-600" />
            <h1 className="text-5xl font-bold text-blue-900">Countdown</h1>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-4">Word Trainer</h2>
            <p className="text-xl text-blue-700 max-w-2xl mx-auto leading-relaxed">
              Race against the clock to find hidden words in scrambled letters. 
              Test your vocabulary with the most useful words in English.
            </p>
          </div>

          <div className="mb-16">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold text-xl hover:bg-blue-700 transition-colors border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Start Training
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">30 Second Rounds</h3>
              <p className="text-blue-700">
                Quick bursts of focused practice to improve your word recognition speed
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Smart Selection</h3>
              <p className="text-blue-700">
                Practice with the top 1000 most useful words to build practical vocabulary
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Track Progress</h3>
              <p className="text-blue-700">
                See your improvement with timing and accuracy feedback after each round
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}