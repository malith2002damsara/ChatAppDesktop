import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";

const ErrorFallback = ({ error }) => {
  return (
    <div className="p-4 text-red-500" role="alert">
      <p className="font-bold">Something went wrong:</p>
      <pre className="whitespace-pre-wrap">{error.message}</pre>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-red-100 rounded"
      >
        Reload App
      </button>
    </div>
  );
};

const AppLayout = () => {
  const { theme } = useThemeStore();
  
  return (
    <div data-theme={theme}>
      <Navbar />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Outlet />
      </ErrorBoundary>
      <Toaster />
    </div>
  );
};

const AuthCheck = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return children;
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorFallback />,
    children: [
      {
        path: "/",
        element: (
          <AuthCheck>
            {({ authUser }) => 
              authUser ? <HomePage /> : <Navigate to="/login" replace />
            }
          </AuthCheck>
        )
      },
      {
        path: "/signup",
        element: (
          <AuthCheck>
            {({ authUser }) => 
              !authUser ? <SignUpPage /> : <Navigate to="/" replace />
            }
          </AuthCheck>
        )
      },
      {
        path: "/login",
        element: (
          <AuthCheck>
            {({ authUser }) => 
              !authUser ? <LoginPage /> : <Navigate to="/" replace />
            }
          </AuthCheck>
        )
      },
      {
        path: "/settings",
        element: (
          <AuthCheck>
            <SettingsPage />
          </AuthCheck>
        )
      },
      {
        path: "/profile",
        element: (
          <AuthCheck>
            {({ authUser }) => 
              authUser ? <ProfilePage /> : <Navigate to="/login" replace />
            }
          </AuthCheck>
        )
      }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <RouterProvider router={router} />;
};

export default App;