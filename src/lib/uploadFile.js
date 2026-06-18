// lib/uploadFile.js
"use client";
import axios from "axios";

export async function uploadFile(file) {
  if (!file) throw new Error("No file provided");
  if (file.size === 0) throw new Error("File is empty");

  console.log(`📤 ${file.name} | ${(file.size / 1024 / 1024).toFixed(2)} MB`);

  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });

  if (!res?.data?.data?.url) throw new Error("Invalid upload response");
  return res.data.data; // { url, public_id, resource_type }
}