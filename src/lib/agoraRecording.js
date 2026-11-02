import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { prisma } from "@/lib/prisma";

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
const BASE_URL = `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording`;
const AUTH = {
  Authorization:
    "Basic " +
    Buffer.from(`${process.env.AGORA_CUSTOMER_ID}:${process.env.AGORA_CUSTOMER_SECRET}`).toString("base64"),
  "Content-Type": "application/json",
};

const slug = (s) =>
  String(s || "pandit").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pandit";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function recordingUidFor(callId) {
  let h = 0;
  for (let i = 0; i < callId.length; i++) h = (h * 31 + callId.charCodeAt(i)) >>> 0;
  return String(900000000 + (h % 90000000));
}

async function agoraFetch(path, body) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers: AUTH, body: JSON.stringify(body) });
  } catch (e) {
    throw new Error(`Agora network failure: ${e.cause?.code || e.message}`);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`🔴 [rec] ${path} HTTP ${res.status}:`, JSON.stringify(json));
    const err = new Error(json?.reason || `Agora API error ${res.status}`);
    err.agoraCode = json?.code;
    throw err;
  }
  return json;
}

// Call right after pandit accepts. Safe to call twice: the DB row is claimed first.
export async function startCallRecording({ callId, channelName, panditId, panditName }) {
  const folder = ["recordings", `${slug(panditName)}_${panditId}`, callId];

  try {
    await prisma.recording.create({
      data: {
        callId, resourceId: "", sid: "", recordingUid: "",
        gcsBucket: process.env.GCS_BUCKET_NAME || "",
        fileNamePrefix: folder.join("/"), fileList: [], status: "STARTING",
      },
    });
  } catch (e) {
    if (e.code === "P2002") return; // already started
    throw e;
  }

  const uid = recordingUidFor(callId);
  try {
    const { resourceId } = await agoraFetch(`/acquire`, {
      cname: channelName, uid,
      clientRequest: { resourceExpiredHour: 24, scene: 0 },
    });

    const ts = Math.floor(Date.now() / 1000);
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID, APP_CERT, channelName, Number(uid), RtcRole.SUBSCRIBER, ts + 3600 * 3
    );

    const { sid } = await agoraFetch(`/resourceid/${resourceId}/mode/mix/start`, {
      cname: channelName, uid,
      clientRequest: {
        token,
        recordingConfig: { channelType: 0, streamTypes: 0, audioProfile: 0, maxIdleTime: 60 },
        recordingFileConfig: { avFileType: ["hls", "mp4"] }, // Agora requires hls with mp4 in mix mode
        storageConfig: {
          vendor: 6,
          region: 15,
          bucket: process.env.GCS_BUCKET_NAME,
          accessKey: process.env.GCS_HMAC_ACCESS_KEY,
          secretKey: process.env.GCS_HMAC_SECRET_KEY,
          fileNamePrefix: folder,
        },
      },
    });

    await prisma.recording.update({
      where: { callId },
      data: { resourceId, sid, recordingUid: uid, status: "RECORDING" },
    });
    console.log(`🟢 [rec] started ${callId}`);
  } catch (e) {
    await prisma.recording.update({ where: { callId }, data: { status: "FAILED" } }).catch(() => {});
    throw e;
  }
}

export async function stopCallRecording(callId, channelName) {
  let rec = await prisma.recording.findUnique({ where: { callId } });
  if (!rec) return;

  // call ended while start() was still running: wait for it (max 8s)
  for (let i = 0; i < 8 && rec.status === "STARTING"; i++) {
    await sleep(1000);
    rec = await prisma.recording.findUnique({ where: { callId } });
  }
  if (rec.status !== "RECORDING") return;

  try {
    const res = await agoraFetch(`/resourceid/${rec.resourceId}/sid/${rec.sid}/mode/mix/stop`, {
      cname: channelName, uid: rec.recordingUid, clientRequest: {},
    });

    const fileList = (res?.serverResponse?.fileList || [])
      .map((f) => (typeof f === "string" ? f : f.fileName))
      .filter((n) => n && n.endsWith(".mp4")); // keep only the mp4

    await prisma.recording.update({
      where: { callId },
      data: { status: "STOPPED", stoppedAt: new Date(), fileList },
    });
    console.log(`🟢 [rec] stopped`, fileList);
  } catch (e) {
    console.error(`🔴 [rec] stop failed ${callId}:`, e.message);
    await prisma.recording.update({
      where: { callId }, data: { status: "FAILED", stoppedAt: new Date() },
    }).catch(() => {});
  }
}