"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PanditLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) {
      setError("Enter username and password");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("pandit-credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl") || "/pandit/dashboard";
    router.push(callbackUrl);
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
              className="bg-transparent outline-none w-full"
              autoComplete="username"
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
              className="bg-transparent outline-none w-full"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-red-main mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="mt-6 w-full bg-primary-main cursor-pointer text-white py-3 rounded-[var(--R16)] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 border-t border-black/40"></div>

        <p className="caption text-secondary mt-3">Talk to an expert</p>
      </div>
    </div>
  );
}