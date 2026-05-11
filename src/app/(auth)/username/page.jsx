"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernamePage() {
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!dob) {
      setError("Date of birth is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/set-username", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, dob }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/home");

    } catch (err) {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

return (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">

    <div className="w-full max-w-sm sm:max-w-md bg-secondary-main rounded-[var(--R24)] px-6 py-10 text-center shadow-sm">

      {/* Title */}
      <h1 className="heading-h2 text-main">
        What should we call you?
      </h1>

      <p className="body-default text-secondary mt-3">
        This helps us personalize your experience.
      </p>

      {/* Username */}
      <div className="mt-6 text-left">
        <label className="caption text-secondary mb-1 block">
          Your name
        </label>

        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => {
            setError("");
            setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"));
          }}
          className="w-full border border-black rounded-[var(--R16)] px-4 py-3 bg-transparent outline-none"
        />
      </div>

      {/* DOB */}
      <div className="mt-4 text-left">
        <label className="caption text-secondary mb-1 block">
          When were you born?
        </label>

        <input
          type="date"
          value={dob}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => {
            setError("");
            setDob(e.target.value);
          }}
          className="w-full border border-black rounded-[var(--R16)] px-4 py-3 bg-transparent outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-main mt-3 text-left">{error}</p>
      )}

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full cursor-pointer bg-primary-main text-white py-3 rounded-[var(--R16)] disabled:opacity-50"
      >
        {loading ? "Saving..." : "Continue"}
      </button>

      {/* Divider */}
      <div className="mt-6 border-t border-black/40"></div>

      <p className="caption text-secondary mt-3">
        Talk to an expert
      </p>

      {/* Secondary action */}
      <button
        onClick={() => router.push("/login")}
        className="mt-4 text-sm text-secondary underline"
      >
        Use a different account
      </button>

    </div>
  </div>
);
}