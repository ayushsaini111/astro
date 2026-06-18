// app/api/upload/route.js
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import streamifier from "streamifier";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ message: "File required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ message: "Empty file" }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    let resourceType = file.type.startsWith("image") ? "image" : "video";

    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder: "pandits", // ← Changed from "ayansh" to "pandits"
          resource_type: resourceType, 
          timeout: 120000 
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });

    return NextResponse.json({
      success: true,
      data: {
        url: upload.secure_url,
        public_id: upload.public_id, // ✅ Important for deletion
        resource_type: upload.resource_type,
      },
    });
  } catch (err) {
    console.error("❌ Upload API error:", err);
    return NextResponse.json(
      { message: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}