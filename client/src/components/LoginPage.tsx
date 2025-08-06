import { Authenticator } from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Clock } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        navigate("/dashboard");
      } catch (error) {
        // User not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = () => {
    navigate("/dashboard");
  };

  // Mock mode for local development - when env vars are not set
  const isDev = import.meta.env.DEV;

  if (isDev) {
    const handleMockLogin = () => {
      // Store mock user data in localStorage for local development
      const mockUser = {
        id: "mock-user-123",
        email: "user@example.com",
        name: "John Doe",
        given_name: "John",
        family_name: "Doe",
      };
      localStorage.setItem("mockUser", JSON.stringify(mockUser));
      navigate("/dashboard");
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-900">Countdown</h1>
            </div>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Sign in to continue
            </h2>
            <p className="text-blue-600">Running in development mode</p>
          </div>

          <button
            onClick={handleMockLogin}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Continue as Demo User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-900">Countdown</h1>
          </div>
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            Sign in to continue
          </h2>
          <p className="text-blue-600">Access your word training progress</p>
        </div>

        <Authenticator
          hideSignUp={false}
          socialProviders={["google"]}
          variation="modal"
        >
          {({ signOut, user }) => {
            if (user) {
              handleSignIn();
              return <div>Redirecting...</div>;
            }
            return <div>Please sign in to continue</div>;
          }}
        </Authenticator>
      </div>
    </div>
  );
}
