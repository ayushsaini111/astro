"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/uploadFile"; // ✅ Use your existing upload

const PANDIT_TYPES = [
  "Vedic", "Pooja", "Vastu", "Astrology",
  "Numerology", "Tantra", "Palmistry", "Tarot",
];

const LANGUAGES = [
  "Hindi", "English", "Sanskrit", "Gujarati",
  "Marathi", "Tamil", "Telugu", "Kannada",
];

export default function CreateTestPanditPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    dob: "",
    about: "",
    speciality: [],
    languages: [],
    isAvailable: true,
  });

  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState("basic");
  const fileInputRef = useRef(null);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function toggleType(type) {
    setFormData((prev) => ({
      ...prev,
      speciality: prev.speciality.includes(type)
        ? prev.speciality.filter((t) => t !== type)
        : [...prev.speciality, type],
    }));
  }

  function toggleLanguage(lang) {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  }

  async function handleImageUpload(e) {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result);
    };
    reader.readAsDataURL(file);

    setProfilePic(file);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    // Validation
    if (!formData.name || !formData.username || !formData.password) {
      setError("Name, username, and password are required");
      return;
    }

    if (!formData.email) {
      setError("Email is required");
      return;
    }

    if (!formData.phone) {
      setError("Phone number is required");
      return;
    }

    if (formData.speciality.length === 0) {
      setError("Please select at least one type of pandit");
      return;
    }

    if (formData.languages.length === 0) {
      setError("Please select at least one language");
      return;
    }

    setLoading(true);

    let profilePicUrl = null;
    let profilePicPublicId = null;

    if (profilePic) {
      setUploadingImage(true);
      try {
        const uploadResult = await uploadFile(profilePic);
        profilePicUrl = uploadResult.url;
        profilePicPublicId = uploadResult.public_id;
        console.log("✅ Upload success:", { profilePicUrl, profilePicPublicId });
      } catch (err) {
        setError(`Image upload failed: ${err.message}`);
        setLoading(false);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      const res = await fetch("/api/pandit/create-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profilePic: profilePicUrl,
          profilePicPublicId: profilePicPublicId, // ✅ Store for future deletion
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to create test pandit");
        return;
      }

      setResult(data);

      // Reset form
      setFormData({
        name: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        dob: "",
        about: "",
        speciality: [],
        languages: [],
        isAvailable: true,
      });
      setProfilePic(null);
      setPreviewUrl(null);
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Check the console / dev server logs.");
      console.error(err);
    }
  }

  const SectionHeader = ({ id, title, count }) => (
    <button
      type="button"
      onClick={() =>
        setExpandedSection(expandedSection === id ? null : id)
      }
      className="w-full flex items-center justify-between py-3 px-4 bg-secondary-main rounded-[var(--R16)] hover:bg-secondary-dark transition-colors"
    >
      <span className="text-sm font-semibold text-main">{title}</span>
      {count > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-main text-white">
          {count}
        </span>
      )}
    </button>
  );

  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md sm:max-w-lg bg-secondary-main rounded-[var(--R24)] p-8 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-main/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-main"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="heading-h4 text-main mb-2">
              Pandit Created Successfully! 🎉
            </h2>
            <p className="body-default text-secondary mb-6">
              You can now log in with the credentials below.
            </p>
          </div>

          <div className="bg-white rounded-[var(--R16)] p-4 space-y-3 mb-6 font-mono text-xs text-secondary">
            <div className="border-b border-black/10 pb-3">
              <p className="text-gray-500 mb-1">Username</p>
              <p className="text-main font-medium">{result.pandit.username}</p>
            </div>
            <div className="border-b border-black/10 pb-3">
              <p className="text-gray-500 mb-1">Name</p>
              <p className="text-main font-medium">{result.pandit.name}</p>
            </div>
            <div className="border-b border-black/10 pb-3">
              <p className="text-gray-500 mb-1">Email</p>
              <p className="text-main font-medium">{result.pandit.email}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Phone</p>
              <p className="text-main font-medium">{result.pandit.phone}</p>
            </div>
          </div>

          <div className="bg-blue-main/10 border border-blue-main rounded-[var(--R12)] p-3 mb-6">
            <p className="text-xs text-secondary leading-relaxed">
              💡 <strong>Login at:</strong>{" "}
              <a
                href="/pandit/login"
                className="text-primary-main underline font-medium"
              >
                /pandit/login
              </a>
            </p>
          </div>

          <button
            onClick={() => {
              setResult(null);
              window.location.reload();
            }}
            className="w-full py-3 rounded-[var(--R16)] bg-primary-main text-white font-medium hover:bg-primary-light transition-colors"
          >
            Create Another Pandit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md sm:max-w-lg bg-secondary-main rounded-[var(--R24)] px-6 py-10 shadow-sm">
        <div className="mb-8">
          <h1 className="heading-h2 text-main">Create Test Pandit</h1>
          <p className="body-default text-secondary mt-2">
            For local testing only — Fill all required fields
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture */}
          <div>
            <label className="body-default text-secondary block mb-2">
              Profile Picture
            </label>
            <div>
              {previewUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-[var(--R16)] overflow-hidden border-2 border-primary-main">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setProfilePic(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="absolute top-0 right-0 bg-red-main text-white rounded-full p-1 hover:bg-red-dark"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary-main underline"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-black/40 rounded-[var(--R16)] px-4 py-6 text-sm text-secondary hover:border-primary-main hover:text-primary-main transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? "Uploading..." : "Click to upload image"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </div>
          </div>

          {/* Rest of form sections - same as before */}
          <div className="space-y-3">
            <SectionHeader id="basic" title="Basic Information" count={0} />
            {expandedSection === "basic" && (
              <div className="space-y-3 pl-2">
                <div>
                  <label className="caption text-secondary block mb-1.5">
                    Full Name *
                  </label>
                  <div className="flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
                      placeholder="Ramesh Sharma"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="caption text-secondary block mb-1.5">
                    Username *
                  </label>
                  <div className="flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
                      placeholder="ramesh"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="caption text-secondary block mb-1.5">
                    Password *
                  </label>
                  <div className="flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="caption text-secondary block mb-1.5">
                    Email *
                  </label>
                  <div className="flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
                      placeholder="pandit@example.com"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <SectionHeader id="contact" title="Contact Details" count={0} />
            {expandedSection === "contact" && (
              <div className="space-y-3 pl-2">
                <div>
                  <label className="caption text-secondary block mb-1.5">
                    Phone *
                  </label>
                  <div className="flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main placeholder:text-secondary"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="caption text-secondary block mb-1.5">
                    Date of Birth
                  </label>
                  <div className="flex items-center border border-black rounded-[var(--R16)] px-4 py-3">
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main"
                    />
                  </div>
                </div>

                <div>
                  <label className="caption text-secondary block mb-1.5">
                    About
                  </label>
                  <div className="border border-black rounded-[var(--R16)] px-4 py-3">
                    <textarea
                      name="about"
                      value={formData.about}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none w-full text-main placeholder:text-secondary text-sm resize-none"
                      placeholder="Write about yourself..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speciality */}
          <div className="space-y-3">
            <SectionHeader
              id="speciality"
              title="Type of Pandit"
              count={formData.speciality.length}
            />
            {expandedSection === "speciality" && (
              <div className="grid grid-cols-2 gap-2 pl-2">
                {PANDIT_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 border rounded-[var(--R16)] px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      formData.speciality.includes(type)
                        ? "border-primary-main bg-primary-main/5 text-primary-main"
                        : "border-black/30 hover:border-black/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.speciality.includes(type)}
                      onChange={() => toggleType(type)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <SectionHeader
              id="languages"
              title="Languages"
              count={formData.languages.length}
            />
            {expandedSection === "languages" && (
              <div className="grid grid-cols-2 gap-2 pl-2">
                {LANGUAGES.map((lang) => (
                  <label
                    key={lang}
                    className={`flex items-center gap-2 border rounded-[var(--R16)] px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      formData.languages.includes(lang)
                        ? "border-primary-main bg-primary-main/5 text-primary-main"
                        : "border-black/30 hover:border-black/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{lang}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-main/10 border border-red-main rounded-[var(--R16)] p-3">
              <p className="text-xs text-red-main">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full mt-6 bg-primary-main cursor-pointer text-white py-3 rounded-[var(--R16)] font-medium disabled:opacity-50 hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
          >
            {(loading || uploadingImage) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {loading
              ? "Creating..."
              : uploadingImage
              ? "Uploading Image..."
              : "Create Test Pandit"}
          </button>
        </form>
      </div>
    </div>
  );
}