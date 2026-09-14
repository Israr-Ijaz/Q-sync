"use client";

import { useState, useEffect, useRef } from "react";
import { User, Image as ImageIcon, Save, CheckCircle2, AlertCircle, X, PenTool } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn, formatDoctorName } from "@/lib/utils";

export default function DoctorSettingsPage() {
  const [fullName, setFullName] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Signature state
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [hasExistingSignature, setHasExistingSignature] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stable client ref — avoids re-running the load effect on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Load Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.full_name) {
          setFullName(profile.full_name);
        }

        // Load Doctor credentials & signature_url
        const { data: doctorRow } = await supabase
          .from("doctors")
          .select("qualifications, specialization, signature_url")
          .eq("id", user.id)
          .single();
        
        if (doctorRow) {
          setQualifications(doctorRow.qualifications ?? "");
          setSpecialization(doctorRow.specialization ?? "");
          if (doctorRow.signature_url) {
            setSignaturePreviewUrl(doctorRow.signature_url);
            setHasExistingSignature(true);
          }
        }

      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadSettings();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("File must be smaller than 2MB");
      return;
    }

    setSignatureFile(file);
    setSignaturePreviewUrl(URL.createObjectURL(file));
    setHasExistingSignature(false);
  };

  const handleRemoveSignature = () => {
    setSignatureFile(null);
    setSignaturePreviewUrl(null);
    setHasExistingSignature(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Update Profile (Name)
      const formattedName = formatDoctorName(fullName);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: formattedName })
        .eq("id", user.id);
      if (profileError) throw profileError;

      // 2. Handle Signature Upload / Deletion First
      let finalSignatureUrl = signaturePreviewUrl; // Default to existing if not changed

      if (signatureFile) {
        // Upload new file, overwrite existing if any
        const { error: uploadError } = await supabase.storage
          .from("signatures")
          .upload(`${user.id}.png`, signatureFile, {
            upsert: true,
            contentType: signatureFile.type,
          });
        if (uploadError) throw uploadError;
        
        // Get the new public URL
        const { data: signatureData } = supabase
          .storage
          .from("signatures")
          .getPublicUrl(`${user.id}.png`);
        
        finalSignatureUrl = signatureData.publicUrl;
        setHasExistingSignature(true);
        setSignatureFile(null);
      } else if (!hasExistingSignature && signaturePreviewUrl === null) {
        // User removed the signature, so delete it from storage
        await supabase.storage.from("signatures").remove([`${user.id}.png`]);
        finalSignatureUrl = null;
      }

      // 3. Upsert Doctors Table
      const { error: docError } = await supabase
        .from("doctors")
        .upsert(
          {
            id: user.id,
            qualifications: qualifications,
            specialization: specialization,
            signature_url: finalSignatureUrl,
          },
          { onConflict: 'id' }
        );
      if (docError) throw docError;

      setSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-12 pt-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">My Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your public profile and digital signature.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Section */}
        <section className="rounded-2xl border border-white/[0.07] bg-slate-900/40 p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-medium text-slate-200">Doctor Profile</h2>
              <p className="text-xs text-slate-500">How you appear to patients on prescriptions.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="fullName" className="text-xs font-medium text-slate-300">
                Full Name (with title)
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Jane Doe"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:bg-slate-800"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="qualifications" className="text-xs font-medium text-slate-300">
                Qualifications
              </label>
              <input
                id="qualifications"
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. MBBS, MD"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="specialization" className="text-xs font-medium text-slate-300">
                Specialization
              </label>
              <input
                id="specialization"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Cardiologist"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:bg-slate-800"
              />
            </div>
          </div>
        </section>

        {/* Signature Section */}
        <section className="rounded-2xl border border-white/[0.07] bg-slate-900/40 p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-medium text-slate-200">Digital Signature</h2>
              <p className="text-xs text-slate-500">Appears at the bottom of printed prescriptions.</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Upload Zone */}
            <div className="flex-1 space-y-3">
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-800/20 py-8 transition-colors hover:border-emerald-500/30 hover:bg-slate-800/40",
                  signaturePreviewUrl && "border-slate-700/30 bg-slate-800/10 hover:border-slate-700/30 hover:bg-slate-800/10"
                )}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  aria-label="Upload signature image"
                />
                <ImageIcon className="mb-2 h-6 w-6 text-slate-500" />
                <p className="text-sm font-medium text-slate-300">Click to upload signature</p>
                <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 2MB</p>
              </div>

              <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-300/90 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>If no signature is uploaded, the system will automatically generate a cursive signature using your Full Name.</p>
              </div>
            </div>

            {/* Preview Box */}
            <div className="flex w-full flex-col sm:w-[280px]">
              <span className="mb-2 text-xs font-medium text-slate-400 uppercase tracking-widest">Preview</span>
              <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-white p-4">
                {signaturePreviewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signaturePreviewUrl}
                      alt="Signature preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="absolute right-2 top-2 z-20 rounded-full bg-slate-900/60 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span
                    className="text-3xl font-bold text-slate-800 select-none"
                    style={{ fontFamily: 'var(--font-dancing-script), "Brush Script MT", cursive' }}
                  >
                    {fullName || "Dr. Signature"}
                  </span>
                )}
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-500">
                {signaturePreviewUrl ? "Uploaded Image" : "Auto-generated Cursive Fallback"}
              </p>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <div className="flex-1">
            {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
            {successMsg && (
              <p className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {successMsg}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
