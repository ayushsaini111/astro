// lib/cloudinary.js (SERVER-SIDE ONLY)
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Extract public_id from Cloudinary URL
 * e.g. https://res.cloudinary.com/demo/image/upload/v123/ayansh/abc123.jpg
 * returns "ayansh/abc123"
 */
export function extractPublicId(url) {
  if (!url) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete image from Cloudinary using public_id
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Cloudinary delete result for "${publicId}":`, result);
    return result.result === "ok" || result.result === "not found";
  } catch (err) {
    console.error("❌ Cloudinary delete error:", err.message);
    return false;
  }
}

/**
 * Delete image from Cloudinary using URL (extracts public_id first)
 */
export async function deleteImageFromCloudinary(imageUrl) {
  if (!imageUrl) return false;

  const publicId = extractPublicId(imageUrl);
  if (!publicId) {
    console.warn("⚠️ Could not extract public_id from:", imageUrl);
    return false;
  }

  return await deleteFromCloudinary(publicId);
}

export default cloudinary;