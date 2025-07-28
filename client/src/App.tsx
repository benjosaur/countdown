import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WordTrainer } from "./components/WordTrainer";
import { HomePage } from "./components/HomePage";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/trainer" element={<WordTrainer />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </QueryClientProvider>
  );
}

export default App;
