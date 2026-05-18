"use client";

import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import dynamic from "next/dynamic";

import PanditsGrid from "./PanditsGrid";

const AgoraCall = dynamic(
  () => import("@/components/call/AgoraCall"),
  {
    ssr: false,
  }
);

function PanditsClient({
  pandits = [],
}) {
  const [loadingId, setLoadingId] =
    useState(null);

  const [requestedCalls, setRequestedCalls] =
    useState({});

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [activeCallData, setActiveCallData] =
    useState(null);

  const [accepting, setAccepting] =
    useState(false);

  const ringtoneRef = useRef(null);

  const activeCallRef = useRef(null);

  const incomingCallRef = useRef(null);

  /* RINGTONE */
  useEffect(() => {
    const audio = new Audio(
      "/ringtone.mp3"
    );

    audio.loop = true;

    audio.preload = "auto";

    ringtoneRef.current = audio;

    return () => {
      audio.pause();
    };
  }, []);

  /* REFS */
  useEffect(() => {
    activeCallRef.current =
      activeCallData;
  }, [activeCallData]);

  useEffect(() => {
    incomingCallRef.current =
      incomingCall;
  }, [incomingCall]);

  /* POLLING */
  useEffect(() => {
    const userId =
      document.cookie
        .split("; ")
        .find((row) =>
          row.startsWith("userId=")
        )
        ?.split("=")[1];

    if (!userId) return;

    const interval = setInterval(
      async () => {
        if (activeCallRef.current) return;

        try {
          const res = await fetch(
            `/api/call/incoming?userId=${userId}`
          );

          const data = await res.json();

          if (data.call) {
            if (!incomingCallRef.current) {
              playRingtone();
            }

            setIncomingCall(data.call);
          } else {
            if (incomingCallRef.current) {
              stopRingtone();

              setIncomingCall(null);
            }
          }
        } catch (e) {
          console.error(
            "Poll error:",
            e
          );
        }
      },
      2000
    );

    return () =>
      clearInterval(interval);
  }, []);

  /* PLAY */
  function playRingtone() {
    const audio = ringtoneRef.current;

    if (!audio) return;

    audio.currentTime = 0;

    audio.play().catch(() => {});
  }

  /* STOP */
  function stopRingtone() {
    const audio = ringtoneRef.current;

    if (!audio) return;

    audio.pause();

    audio.currentTime = 0;
  }

  /* REQUEST CALL */
  async function handleRequestCall(
    pandit
  ) {
    setLoadingId(pandit.id);

    try {
      const res = await fetch(
        "/api/call/initiate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            panditId: pandit.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Failed to request call"
        );

        return;
      }

      setRequestedCalls((prev) => ({
        ...prev,
        [pandit.id]: data.callId,
      }));
    } catch {
      alert("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  /* ACCEPT */
  async function handleAccept() {
    if (!incomingCall || accepting)
      return;

    setAccepting(true);

    stopRingtone();

    try {
      const res = await fetch(
        "/api/call/accept",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            callId: incomingCall.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
            "Failed to connect"
        );

        return;
      }

      setActiveCallData({
        ...data,

        pandit: incomingCall.pandit,
      });

      setIncomingCall(null);
    } catch {
      alert("Something went wrong");
    } finally {
      setAccepting(false);
    }
  }

  /* REJECT */
  async function handleReject() {
    if (!incomingCall) return;

    stopRingtone();

    const callId = incomingCall.id;

    setIncomingCall(null);

    await fetch("/api/call/reject", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        callId,
      }),
    });
  }

  /* ACTIVE CALL */
  if (activeCallData) {
    return (
      <AgoraCall
        callData={activeCallData}
        callerInfo={
          activeCallData?.pandit
        }
        onEnd={() => {
          setActiveCallData(null);

          setIncomingCall(null);
        }}
      />
    );
  }

  return (
    <>
      {/* GRID */}
      <PanditsGrid
        sectionTitle="All Pandits"
        pandits={pandits}
        requestedCalls={requestedCalls}
        loadingId={loadingId}
        onRequestCall={
          handleRequestCall
        }
      />

      {/* WAITING */}
      {Object.keys(requestedCalls)
        .length > 0 &&
        !incomingCall && (
          <div
            className="
              fixed
              bottom-0
              left-0
              right-0

              bg-primary-main

              text-white

              px-6
              py-4

              flex
              items-center
              gap-4

              z-40
            "
          >

            <div
              className="
                w-10
                h-10

                rounded-full

                bg-white/20

                flex
                items-center
                justify-center
              "
            >
              🙏
            </div>

            <div className="flex-1">

              <p
                className="
                  text-sm
                  font-medium
                "
              >
                Waiting for expert...
              </p>

              <p
                className="
                  text-xs
                  opacity-80
                "
              >
                You'll get a call shortly
              </p>

            </div>

          </div>
        )}

      {/* INCOMING */}
      {incomingCall && (
        <div
          className="
            fixed
            inset-0

            z-50

            bg-zinc-950

            flex
            flex-col
            items-center
            justify-between

            px-6
            py-16
          "
        >

          <div className="text-center">

            <p
              className="
                text-zinc-400

                tracking-widest
                uppercase

                text-xs

                mb-6
              "
            >
              Incoming Call
            </p>

            <div
              className="
                w-32
                h-32

                rounded-full

                bg-emerald-800

                flex
                items-center
                justify-center

                text-emerald-200

                font-bold
                text-4xl

                mx-auto
                mb-6
              "
            >
              {incomingCall.pandit?.name
                ?.slice(0, 2)
                .toUpperCase() ??
                "PA"}
            </div>

            <p
              className="
                text-white
                text-2xl
                font-semibold
              "
            >
              {incomingCall.pandit
                ?.name ?? "Pandit"}
            </p>

          </div>

          <div
            className="
              flex
              gap-20
            "
          >

            <button
              onClick={handleReject}
              className="
                w-20
                h-20

                rounded-full

                bg-red-500

                text-white
              "
            >
              Reject
            </button>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="
                w-20
                h-20

                rounded-full

                bg-emerald-500

                text-white
              "
            >
              {accepting
                ? "..."
                : "Accept"}
            </button>

          </div>

        </div>
      )}
    </>
  );
}

export default PanditsClient;