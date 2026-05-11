"use client";

import { useEffect, useRef, useState } from "react";

export function useAgora() {
  const clientRef = useRef(null);
  const localTrackRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(2);
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;
        if (mounted) {
          setReady(true);
          console.log("✅ Agora ready");
        }
      } catch (e) {
        console.error("❌ Init error:", e);
        if (mounted) setError("Failed to init Agora");
      }
    }
    init();
    return () => {
      mounted = false;
      clientRef.current?.removeAllListeners();
      clientRef.current?.leave().catch(() => {});
      localTrackRef.current?.stop();
      localTrackRef.current?.close();
    };
  }, []);

  async function joinCall({ appId, token, channelName, uid }) {
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const client = clientRef.current;
      if (!client) throw new Error("Client not ready");

      console.log("🔗 Joining:", channelName, uid);

      // ✅ Set up listeners BEFORE joining so we don't miss events
      client.removeAllListeners();

      client.on("user-published", async (user, mediaType) => {
        console.log("📡 user-published:", user.uid, mediaType);
        try {
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") {
            user.audioTrack?.play();
            setRemoteJoined(true);
            console.log("🔊 Remote audio playing");
          }
        } catch (err) {
          console.error("Subscribe error:", err);
        }
      });

      client.on("user-unpublished", (user) => {
        user.audioTrack?.stop();
      });

      client.on("user-left", () => {
        console.log("📵 Remote left");
        setRemoteJoined(false);
        setJoined(false);
      });

      // ✅ Join AFTER listeners are set
      await client.join(appId, channelName, token, uid);
      console.log("✅ Joined");

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([audioTrack]);
      localTrackRef.current = audioTrack;
      setJoined(true);
      console.log("🎙️ Published mic");

      // ✅ Check if remote user already in channel (race condition fix)
      const remoteUsers = client.remoteUsers;
      console.log("👥 Remote users already in channel:", remoteUsers.length);
      for (const user of remoteUsers) {
        if (user.hasAudio) {
          await client.subscribe(user, "audio");
          user.audioTrack?.play();
          setRemoteJoined(true);
          console.log("🔊 Already-present remote audio playing");
        }
      }

    } catch (err) {
      console.error("❌ Join error:", err);
      setError(err.message);
    }
  }

  async function leaveCall() {
    try {
      localTrackRef.current?.stop();
      localTrackRef.current?.close();
      localTrackRef.current = null;
      clientRef.current?.removeAllListeners();
      await clientRef.current?.leave();
      setJoined(false);
      setRemoteJoined(false);
      console.log("✅ Left");
    } catch (err) {
      console.error("❌ Leave error:", err);
    }
  }

  async function toggleMute() {
    if (!localTrackRef.current) return;
    const next = !muted;
    await localTrackRef.current.setMuted(next);
    setMuted(next);
  }

  return { joined, remoteJoined, muted, ready, error, joinCall, leaveCall, toggleMute };
}