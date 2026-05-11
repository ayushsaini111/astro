"use client";

import { signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function LoginPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [timer, setTimer] = useState(30);
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);
  const router = useRouter();

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/redirect" });
  }

  useEffect(() => {
    if (!otpSent) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent]);

  async function handleSendOtp() {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit number");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (res.ok) {
      setOtpSent(true);
      setTimer(30); // 🔥 important
    } else {
      setError("Failed to send OTP. Try again.");
    }
  }

  async function handleVerifyOtp() {
  const code = otp.join("");
  if (code.length !== 6) {
    setError("Enter full 6-digit OTP");
    return;
  }
  setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp: code }),
    });

    // ✅ Move loading to false here
    setLoading(false);

    if (!res.ok) {
      // Try to get error message, fallback to generic if JSON fails
      const errorData = await res.json().catch(() => ({}));
      setError(errorData.error || "Invalid OTP. Try again.");
      return;
    }

    const data = await res.json();
    router.push(data.redirect);
  } catch (err) {
    setLoading(false);
    setError("Something went wrong. Please try again.");
  }
}

  function handleOtpInput(index, value) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleOtpKey(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">

      <div className="w-full max-w-sm sm:max-w-md bg-secondary-main rounded-[var(--R24)] px-6 py-10 text-center shadow-sm">

        {/* Logo */}
        <div className="mx-auto w-34 h-34 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4 relative">
          <Image src="/logo.jpg" alt="logo" fill className="object-cover" />
        </div>

        <h3 className="heading-h5 text-main mb-2">Rantraa</h3>
        {!otpSent && (
          <>
            {/* Google Button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center cursor-pointer justify-center gap-3 border border-black/60 rounded-[var(--R16)] py-3 text-main hover:bg-black/5 transition disabled:opacity-50 mb-5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-black/30" />
              <span className="text-xs text-secondary">or use phone</span>
              <div className="flex-1 h-px bg-black/30" />
            </div>
          </>
        )}

        {!otpSent ? (
          <>
            <h1 className="heading-h2 text-main text-left">
              Get insights <br /> tailored to you
            </h1>

            <p className="body-default text-secondary mt-4 text-left">
              Enter your mobile number
            </p>

            {/* Phone Input */}
            <div className="mt-2 flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
              <span className="mr-2">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setError("");
                  setPhone(e.target.value.replace(/\D/g, ""));
                }}
                className="bg-transparent outline-none w-full"
              />
            </div>

            {error && <p className="text-xs text-red-main mt-2">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length !== 10}
              className="mt-6 w-full bg-primary-main cursor-pointer text-white py-3 rounded-[var(--R16)] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Continue"}
            </button>
          </>
        ) : (
          <>
            <h1 className="heading-h2 text-main">
              Verify your number
            </h1>

            <p className="body-default text-secondary mt-4">
              Enter verification code
            </p>

            <div className="flex gap-2 justify-center  mt-4">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  className={`w-11 h-12 text-center text-lg border rounded-[8px] bg-transparent ${error ? "border-red-main" : "border-black"
                    }`}
                />
              ))}
            </div>

            {error && <p className="text-xs text-red-main mt-2">{error}</p>}

            <p className="text-xs text-primary-main mt-3">
              {timer > 0
                ? `Resend in 00:${timer < 10 ? "0" + timer : timer}`
                : "Resend OTP"}
            </p>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length !== 6}
              className="mt-6 w-full cursor-pointer bg-primary-main text-white py-3 rounded-[var(--R16)] disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </>
        )}

        <div className="mt-6 border-t border-black/40"></div>

        <p className="caption text-secondary mt-3">
          Talk to an expert
        </p>
      </div>
    </div>
  );
}