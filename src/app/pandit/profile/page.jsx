"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Camera, Settings } from "lucide-react";
import Image from "next/image";

export default function PanditProfilePage() {
  const router = useRouter();
  const [panditData, setPanditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanditData = async () => {
      try {
        const res = await fetch("/api/pandit/profile");
        const data = await res.json();
        setPanditData(data);
      } catch (error) {
        console.error("Error fetching pandit profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPanditData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4E6DB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3A0E45] border-t-[#D4AF8F] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B5B4F]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!panditData) {
    return (
      <div className="min-h-screen bg-[#F4E6DB] flex items-center justify-center">
        <p className="text-[#6B5B4F] text-lg">Failed to load profile</p>
      </div>
    );
  }

  const expertise = panditData.speciality || ["Vedic", "Pooja", "Astrology"];
  const languages = ["Hindi", "English", "Sanskrit"];
  const consultations = panditData.totalCalls || 0;
  const yearsExperience = 8;

  return (
    <div className="min-h-screen bg-[#F4E6DB]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F4E6DB] px-6 py-5 flex items-center justify-between border-b border-[#E8D7C8]">
        <h1 className="text-3xl font-bold text-[#3A0E45]">Profile</h1>
        <button
          className="relative w-11 h-11 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow flex items-center justify-center group"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-[#3A0E45]" />
          <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 pb-20">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            {/* Avatar Circle */}
            <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-white shadow-xl border-4 border-[#E8D7C8]">
              {panditData.profilePic ? (
                <Image
                  src={panditData.profilePic}
                  alt={panditData.name}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#D4AF8F] to-[#B8956F] flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {panditData.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => router.push("/pandit/profile/manage/personal")}
              className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-[#3A0E45] shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
              aria-label="Edit photo"
            >
              <Camera className="w-5 h-5 text-white" />
              <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-[#3A0E45] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Edit Photo
              </span>
            </button>
          </div>

          {/* Name */}
          <h2 className="text-3xl font-bold text-[#3A0E45] text-center mb-2">
            {panditData.name}
          </h2>
          <p className="text-[#8B7B71] text-sm text-center">
            Verified Spiritual Consultant
          </p>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Consultations Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-[#E8D7C8] hover:shadow-lg transition-shadow">
            <p className="text-4xl font-bold text-[#3A0E45] mb-2">
              {consultations}
            </p>
            <p className="text-sm text-[#8B7B71] font-medium">Consultations</p>
          </div>

          {/* Years Experience Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-[#E8D7C8] hover:shadow-lg transition-shadow">
            <p className="text-4xl font-bold text-[#3A0E45] mb-2">
              {yearsExperience}
            </p>
            <p className="text-sm text-[#8B7B71] font-medium">Years Experience</p>
          </div>
        </div>

        {/* Expertise Section */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-[#3A0E45] mb-4">Expertise</h3>
          <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E8D7C8]">
            <div className="flex flex-wrap gap-3">
              {expertise.map((skill, index) => (
                <TagPill key={index} label={skill} />
              ))}
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-[#3A0E45] mb-4">Languages</h3>
          <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E8D7C8]">
            <div className="flex flex-wrap gap-3">
              {languages.map((language, index) => (
                <TagPill key={index} label={language} />
              ))}
            </div>
          </div>
        </section>

        {/* Rate Per Minute */}
        {panditData.ratePerMin && (
          <section className="mb-10">
            <h3 className="text-lg font-bold text-[#3A0E45] mb-4">Consultation Rate</h3>
            <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E8D7C8]">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#3A0E45]">
                  ₹{panditData.ratePerMin}
                </p>
                <p className="text-[#8B7B71] text-sm">/minute</p>
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-[#3A0E45] mb-4">About</h3>
          <div className="bg-white rounded-2xl shadow-md p-6 border border-[#E8D7C8]">
            <p className="text-[#6B5B4F] text-sm leading-relaxed">
              Experienced spiritual consultant with expertise in vedic astrology,
              relationship guidance, and career counseling. Dedicated to providing
              authentic and compassionate guidance.
            </p>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-[#3A0E45] mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Available Status" value={panditData.isAvailable ? "Active" : "Inactive"} />
            <StatCard label="Member Since" value="2024" />
          </div>
        </section>
      </main>

      {/* CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#F4E6DB] to-transparent pt-4 px-6 pb-6">
        <button
          onClick={() => router.push("/pandit/profile/manage")}
          className="w-full py-4 rounded-full bg-[#3A0E45] text-white font-semibold text-lg transition-all hover:bg-[#2A0735] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
        >
          <Settings className="w-5 h-5" />
          <span>Manage Account</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────

function TagPill({ label }) {
  return (
    <div className="px-4 py-2 rounded-full bg-[#F4E6DB] text-[#7B5FA3] text-sm font-medium border border-[#E8D7C8] hover:bg-[#E8D7C8] transition-colors cursor-default">
      {label}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8D7C8]">
      <p className="text-[#8B7B71] text-xs font-medium mb-2">{label}</p>
      <p className="text-lg font-bold text-[#3A0E45]">{value}</p>
    </div>
  );
}