"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";

const AgoraCall = dynamic(() => import("@/components/call/AgoraCall"), {
  ssr: false,
});

export default function PanditDashboard({ pandit }) {
  console.log("👤 PanditDashboard for:", pandit);
  const [requests, setRequests] = useState([]);
  const [callData, setCallData] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null); // user info for call screen
  const [callingBack, setCallingBack] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 2000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch(`/api/call/incoming?panditId=${pandit.id}`);
      const data = await res.json();
      const calls = data.calls ?? [];

      // Play notif only on new request
      if (calls.length > prevCountRef.current) {
        playNotif();
      }
      prevCountRef.current = calls.length;
      setRequests(calls);
    } catch {}
  }

  function playNotif() {
    new Audio("/notif.mp3").play().catch(() => {});
  }

  async function handleCallBack(call) {
    setCallingBack(call.id);

    const res = await fetch("/api/call/pandit-initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId: call.id }),
    });

    const data = await res.json();
    setCallingBack(null);

    if (res.ok) {
      // callerInfo = the USER (other side)
      setCallerInfo({
        name: call.user?.username ?? "User",
        speciality: call.user?.dob
          ? `DOB: ${new Date(call.user.dob).toLocaleDateString("en-IN")}`
          : "",
      });
      setCallData(data);
      setRequests((prev) => prev.filter((c) => c.id !== call.id));
    }
  }

  async function handleReject(callId) {
    await fetch("/api/call/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId }),
    });
    setRequests((prev) => prev.filter((c) => c.id !== callId));
  }

  async function handleLogout() {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  if (callData) {
    return (
      <AgoraCall
        callData={callData}
        callerInfo={callerInfo} // ← pass USER info, not pandit
        onEnd={() => { setCallData(null); setCallerInfo(null); }}
      />
    );
  }

  return (
   <div className="min-h-screen bg-background px-4 py-6 max-w-md mx-auto">

<div className="flex justify-between items-center mb-8">
  <div className="flex items-center gap-4">
    {/* Profile Image Container */}
    <div className="relative w-14 h-14 overflow-hidden rounded-full border border-black/5 shadow-sm bg-gray-100 flex-shrink-0">
      <Image
        src={pandit.profilePic || "/default-avatar.png"} // Fallback image
        alt={pandit.name}
        width={56} 
        height={56}
        className="object-cover w-full h-full"
        priority // Loads profile pic faster
      />
    </div>

    <div>
      <p className="text-xl font-medium text-main">
        Namaste, {pandit.name} 🙏
      </p>
      <p className="text-sm text-secondary mt-0.5">
        {requests.length > 0
          ? `${requests.length} request${requests.length > 1 ? "s" : ""}`
          : "Waiting for requests..."}
      </p>
    </div>
  </div>

  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-full">
      <div className="w-2 h-2 rounded-full bg-primary-main animate-pulse" />
      <span className="text-[10px] font-medium uppercase tracking-wider text-secondary">
        Online
      </span>
    </div>

    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="text-xs font-medium border border-black/10 px-4 py-1.5 rounded-full text-secondary hover:bg-black/5 transition-colors disabled:opacity-50"
    >
      {loggingOut ? "Logging out..." : "Logout"}
    </button>
  </div>
</div>

      {requests.length === 0 && (
      <div className="text-center mt-24 text-secondary">
  <p className="heading-h5 text-main mb-2">No requests right now</p>
  <p className="caption">Waiting for users to connect</p>
</div>
      )}

      <div className="flex flex-col gap-3">
        {requests.map((call) => (
        <div key={call.id} className="bg-secondary-main border border-black/10 rounded-[var(--R24)] p-4">

  <div className="flex items-center gap-3 mb-4">

    {/* Avatar */}
    <div className="w-11 h-11 rounded-full bg-primary-main/10 flex items-center justify-center text-primary-main font-medium text-lg">
      {call.user?.username?.slice(0, 1).toUpperCase() ?? "U"}
    </div>

    {/* Info */}
    <div>
      <p className="text-sm font-medium text-main">
        {call.user?.username ?? "User"}
      </p>
      <p className="text-xs text-secondary">
        DOB: {call.user?.dob
          ? new Date(call.user.dob).toLocaleDateString("en-IN")
          : "—"}
      </p>
    </div>

    {/* Time */}
    <span className="ml-auto text-xs text-secondary">
      {new Date(call.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  </div>

  {/* Actions */}
  <div className="flex gap-3">
    
    <button
      onClick={() => handleReject(call.id)}
      className="flex-1 py-2.5 rounded-[var(--R16)] border border-black text-sm text-main"
    >
      Decline
    </button>

    <button
      onClick={() => handleCallBack(call)}
      disabled={callingBack === call.id}
      className="flex-1 py-2.5 rounded-[var(--R16)] bg-primary-main text-white text-sm"
    >
      {callingBack === call.id ? "Calling..." : "Call"}
    </button>

  </div>
</div>
        ))}
      </div>
    </div>
  );
}