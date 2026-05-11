import { RtcTokenBuilder, RtcRole } from "agora-token";

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

export function generateAgoraToken(channelName, uid) {
  
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 hour in seconds
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  return token;
}