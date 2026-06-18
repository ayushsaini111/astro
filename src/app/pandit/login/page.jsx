// app/pandit/login/page.jsx
"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function PanditLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ Get callback URL from search params
  const callbackUrl = searchParams.get("callbackUrl") || "/pandit/dashboard";

  // ✅ Check if already logged in as pandit
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const session = await getSession();
        console.log("🔍 Checking existing session:", session);
        
        if (session?.user?.role === "pandit") {
          console.log("✅ Already logged in as pandit, redirecting to:", callbackUrl);
          // Force navigation to avoid redirect loops
          window.location.href = callbackUrl;
          return;
        }
      } catch (err) {
        console.error("❌ Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [callbackUrl]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) {
      setError("Enter username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🔑 Attempting pandit login:", username);

      const result = await signIn("pandit-credentials", {
        username: username.trim(),
        password: password.trim(),
        redirect: false, // ✅ Handle redirect manually
      });

      console.log("📥 Login result:", result);

      if (result?.error) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        console.log("✅ Login successful!");
        
        // ✅ Wait a moment for session to be set, then redirect
        setTimeout(() => {
          console.log("🔄 Redirecting to:", callbackUrl);
          window.location.href = callbackUrl;
        }, 100);
        
        return;
      }

      // Fallback
      setError("Login failed. Please try again.");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-main border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary">Checking login status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm sm:max-w-md bg-secondary-main rounded-[var(--R24)] px-6 py-10 text-center shadow-sm">
        <div className="mx-auto w-34 h-34 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4 relative">
          <Image src="/logo.jpg" alt="logo" fill className="object-cover" />
        </div>

        <h3 className="heading-h5 text-main mb-2">Rantraa</h3>

        <h1 className="heading-h2 text-main text-left mt-4">
          Pandit Login
        </h1>

        <form onSubmit={handleLogin}>
          <p className="body-default text-secondary mt-4 text-left">
            Username
          </p>
          <div className="mt-2 flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setError("");
                setUsername(e.target.value);
              }}
              className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <p className="body-default text-secondary mt-4 text-left">
            Password
          </p>
          <div className="mt-2 flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setError("");
                setPassword(e.target.value);
              }}
              className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-main/10 border border-red-main rounded-[var(--R16)]">
              <p className="text-xs text-red-main">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="mt-6 w-full bg-primary-main cursor-pointer text-white py-3 rounded-[var(--R16)] font-medium hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 border-t border-black/40"></div>

        <p className="caption text-secondary mt-3">Talk to an expert</p>

        {/* ✅ Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p>Callback URL: {callbackUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}