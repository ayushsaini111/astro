"use client";

export default function RequestCard({ 
  call, 
  onAccept, 
  onDecline, 
  isProcessing = false,
  isMissed = false 
}) {
  const isPending = ["INITIATED", "RINGING"].includes(call.status);
  const isCompleted = call.status === "COMPLETED";
  const isFailed = call.status === "FAILED";
  const isOngoing = call.status === "ONGOING";

  // Status badge color
  const statusColor = isMissed
    ? "bg-red-500"
    : isCompleted
    ? "bg-green-500"
    : isOngoing
    ? "bg-blue-500"
    : "bg-primary-main";

  const statusBadgeColor = isMissed
    ? "bg-red-100 text-red-700"
    : isCompleted
    ? "bg-green-100 text-green-700"
    : isOngoing
    ? "bg-blue-100 text-blue-700"
    : "bg-yellow-100 text-yellow-700";

  return (
    <div
      className={`border rounded-[var(--R24)] p-4 transition-all ${
        isPending
          ? "bg-white border-primary-main/30 shadow-sm"
          : isMissed
          ? "bg-red-50/30 border-red-200/50"
          : "bg-white border-black/10 hover:border-black/20"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${statusColor}`}
        >
          {call.displayUsername?.slice(0, 1).toUpperCase() ?? "U"}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-main truncate">
                {call.displayUsername || "User"}
              </p>
              {call.user?.dob && (
                <p className="text-xs text-secondary">
                  DOB: {new Date(call.user.dob).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusBadgeColor}`}
            >
              {isMissed ? "Missed" : call.status}
            </span>
          </div>

          {/* Call Details */}
          <div className="flex items-center gap-3 text-xs text-secondary mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              {new Date(call.createdAt).toLocaleString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {call.duration && !isMissed && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {Math.floor(call.duration / 60)}m {call.duration % 60}s
              </span>
            )}
          </div>

          {/* Action Buttons (only for pending) */}
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => onDecline(call.id)}
                disabled={isProcessing}
                className="flex-1 py-2 rounded-[var(--R12)] border border-black/20 text-sm font-medium text-main hover:bg-black/5 transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={() => onAccept(call)}
                disabled={isProcessing}
                className="flex-1 py-2 rounded-[var(--R12)] bg-primary-main text-white text-sm font-medium disabled:opacity-50 hover:bg-primary-main/90 transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Calling...
                  </span>
                ) : (
                  "Accept Call"
                )}
              </button>
            </div>
          )}

          {/* Missed Call Badge */}
          {isMissed && (
            <div className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 border border-red-200 font-medium inline-block">
              Not Answered
            </div>
          )}
        </div>
      </div>
    </div>
  );
}