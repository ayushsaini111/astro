"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Settings, CreditCard, Calendar, Phone, Mail,
  CheckCircle, AlertCircle, Edit2, X, Check, Loader2
} from "lucide-react";

function calcCompletion(user) {
  const fields = [
    { label: "Username",    done: !!user.username },
    { label: "Date of birth", done: !!user.dob },
    { label: "Phone",       done: !!user.phone },
    { label: "Email",       done: !!user.email },
    { label: "Gender",      done: !!user.gender },
    { label: "Address",     done: !!user.address },
  ];
  const completed = fields.filter(f => f.done).length;
  return { fields, percent: Math.round((completed / fields.length) * 100) };
}

export default function ProfileClient({ user: initialUser }) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    username: user.username ?? "",
    phone:    user.phone    ?? "",
    email:    user.email    ?? "",
    dob:      user.dob ? user.dob.slice(0, 10) : "",
    gender:   user.gender   ?? "",
    address:  user.address  ?? "",
  });

  const { fields, percent } = calcCompletion(user);
  const displayName = user.username ?? "User";
  const initial = displayName[0].toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    month: "long", year: "numeric",
  });

  function handleEdit() {
    setForm({
      username: user.username ?? "",
      phone:    user.phone    ?? "",
      email:    user.email    ?? "",
      dob:      user.dob ? user.dob.slice(0, 10) : "",
      gender:   user.gender   ?? "",
      address:  user.address  ?? "",
    });
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { 
        setSaveError(data.error ?? "Failed to save"); 
        return; 
      }

      // Update local state immediately
      setUser(prev => ({
        ...prev,
        username: form.username || prev.username,
        phone:    form.phone    || prev.phone,
        email:    form.email    || prev.email,
        dob:      form.dob ? new Date(form.dob).toISOString() : prev.dob,
        gender:   form.gender   || prev.gender,
        address:  form.address  || prev.address,
      }));

      await updateSession();
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setEditing(false); }, 1200);
    } catch {
      setSaveError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-s40">
      <div className="max-w-2xl mx-auto px-s16 pt-s32 flex flex-col gap-s24">

        {/* Profile card */}
        <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-black/5">
          <div className="h-24 bg-gradient-to-r from-[#9B59B6] to-[#C39BD3]" />
          <div className="px-s24 pb-s24">
            <div className="flex items-end justify-between -mt-10 mb-s16">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-[#F3EAF5] flex items-center justify-center shadow-md">
                  {user.profilePic ? (
                    <Image src={user.profilePic} alt={displayName} width={80} height={80}
                      className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl font-bold text-primary-main">{initial}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-main flex items-center justify-center shadow">
                  <span className="text-[9px] font-bold text-white">{percent}%</span>
                </div>
              </div>

              <button
                onClick={editing ? () => setEditing(false) : handleEdit}
                className="flex items-center gap-2 px-s16 py-s8 rounded-full border border-black/10 text-sm text-secondary hover:bg-black/5 transition-colors"
              >
                {editing ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit profile</>}
              </button>
            </div>

            <h2 className="heading-h4 text-main">{displayName}</h2>
            <p className="body-small text-secondary">Member since {memberSince}</p>
          </div>
        </div>

        {/* ── EDIT FORM ── */}
        {editing && (
          <div className="bg-white rounded-[20px] p-s24 shadow-sm border border-[#C39BD3]/40 flex flex-col gap-s16">
            <h3 className="body-default font-semibold text-main">Edit Profile</h3>

            {/* Completion */}
            <div className="bg-[#F9F4FB] rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary-main">Profile {percent}% complete</span>
              </div>
              <div className="h-1.5 bg-[#E8D8EA] rounded-full overflow-hidden">
                <div className="h-full bg-primary-main rounded-full transition-all" style={{ width: `${percent}%` }} />
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

            {/* ✅ Text fields - ADDED EMAIL FIELD */}
            {[
              { key: "username", label: "Username",     type: "text",  placeholder: "your_username" },
              { key: "email",    label: "Email",        type: "email", placeholder: "your@email.com" },
              { key: "phone",    label: "Phone",        type: "tel",   placeholder: "+91 98765 43210" },
              { key: "dob",      label: "Date of Birth",type: "date",  placeholder: "" },
              { key: "address",  label: "Address",      type: "text",  placeholder: "Your full address" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-s4">
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
            <div className="flex flex-col gap-s4">
              <label className="text-xs font-medium text-secondary">Gender</label>
              <div className="flex gap-s8">
                {["Male", "Female", "Other"].map(g => (
                  <button key={g} type="button"
                    onClick={() => setForm(prev => ({ ...prev, gender: g }))}
                    className={`flex-1 py-3 rounded-2xl text-sm font-medium border transition-colors ${
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

            <button onClick={handleSave} disabled={saving}
              className="w-full py-s16 rounded-2xl bg-primary-main text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving…</>
              ) : saveSuccess ? (
                <><Check size={16} /> Saved!</>
              ) : "Save Changes"}
            </button>
          </div>
        )}

        {/* Profile completion checklist */}
        {!editing && (
          <div className="bg-white rounded-[20px] p-s24 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-s16">
              <h3 className="body-default font-semibold text-main">Profile Completion</h3>
              <span className="text-sm font-bold text-primary-main">{percent}%</span>
            </div>
            <div className="h-2 bg-[#F3EAF5] rounded-full overflow-hidden mb-s16">
              <div className="h-full bg-primary-main rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex flex-col gap-s8">
              {fields.map(f => (
                <div key={f.label} className="flex items-center gap-s16">
                  {f.done
                    ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    : <AlertCircle size={16} className="text-orange-400 flex-shrink-0" />}
                  <span className={`body-small ${f.done ? "text-main" : "text-secondary"}`}>
                    {f.label}
                    {!f.done && <span className="text-orange-400 ml-1">— missing</span>}
                  </span>
                </div>
              ))}
            </div>
            {percent < 100 && (
              <button onClick={handleEdit}
                className="mt-s16 w-full py-s8 rounded-r16 bg-primary-main text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Complete your profile →
              </button>
            )}
          </div>
        )}

        {/* Account Info */}
        {!editing && (
          <div className="bg-white rounded-[20px] p-s24 shadow-sm border border-black/5 flex flex-col gap-s16">
            <h3 className="body-default font-semibold text-main">Account Info</h3>
            {[
              { icon: Mail,     label: "Email",   value: user.email  ?? "Not added" },
              { icon: Phone,    label: "Phone",   value: user.phone  ?? "Not added" },
              { icon: Calendar, label: "DOB",     value: user.dob
                  ? new Date(user.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                  : "Not added" },
              { icon: Settings, label: "Gender",  value: user.gender  ?? "Not added" },
              { icon: Settings, label: "Address", value: user.address ?? "Not added" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-s16">
                <div className="w-9 h-9 rounded-full bg-[#F3EAF5] flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary-main" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-secondary">{label}</p>
                  <p className="body-small text-main truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet & Plan */}
        <div className="grid grid-cols-2 gap-s16">
          <div className="bg-white rounded-[20px] p-s24 shadow-sm border border-black/5">
            <p className="text-xs text-secondary mb-s4">Wallet Balance</p>
            <p className="heading-h4 text-main">₹{user.wallet?.balance?.toFixed(2) ?? "0.00"}</p>
            <button onClick={() => router.push("/plans")} className="mt-s8 text-xs text-primary-main underline">
              Add funds
            </button>
          </div>
          <div className="bg-white rounded-[20px] p-s24 shadow-sm border border-black/5">
            <p className="text-xs text-secondary mb-s4">Active Plan</p>
            {user.activePlan ? (
              <>
                <p className="body-default font-semibold text-main">{user.activePlan.name}</p>
                <p className="text-xs text-secondary mt-s4">
                  {Math.floor(user.activePlan.remainingSeconds / 60)} min left
                </p>
              </>
            ) : (
              <>
                <p className="body-small text-secondary">No active plan</p>
                <button onClick={() => router.push("/plans")} className="mt-s8 text-xs text-primary-main underline">
                  View plans
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-[20px] p-s24 shadow-sm border border-black/5 flex flex-col gap-s4">
          {[
            { icon: CreditCard, label: "Plans & Wallet", path: "/plans" },
          ].map(({ icon: Icon, label, path }) => (
            <button key={path} onClick={() => router.push(path)}
              className="flex items-center gap-s16 p-s16 rounded-r16 hover:bg-[#F3EAF5] transition-colors group text-left">
              <Icon size={18} className="text-secondary group-hover:text-primary-main" />
              <span className="body-small text-main group-hover:text-primary-main">{label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}