"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function UsernamePage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  // ✅ If user already has username, skip this page entirely
  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.username) {
      const redirectTo = new URLSearchParams(window.location.search).get("from");
      router.replace(redirectTo ?? "/");
    }
  }, [session, status, router]);

  function handleUsernameNext() {
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleSubmit(skipDob = false) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/set-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          dob: skipDob ? null : dob || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      // ✅ Update session so username is available immediately
      await updateSession();

      const redirectTo = new URLSearchParams(window.location.search).get("from");
      router.push(redirectTo ?? "/");

    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  // Show nothing while checking session
  if (status === "loading") return null;
  if (session?.user?.username) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm sm:max-w-md bg-secondary-main rounded-[var(--R24)] px-6 py-10 text-center shadow-sm">

        {step === 1 ? (
          <>
            <h1 className="heading-h2 text-main">
              What should we<br />call you?
            </h1>
            <p className="body-default text-secondary mt-3">
              This helps us personalize your experience.
            </p>
            <div className="mt-6 text-left">
              <label className="caption text-secondary mb-1 block">Your name</label>
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
            {error && <p className="text-xs text-red-main mt-3 text-left">{error}</p>}
            <button
              onClick={handleUsernameNext}
              className="mt-6 w-full cursor-pointer bg-primary-main text-white py-3 rounded-[var(--R16)]"
            >
              Continue
            </button>
          </>

        ) : (
          <>
            <p className="caption text-secondary tracking-widest uppercase">Improve Accuracy</p>
            <h1 className="heading-h2 text-main mt-3">Add your birth date</h1>
            <p className="body-default text-secondary mt-3">
              This helps us generate insights that are just for you.
            </p>
            <div className="mt-6 text-left">
              <label className="caption text-secondary mb-1 block">Date of birth</label>
              <input
                type="date"
                value={dob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setError(""); setDob(e.target.value); }}
                className="w-full border border-black rounded-[var(--R16)] px-4 py-3 bg-transparent outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-main mt-3 text-left">{error}</p>}
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading || !dob}
              className="mt-6 w-full cursor-pointer bg-primary-main text-white py-3 rounded-[var(--R16)] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="mt-3 w-full cursor-pointer text-secondary py-2 text-sm underline"
            >
              Skip for now
            </button>
          </>
        )}

        <div className="mt-6 border-t border-black/40" />
        <p className="caption text-secondary mt-3">Talk to an expert</p>
      </div>
    </div>
  );
}