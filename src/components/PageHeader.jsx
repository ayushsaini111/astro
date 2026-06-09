'use client'

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, CreditCard, HelpCircle, LogOut, X,
  Calendar, Phone, Star, Settings, ChevronRight,
  Check, AlertCircle, Edit2
} from "lucide-react";

function calcCompletion(user) {
  const fields = [
    { label: "Username",  done: !!user?.username },
    { label: "Phone",     done: !!user?.phone },
    { label: "Email",     done: !!user?.email },
    { label: "Birthday",  done: !!user?.dob },
    { label: "Gender",    done: !!user?.gender },
    { label: "Address",   done: !!user?.address },
  ];
  const done = fields.filter(f => f.done).length;
  return { fields, percent: Math.round((done / fields.length) * 100) };
}

function PageHeader({
  title, subtitle,
  notificationClassName = "",
  profileClassName = "",
  className = "",
  showNotification = true,
  showProfile = true,
}) {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [showSidebar, setShowSidebar]   = useState(false);
  const [activeTab, setActiveTab]       = useState("menu"); // "menu" | "profile"
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState("");
  const [saveSuccess, setSaveSuccess]   = useState(false);

  // Editable fields
  const [form, setForm] = useState({
    username: "", dob: "", gender: "", address: "", phone: "",
  });

  const user = session?.user ?? null;
  const isLoading = status === "loading";
  const isLoggedIn = !!user;
  const resolvedImage = user?.image ?? user?.profilePic ?? null;
  const resolvedName  = user?.username ?? user?.name ?? null;
  const resolvedRole  = user?.role ?? "user";
  const initials      = (resolvedName ?? "U").slice(0, 1).toUpperCase();
  const { fields, percent } = calcCompletion(user);

  // Pre-fill form when sidebar opens
  useEffect(() => {
    if (showSidebar && user) {
      setForm({
        username: user.username ?? "",
        dob:      user.dob ? user.dob.slice(0, 10) : "",
        gender:   user.gender   ?? "",
        address:  user.address  ?? "",
        phone:    user.phone    ?? "",
      });
      setSaveError("");
      setSaveSuccess(false);
    }
  }, [showSidebar, user]);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? "Failed to save"); return; }
      await updateSession(); // refresh NextAuth session
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setSaveError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setShowSidebar(false);
    await signOut({ callbackUrl: "/login" });
  }

  const menuItems = resolvedRole === "pandit" ? [
    { icon: User,       label: "Dashboard",      path: "/pandit" },
    { icon: CreditCard, label: "Earnings",        path: "/pandit/earnings" },
    { icon: Settings,   label: "Settings",        path: "/pandit/settings" },
    { icon: HelpCircle, label: "Help & Support",  path: "/support" },
  ] : [
    { icon: User,       label: "My Profile",      path: "/profile" },
    { icon: CreditCard, label: "Plans & Wallet",  path: "/plans" },
    { icon: Settings,   label: "Settings",        path: "/settings" },
    { icon: HelpCircle, label: "Help & Support",  path: "/support" },
  ];

  return (
    <>
      <div className={`flex items-start py-s16 px-s16 md:px-s32 justify-between ${className}`}>
        <div>
          <h1 className="heading-h2 text-main">{title}</h1>
          {subtitle && <p className="body-default text-secondary">{subtitle}</p>}
        </div>

        <div className="flex justify-center items-center gap-s16 md:hidden">
          {/* {showNotification && (
            <button
              onClick={() => isLoggedIn ? router.push("/notifications") : router.push("/login")}
              className={`w-s40 h-s40 rounded-full border border-secondary flex items-center justify-center hover:bg-black/5 transition-colors ${notificationClassName}`}
            >
              🔔
            </button>
          )} */}

          {showProfile && (
            <button
              onClick={() => setShowSidebar(true)}
              className={`relative w-s48 h-s48 rounded-full overflow-visible flex items-center justify-center border border-black/10 flex-shrink-0 cursor-pointer bg-primary-main/10 hover:opacity-80 transition-opacity ${profileClassName}`}
            >
              {/* completion ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="23" fill="none" stroke="#E8D8EA" strokeWidth="3" />
                <circle cx="26" cy="26" r="23" fill="none" stroke="#9B59B6" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={`${2 * Math.PI * 23 * (1 - percent / 100)}`}
                  strokeLinecap="round" />
              </svg>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />
                ) : resolvedImage ? (
                  <Image src={resolvedImage} alt={resolvedName ?? "Profile"} width={48} height={48}
                    className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                ) : isLoggedIn ? (
                  <span className="text-sm font-bold text-primary-main">{initials}</span>
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />

          <div className="absolute right-0 top-0 h-full w-80 max-w-[88vw] bg-white shadow-xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex gap-s4">
                <button
                  onClick={() => setActiveTab("menu")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === "menu" ? "bg-primary-main text-white" : "text-secondary hover:bg-gray-100"}`}
                >
                  Menu
                </button>
                {isLoggedIn && (
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-primary-main text-white" : "text-secondary hover:bg-gray-100"}`}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <button onClick={() => setShowSidebar(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            {/* ── MENU TAB ── */}
            {activeTab === "menu" && (
              <div className="flex flex-col flex-1 overflow-hidden">

                {/* Profile summary with completion */}
                {isLoggedIn && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-main/10 flex items-center justify-center flex-shrink-0 border-2 border-[#9B59B6]/30">
                        {resolvedImage ? (
                          <Image src={resolvedImage} alt={resolvedName ?? "Profile"} width={56} height={56}
                            className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-lg font-bold text-primary-main">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-main truncate">{resolvedName ?? "User"}</p>
                        <p className="text-xs text-secondary">{user?.email ?? user?.phone ?? ""}</p>
                        {resolvedRole === "pandit" && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={11} className="text-yellow-500" />
                            <span className="text-xs text-yellow-600">Verified Expert</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setActiveTab("profile")}
                        className="w-8 h-8 rounded-full bg-[#F3EAF5] flex items-center justify-center flex-shrink-0">
                        <Edit2 size={13} className="text-primary-main" />
                      </button>
                    </div>

                    {/* Completion bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-[#F3EAF5] rounded-full overflow-hidden">
                        <div className="h-full bg-primary-main rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-primary-main">{percent}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {fields.filter(f => !f.done).map(f => (
                        <span key={f.label} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                          + {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto p-3">
                  {menuItems.map((item) => (
                    <button key={item.path}
                      onClick={() => { setShowSidebar(false); router.push(item.path); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F3EAF5] transition-colors group">
                      <item.icon size={18} className="text-secondary group-hover:text-primary-main" />
                      <span className="flex-1 text-left text-sm text-main group-hover:text-primary-main">{item.label}</span>
                      <ChevronRight size={14} className="text-secondary/40" />
                    </button>
                  ))}
                </nav>

                {/* Logout */}
                {isLoggedIn && (
                  <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={18} />
                      <span className="text-sm">Sign out</span>
                    </button>
                    <p className="text-center text-xs text-gray-300 mt-2">Rantraa v1.0.0</p>
                  </div>
                )}
              </div>
            )}

            {/* ── EDIT PROFILE TAB ── */}
            {activeTab === "profile" && isLoggedIn && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

                  {/* Avatar */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-main/10 flex items-center justify-center border-2 border-[#9B59B6]/30">
                      {resolvedImage ? (
                        <Image src={resolvedImage} alt="Profile" width={80} height={80}
                          className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl font-bold text-primary-main">{initials}</span>
                      )}
                    </div>
                  </div>

                  {/* Completion checklist */}
                  <div className="bg-[#F9F4FB] rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary-main">Profile {percent}% complete</span>
                    </div>
                    <div className="h-1.5 bg-[#E8D8EA] rounded-full overflow-hidden">
                      <div className="h-full bg-primary-main rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {fields.map(f => (
                        <div key={f.label} className="flex items-center gap-1">
                          {f.done
                            ? <Check size={11} className="text-green-500 flex-shrink-0" />
                            : <AlertCircle size={11} className="text-orange-400 flex-shrink-0" />}
                          <span className={`text-[11px] ${f.done ? "text-main" : "text-orange-400"}`}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fields */}
                  {[
                    { key: "username", label: "Username",    type: "text",  placeholder: "your_username" },
                    { key: "phone",    label: "Phone",       type: "tel",   placeholder: "+91 98765 43210" },
                    { key: "dob",      label: "Date of Birth", type: "date", placeholder: "" },
                    { key: "address",  label: "Address",     type: "text",  placeholder: "Your full address" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-secondary">{label}</label>
                      <input
                        type={type}
                        value={form[key]}
                        max={key === "dob" ? new Date().toISOString().split("T")[0] : undefined}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full border border-[#E0D4E3] rounded-2xl px-4 py-3 text-sm text-main bg-white focus:outline-none focus:border-[#9B59B6] transition-colors"
                      />
                    </div>
                  ))}

                  {/* Gender */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-secondary">Gender</label>
                    <div className="flex gap-2">
                      {["Male", "Female", "Other"].map(g => (
                        <button key={g} type="button"
                          onClick={() => setForm(prev => ({ ...prev, gender: g }))}
                          className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${
                            form.gender === g
                              ? "bg-primary-main text-white border-primary-main"
                              : "border-[#E0D4E3] text-secondary hover:border-[#9B59B6]"
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{saveError}</p>
                  )}
                </div>

                {/* Save button */}
                <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                  <button onClick={handleSave} disabled={saving}
                    className="w-full py-3 rounded-2xl bg-primary-main text-white text-sm font-medium disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                    ) : saveSuccess ? (
                      <><Check size={16} /> Saved!</>
                    ) : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

export default PageHeader;