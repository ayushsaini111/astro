import { Storage } from "@google-cloud/storage";

let storage;
export function getBucket() {
  if (!process.env.GCS_CLIENT_EMAIL || !process.env.GCS_PRIVATE_KEY) {
    throw new Error("Missing GCS_CLIENT_EMAIL / GCS_PRIVATE_KEY in env");
  }
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
    });
  }
  return storage.bucket(process.env.GCS_BUCKET_NAME);
}