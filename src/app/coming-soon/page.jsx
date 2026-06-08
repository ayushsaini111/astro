"use client";

import { useRouter } from "next/navigation";

export default function ComingSoonPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-s16">
      
      <div className="text-center space-y-s24 max-w-md">
        
        {/* Icon */}
        <div className="w-20 h-20 mx-auto bg-primary-main rounded-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* Text */}
        <div className="space-y-s16">
          <h1 className="heading-h3 text-main">Coming Soon</h1>
          <p className="body-default text-secondary">
            This feature is under development.<br/>
            We'll notify you when it's ready!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-s16">
          <button
            onClick={() => router.back()}
            className="bg-primary-main text-white px-s24 py-s16 rounded-r16 hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="border border-primary-main text-primary-main px-s24 py-s16 rounded-r16 hover:bg-primary-main hover:text-white transition-all"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}