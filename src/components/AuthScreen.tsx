/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  KeyRound, 
  User, 
  Info, 
  Eye, 
  EyeOff, 
  FileText, 
  ArrowRight, 
  Lock, 
  Copy, 
  Check, 
  ShieldAlert, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { TranslationSet } from "../languages";

interface AuthScreenProps {
  onAuthSuccess: (userProfile: any, tokenMessage?: string) => void;
  langSet: TranslationSet;
}

// No default preset URLs are loaded to ensure only local or initials-based avatars are used.
export function AuthScreen({ onAuthSuccess, langSet }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [customAvatar, setCustomAvatar] = useState("");
  const [nexusIdInput, setNexusIdInput] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // New Generation Popup state
  const [generatedId, setGeneratedId] = useState("");
  const [assignedProfile, setAssignedProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // File Upload Helper to convert local image files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setCustomAvatar("Uploaded Native File");
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please provide a valid display name.");
      return;
    }
    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, bio: bio || "Using Nexus Messenger.", avatar }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Register session failed.");
      } else {
        // Successful register - trigger generated popup
        setGeneratedId(data.nexusId);
        setAssignedProfile(data.profile);
      }
    } catch (err: any) {
      setErrorMsg("Network error contacting full-stack authentication module.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nexusIdInput.trim() || !password) {
      setErrorMsg("Nexus ID and password are required.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nexusId: nexusIdInput.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Authentication verification failed.");
      } else {
        // Local Save
        if (rememberMe) {
          localStorage.setItem("NEXUS_SAVED_ID", data.nexusId);
          localStorage.setItem("NEXUS_SAVED_PW", password);
        }
        
        // Trigger recovery restore implicitly or let parent container handle it
        onAuthSuccess(data.profile);
      }
    } catch (err) {
      setErrorMsg("Service link down. Syncing with localized credentials cache instead...");
      // Mock validation bypass for offline simulation
      if (nexusIdInput.startsWith("+0") && password.length >= 4) {
        const mockProfile = {
          id: nexusIdInput,
          name: "Virtual User " + nexusIdInput.substring(4),
          bio: "Hey there! Custom offline restored node active.",
          avatar: "",
          registeredAt: new Date().toISOString()
        };
        onAuthSuccess(mockProfile);
      } else {
        setErrorMsg("Failed to backup log login offline. Enter ID starting with +0 (e.g. +076429); password >= 4.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 select-none">
      
      {/* Background visual graphics */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-indigo-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-cyan-600 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isRegister ? langSet.registerTitle : langSet.loginTitle}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
            {isRegister ? langSet.registerSubtitle : langSet.loginSubtitle}
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono select-text"
          >
            {errorMsg}
          </motion.div>
        )}

        <form onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
          
          {/* REGISTER VIEW ADDITIONAL FIELDS */}
          {isRegister && (
            <div className="space-y-4 py-1">
              {/* Profile image selection & Custom Native drop logic */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {langSet.avatarLabel}
                </label>
                <div className="flex items-center gap-4">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Current selection" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#2D5CFE]" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-xl border border-white/5">
                      {name ? name.slice(0, 2).toUpperCase() : "?"}
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Only local image files are used. Upload an image, or leave blank to display dynamic initials.
                    </p>

                    {/* Local upload fallback */}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                        id="user-avatar-upload"
                      />
                      <label 
                        htmlFor="user-avatar-upload"
                        className="py-1.5 px-3 bg-[#2D5CFE] hover:bg-blue-600 transition text-white rounded-lg text-[10px] font-semibold tracking-wide cursor-pointer inline-flex items-center gap-1.5 shadow-lg shadow-blue-950/20"
                      >
                        <RefreshCw className="w-3 h-3 text-white" />
                        {customAvatar ? customAvatar : "UPLOAD NATIVE IMAGE"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Name input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {langSet.nameLabel}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Green"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Bio status string */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between block mb-1">
                  <span>{langSet.bioLabel}</span>
                  <span className="text-slate-500 font-mono text-[9px]">{bio.length}/80</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    maxLength={80}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Design is more than what it looks like..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:outline-none transition text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LOGIN VIEW SPECIFIC FIELD: Nexus ID */}
          {!isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {langSet.nexusIdLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-mono text-[11px] font-semibold">
                  +0
                </span>
                <input
                  type="text"
                  required
                  placeholder="764294"
                  value={nexusIdInput.replace("+0", "")}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, "");
                    setNexusIdInput(cleaned ? `+0${cleaned}` : "");
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:outline-none transition font-mono text-sm tracking-wider"
                />
              </div>
            </div>
          )}

          {/* SHARED FIELD: PASSWORD WITH TOGGLE */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {langSet.passwordLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                Remember me
              </label>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-500 transition text-sm font-semibold tracking-wider text-white shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? langSet.registerBtn : langSet.loginBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Warning and Swap section */}
        <div className="mt-6 border-t border-slate-800/65 pt-4 text-center">
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {isRegister ? langSet.alreadyRegistered : langSet.notRegisteredYet}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
            }}
            className="text-xs text-cyan-400 hover:text-cyan-350 font-semibold underline underline-offset-4 focus:outline-none"
          >
            {isRegister ? "Switch to Session Login" : "Claim a Free Virtual Nexus ID"}
          </button>
        </div>

        {/* Backup recovery information info note */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-2">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-400 leading-relaxed text-left">
            {langSet.backupWarning}
          </p>
        </div>
      </div>

      {/* POPUP: ASSIGNED UNIQUE NEXUS ID MODAL WARNING (CRITICAL REQUIREMENT) */}
      <AnimatePresence>
        {generatedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-300/10 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-lg font-bold text-white">{langSet.saveIdTitle}</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                {langSet.saveIdDesc}
              </p>

              {/* Big Nexus Symbol Block */}
              <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 relative flex items-center justify-center gap-3 shadow-inner">
                <span className="font-mono text-2xl font-bold tracking-widest text-cyan-400 select-all">
                  {generatedId}
                </span>
                
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Copy className="w-4.5 h-4.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/15 mb-6 text-left">
                <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-[10px] text-indigo-200 leading-tight">
                  Restore warning: Nexus Messenger does not require SIM, email or phone details. Always serialize this combination (+0... + password) carefully to prevent data losses!
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (rememberMe) {
                    localStorage.setItem("NEXUS_SAVED_ID", generatedId);
                    localStorage.setItem("NEXUS_SAVED_PW", password);
                  }
                  onAuthSuccess(assignedProfile, "Registered successfully! Token logged.");
                  setGeneratedId("");
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-semibold tracking-wide text-xs text-white shadow-lg transition"
              >
                {langSet.savedBtn}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
