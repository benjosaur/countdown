import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import {
  Clock,
  Brain,
  ArrowRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import type { User } from "shared/types";

export function UserLanding() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check for mock user first (local development)
        const mockUserData = localStorage.getItem("mockUser");
        if (mockUserData) {
          setUser(JSON.parse(mockUserData));
          setLoading(false);
          return;
        }

        // Try to get authenticated user
        const currentUser = await getCurrentUser();
        const userData: User = {
          id: currentUser.userId,
          email: currentUser.signInDetails?.loginId || "",
          name: currentUser.signInDetails?.loginId?.split("@")[0] || "User",
          given_name:
            currentUser.signInDetails?.loginId?.split("@")[0] || "User",
        };
        setUser(userData);
      } catch (error) {
        // User not authenticated, redirect to login
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      // Clear mock user data if present
      localStorage.removeItem("mockUser");

      // Sign out from Amplify if not in mock mode
      if (!localStorage.getItem("mockUser")) {
        await signOut();
      }

      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      navigate("/");
    }
  };

  const handleStartTraining = () => {
    navigate("/trainer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-blue-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="relative mb-8 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold text-blue-900">
            Welcome back, {user.given_name || user.name}!
          </h2>
          <button
            onClick={handleSignOut}
            className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Word Trainer Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Brain className="w-10 h-10 text-blue-600" />
              <h3 className="text-2xl font-bold text-blue-900">Word Trainer</h3>
            </div>
            <p className="text-blue-700 mb-8">
              Practise identifying the top 1000 most useful countdown words in
              scrambles.
            </p>
            <button
              onClick={handleStartTraining}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-xl hover:bg-blue-700 transition-colors border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Start
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
