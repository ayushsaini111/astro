// hooks/useAgora.js
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

export function useAgora() {
  const [joined, setJoined] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [remoteLeft, setRemoteLeft] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const localTrackRef = useRef(null);

  // =========================================================
  // INIT CLIENT
  // =========================================================

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });
    }

    setReady(true);
  }, []);

  // =========================================================
  // JOIN CALL
  // =========================================================

  const joinCall = useCallback(
    async ({ appId, token, channelName, uid }) => {
      try {
        const client = clientRef.current;

        if (!client) {
          throw new Error("Agora client not initialized");
        }

        // ✅ prevent duplicate listeners during fast refresh
        client.removeAllListeners();

        // =========================================================
        // REMOTE USER PUBLISHED
        // =========================================================

        client.on("user-published", async (user, mediaType) => {
          console.log(
            "Remote user published:",
            user.uid,
            mediaType
          );

          await client.subscribe(user, mediaType);

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }

          // ✅ remote connected/reconnected
          setRemoteJoined(true);

          // ✅ reset leave state
          setRemoteLeft(false);
        });

        // =========================================================
        // REMOTE USER LEFT
        // =========================================================

        client.on("user-left", (user, reason) => {
          console.log(
            "Remote user left:",
            user.uid,
            "reason:",
            reason
          );

          setRemoteJoined(false);

          // ✅ ONLY real leave
          if (reason === "Quit") {
            setRemoteLeft(true);
          }

          // ✅ temporary timeout
          if (reason === "ServerTimeOut") {
            console.log(
              "Remote user timed out temporarily..."
            );
          }
        });

        // =========================================================
        // REMOTE USER UNPUBLISHED
        // =========================================================

        client.on(
          "user-unpublished",
          (user, mediaType) => {
            console.log(
              "Remote user unpublished:",
              user.uid,
              mediaType
            );
          }
        );

        // =========================================================
        // CONNECTION STATE
        // =========================================================

        client.on(
          "connection-state-change",
          (curState, prevState, reason) => {
            console.log(
              "Connection state:",
              prevState,
              "->",
              curState,
              "reason:",
              reason
            );

            // ❌ DO NOT END CALL HERE
            // temporary disconnects happen often

            if (curState === "RECONNECTING") {
              console.log("Reconnecting...");
            }

            if (curState === "CONNECTED") {
              console.log("Reconnected successfully");
            }
          }
        );

        // =========================================================
        // JOIN CHANNEL
        // =========================================================

        await client.join(
          appId,
          channelName,
          token,
          uid
        );

        // =========================================================
        // CREATE LOCAL AUDIO TRACK
        // =========================================================

        const localAudioTrack =
          await AgoraRTC.createMicrophoneAudioTrack();

        localTrackRef.current = localAudioTrack;

        await client.publish([localAudioTrack]);

        setJoined(true);
        setError(null);

        console.log(
          "Joined Agora channel:",
          channelName
        );
      } catch (e) {
        console.error("Join call error:", e);

        setError(
          e?.message || "Failed to join call"
        );
      }
    },
    []
  );

  // =========================================================
  // LEAVE CALL
  // =========================================================

  const leaveCall = useCallback(async () => {
    try {
      const client = clientRef.current;

      // =========================================================
      // STOP LOCAL TRACK
      // =========================================================

      if (localTrackRef.current) {
        localTrackRef.current.stop();
        localTrackRef.current.close();
        localTrackRef.current = null;
      }

      // =========================================================
      // LEAVE CHANNEL
      // =========================================================

      if (client) {
        client.removeAllListeners();

        await client.leave();
      }

      setJoined(false);
      setRemoteJoined(false);
      setRemoteLeft(false);
      setMuted(false);

      console.log("Left Agora channel");
    } catch (e) {
      console.error("Leave call error:", e);
    }
  }, []);

  // =========================================================
  // TOGGLE MUTE
  // =========================================================

  const toggleMute = useCallback(async () => {
    try {
      if (!localTrackRef.current) return;

      const newMuted = !muted;

      await localTrackRef.current.setEnabled(
        !newMuted
      );

      setMuted(newMuted);
    } catch (e) {
      console.error("Mute error:", e);
    }
  }, [muted]);

  // =========================================================
  // RETURN
  // =========================================================

  return {
    joined,
    remoteJoined,
    remoteLeft,
    muted,
    ready,
    error,
    joinCall,
    leaveCall,
    toggleMute,
  };
}