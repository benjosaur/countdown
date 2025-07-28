import { Link } from 'react-router-dom'
import { Brain, Clock, Zap, Trophy, ArrowRight, Sparkles } from 'lucide-react'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">WordFlow</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">How it Works</a>
            <a href="#stats" className="text-white/80 hover:text-white transition-colors">Stats</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-8">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">AI-Powered Word Training</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
            Master Words
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Beat Time
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Challenge your mind with our intense countdown word trainer. 
            Unscramble letters, race against time, and boost your vocabulary 
            with the top 1000 most useful words.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/trainer"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25"
            >
              <span className="flex items-center">
                Start Training
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
            </Link>
            
            <button className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-lg rounded-2xl hover:bg-white/20 transition-all duration-300">
              <span className="flex items-center">
                Watch Demo
                <div className="w-3 h-3 bg-red-500 rounded-full ml-2 animate-pulse"></div>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">30-Second Challenge</h3>
            <p className="text-white/70 leading-relaxed">
              Race against the clock in intense 30-second rounds. 
              Perfect your speed and accuracy under pressure.
            </p>
          </div>
          
          <div className="group p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Smart Algorithm</h3>
            <p className="text-white/70 leading-relaxed">
              Our AI selects words from the top 1000 most useful vocabulary, 
              ensuring every game improves your language skills.
            </p>
          </div>
          
          <div className="group p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Track Progress</h3>
            <p className="text-white/70 leading-relaxed">
              Monitor your reaction time and accuracy. 
              See your improvement with detailed performance metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="stats" className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            By the Numbers
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Join thousands of players improving their vocabulary daily
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { number: "1,000", label: "Curated Words" },
            { number: "30", label: "Seconds Per Round" },
            { number: "∞", label: "Improvement Potential" },
            { number: "24/7", label: "Available Training" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {stat.number}
              </div>
              <div className="text-white/70 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}