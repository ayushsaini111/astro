import { getBucket } from "@/lib/gcsClient";

export async function getSignedPlaybackUrl(objectPath, expiresInMinutes = 15) {
  const [url] = await getBucket().file(objectPath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}