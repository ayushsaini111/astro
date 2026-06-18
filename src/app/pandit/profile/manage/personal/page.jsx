// app/pandit/profile/manage/personal/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader } from "lucide-react";
import Image from "next/image";
import { uploadFile } from "@/lib/uploadFile"; // ✅ Client-side upload only

export default function PersonalInformationPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ✅ Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pandit/profile");
        if (!res.ok) throw new Error("Failed to fetch");

        const result = await res.json();
        console.log("📥 Profile data:", result);
        setData(result);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Upload avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    try {
      // Upload to Cloudinary via your existing API
      const uploadResult = await uploadFile(file);
      console.log("✅ Upload result:", uploadResult);

      // Update profile in DB
      const res = await fetch("/api/pandit/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profilePic: uploadResult.url,
          profilePicPublicId: uploadResult.public_id,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setData({ ...data, profilePic: result.profilePic });
        setSuccess("✅ Avatar updated");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update avatar");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(`Error uploading avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ✅ Save field
  const handleSaveField = async (field) => {
    if (!tempValue.trim()) {
      setError("This field cannot be empty");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/pandit/profile/personal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: tempValue }),
      });

      if (res.ok) {
        setData({ ...data, [field]: tempValue });
        setEditField(null);
        setTempValue("");
        setSuccess(`✅ ${field} updated`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const result = await res.json();
        setError(result.error || "Failed to update field");
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      setError("Error saving field");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-main border-t-secondary-dark rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-secondary">Failed to load profile</p>
      </div>
    );
  }

  const fields = [
    { key: "name", label: "Full Name", placeholder: "Enter your full name" },
    { key: "email", label: "Email", placeholder: "Enter your email", type: "email" },
    { key: "phone", label: "Phone Number", placeholder: "Enter phone number", type: "tel" },
    { key: "about", label: "About", placeholder: "Tell about yourself", multiline: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background px-[var(--S16)] py-[var(--S24)] flex items-center gap-[var(--S16)] border-b border-secondary-main">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary-main transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-main" />
        </button>
        <h1 className="heading-h5 text-main">Personal Information</h1>
      </header>

      {/* Content */}
      <main className="px-[var(--S16)] py-[var(--S24)] max-w-2xl mx-auto pb-24">
        {error && (
          <div className="bg-red-main/10 border border-red-main rounded-[var(--R16)] p-[var(--S16)] mb-[var(--S24)] text-red-main text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-main/10 border border-green-main rounded-[var(--R16)] p-[var(--S16)] mb-[var(--S24)] text-green-main text-sm">
            {success}
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-[var(--S40)]">
          <div className="relative mb-[var(--S24)]">
            <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-white shadow-md border-4 border-secondary-main flex items-center justify-center">
              {data.profilePic ? (
                <Image
                  src={data.profilePic}
                  alt={data.name}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary-dark to-accent-main flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {data.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-primary-main shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95"
            >
              {uploadingAvatar ? (
                <Loader className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </label>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="hidden"
            />
          </div>

          <p className="text-secondary text-sm text-center">
            {uploadingAvatar ? "Uploading..." : "Tap camera icon to change photo"}
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-[var(--S16)]">
          {fields.map((field) => (
            <div
              key={field.key}
              className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main p-[var(--S16)]"
            >
              <label className="text-secondary text-sm font-medium block mb-[var(--S8)]">
                {field.label}
              </label>

              {editField === field.key ? (
                <div className="flex gap-[var(--S8)]">
                  {field.multiline ? (
                    <textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] border border-secondary-main bg-background focus:outline-none focus:ring-2 focus:ring-primary-main text-main text-sm resize-none min-h-24"
                      autoFocus
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] border border-secondary-main bg-background focus:outline-none focus:ring-2 focus:ring-primary-main text-main text-sm"
                      autoFocus
                    />
                  )}
                  <button
                    onClick={() => handleSaveField(field.key)}
                    disabled={saving}
                    className="px-[var(--S16)] py-[var(--S8)] rounded-[var(--R16)] bg-primary-main text-white text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    {saving ? "..." : "Save"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditField(field.key);
                    setTempValue(data[field.key] || "");
                  }}
                  className="w-full text-left text-main body-small hover:bg-secondary-main/20 p-[var(--S12)] rounded-[var(--R12)] transition-colors"
                >
                  {data[field.key] || "Not provided"}
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}