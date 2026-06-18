// app/pandit/profile/manage/expertise/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, Plus } from "lucide-react";

const AVAILABLE_EXPERTISE = [
  "Vedic Astrology",
  "Numerology",
  "Tarot Reading",
  "Vastu Shastra",
  "Palmistry",
  "Career Guidance",
  "Relationship Advice",
  "Business Consulting",
  "Pooja",
  "Tantra",
];

const AVAILABLE_LANGUAGES = [
  "Hindi",
  "English",
  "Sanskrit",
  "Gujarati",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
  "Punjabi",
];

export default function ExpertiseLanguagesPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expertise, setExpertise] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [showExpertiseDropdown, setShowExpertiseDropdown] = useState(false);
  const [showLanguagesDropdown, setShowLanguagesDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pandit/profile");
        if (!res.ok) throw new Error("Failed to fetch");

        const result = await res.json();
        console.log("📥 Profile data:", result);
        setData(result);
        setExpertise(result.speciality || []);
        setLanguages(result.languages || []);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowExpertiseDropdown(false);
      setShowLanguagesDropdown(false);
    };

    if (showExpertiseDropdown || showLanguagesDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showExpertiseDropdown, showLanguagesDropdown]);

  // ✅ Generic update function
  const updateProfile = async (updateData, rollbackData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/pandit/profile/expertise", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        // Rollback on error
        if (rollbackData.speciality) setExpertise(rollbackData.speciality);
        if (rollbackData.languages) setLanguages(rollbackData.languages);
        
        const errorData = await res.json();
        setError(errorData.error || "Failed to update");
        setTimeout(() => setError(null), 3000);
      } else {
        setError(null);
      }
    } catch (err) {
      // Rollback on error
      if (rollbackData.speciality) setExpertise(rollbackData.speciality);
      if (rollbackData.languages) setLanguages(rollbackData.languages);
      setError("Error updating profile");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Add expertise
  const addExpertise = async (item) => {
    if (expertise.includes(item)) {
      setError("This expertise already exists");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const oldExpertise = [...expertise];
    const newExpertise = [...expertise, item];
    setExpertise(newExpertise);
    setShowExpertiseDropdown(false);

    await updateProfile(
      { speciality: newExpertise },
      { speciality: oldExpertise }
    );
  };

  // ✅ Remove expertise
  const removeExpertise = async (item) => {
    const oldExpertise = [...expertise];
    const newExpertise = expertise.filter((e) => e !== item);
    setExpertise(newExpertise);

    await updateProfile(
      { speciality: newExpertise },
      { speciality: oldExpertise }
    );
  };

  // ✅ Add language
  const addLanguage = async (item) => {
    if (languages.includes(item)) {
      setError("This language already exists");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const oldLanguages = [...languages];
    const newLanguages = [...languages, item];
    setLanguages(newLanguages);
    setShowLanguagesDropdown(false);

    await updateProfile(
      { languages: newLanguages },
      { languages: oldLanguages }
    );
  };

  // ✅ Remove language
  const removeLanguage = async (item) => {
    const oldLanguages = [...languages];
    const newLanguages = languages.filter((l) => l !== item);
    setLanguages(newLanguages);

    await updateProfile(
      { languages: newLanguages },
      { languages: oldLanguages }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-main border-t-secondary-dark rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

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
        <h1 className="heading-h5 text-main">Expertise & Languages</h1>
      </header>

      {/* Content */}
      <main className="px-[var(--S16)] py-[var(--S24)] max-w-2xl mx-auto pb-24">
        {error && (
          <div className="bg-red-main/10 border border-red-main rounded-[var(--R16)] p-[var(--S16)] mb-[var(--S24)] text-red-main text-sm">
            {error}
          </div>
        )}

        {/* Expertise Section */}
        <section className="mb-[var(--S32)]">
          <h2 className="heading-h6 text-main mb-[var(--S16)]">Your Expertise</h2>
          <div className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main p-[var(--S16)]">
            {/* Chips */}
            <div className="flex flex-wrap gap-[var(--S8)] mb-[var(--S16)]">
              {expertise.length === 0 ? (
                <p className="text-secondary text-sm w-full">No expertise added yet</p>
              ) : (
                expertise.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-[var(--S8)] px-[var(--S12)] py-[var(--S6)] rounded-full bg-secondary-main text-primary-main text-sm font-medium"
                  >
                    {item}
                    <button
                      onClick={() => removeExpertise(item)}
                      disabled={saving}
                      className="hover:opacity-70 transition-opacity disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowExpertiseDropdown(!showExpertiseDropdown)}
                disabled={saving}
                className="flex items-center gap-[var(--S6)] px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] bg-secondary-main text-primary-main text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Expertise
              </button>

              {/* Dropdown */}
              {showExpertiseDropdown && (
                <div className="absolute top-full left-0 mt-[var(--S8)] w-full rounded-[var(--R16)] shadow-lg border border-secondary-main bg-white z-50 max-h-48 overflow-y-auto">
                  {AVAILABLE_EXPERTISE.filter((item) => !expertise.includes(item)).length === 0 ? (
                    <div className="px-[var(--S16)] py-[var(--S12)] text-sm text-secondary">
                      All expertise added
                    </div>
                  ) : (
                    AVAILABLE_EXPERTISE.filter((item) => !expertise.includes(item)).map((item) => (
                      <button
                        key={item}
                        onClick={() => addExpertise(item)}
                        className="w-full text-left px-[var(--S16)] py-[var(--S12)] hover:bg-secondary-main transition-colors text-sm text-main border-b border-secondary-main last:border-0"
                      >
                        {item}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section>
          <h2 className="heading-h6 text-main mb-[var(--S16)]">Languages</h2>
          <div className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main p-[var(--S16)]">
            {/* Chips */}
            <div className="flex flex-wrap gap-[var(--S8)] mb-[var(--S16)]">
              {languages.length === 0 ? (
                <p className="text-secondary text-sm w-full">No languages added yet</p>
              ) : (
                languages.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-[var(--S8)] px-[var(--S12)] py-[var(--S6)] rounded-full bg-secondary-main text-primary-main text-sm font-medium"
                  >
                    {item}
                    <button
                      onClick={() => removeLanguage(item)}
                      disabled={saving}
                      className="hover:opacity-70 transition-opacity disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowLanguagesDropdown(!showLanguagesDropdown)}
                disabled={saving}
                className="flex items-center gap-[var(--S6)] px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] bg-secondary-main text-primary-main text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Language
              </button>

              {/* Dropdown */}
              {showLanguagesDropdown && (
                <div className="absolute top-full left-0 mt-[var(--S8)] w-full rounded-[var(--R16)] shadow-lg border border-secondary-main bg-white z-50 max-h-48 overflow-y-auto">
                  {AVAILABLE_LANGUAGES.filter((item) => !languages.includes(item)).length === 0 ? (
                    <div className="px-[var(--S16)] py-[var(--S12)] text-sm text-secondary">
                      All languages added
                    </div>
                  ) : (
                    AVAILABLE_LANGUAGES.filter((item) => !languages.includes(item)).map((item) => (
                      <button
                        key={item}
                        onClick={() => addLanguage(item)}
                        className="w-full text-left px-[var(--S16)] py-[var(--S12)] hover:bg-secondary-main transition-colors text-sm text-main border-b border-secondary-main last:border-0"
                      >
                        {item}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Status Indicator */}
        {saving && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-primary-main text-white px-4 py-2 rounded-full text-sm">
            Saving...
          </div>
        )}
      </main>
    </div>
  );
}