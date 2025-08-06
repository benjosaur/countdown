import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { WordTrainer } from "./components/WordTrainer";
import { HomePage } from "./components/HomePage";
import { UserLanding } from "./components/UserLanding";
import amplifyConfig from "./aws-config";

Amplify.configure(amplifyConfig);

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<UserLanding />} />
            <Route path="/trainer" element={<WordTrainer />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
