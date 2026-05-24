/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Lock, 
  Bell, 
  Image as ImageIcon, 
  Globe, 
  Shield, 
  Database, 
  QrCode, 
  Copy, 
  Check, 
  Upload, 
  CloudLightning, 
  Volume2, 
  Trash2, 
  ArrowRight,
  Monitor,
  CheckCheck
} from "lucide-react";
import { UserProfile } from "../types";
import { TranslationSet } from "../languages";

interface SettingsPanelProps {
  userProfile: UserProfile;
  langSet: TranslationSet;
  activeLanguage: string;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onBackupCloud: () => void;
  onRestoreCloud: () => void;
  onSignOut: () => void;
  blockedUsersList: string[];
  onUnblockUser: (nexusId: string) => void;
}

type SettingsSection = 'profile' | 'privacy' | 'notifications' | 'media' | 'language' | 'security' | 'appearance';

export function SettingsPanel({
  userProfile,
  langSet,
  activeLanguage,
  onUpdateProfile,
  onBackupCloud,
  onRestoreCloud,
  onSignOut,
  blockedUsersList,
  onUnblockUser,
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [copiedId, setCopiedId] = useState(false);
  const [showQr, setShowQr] = useState(false);
  
  // Custom theme profiles representation
  const themePresets = [
    { id: 'light', name: 'Clean Light Slate' },
    { id: 'dark', name: 'Cosmic Slate Night' },
    { id: 'amoled', name: 'Midnight Pitch AMOLED' }
  ];

  const accentPresets = [
    { className: "bg-cyan-500", name: "Cyan Breeze", color: "cyan" },
    { className: "bg-indigo-500", name: "Royal Blue", color: "indigo" },
    { className: "bg-emerald-500", name: "Emerald Cyber", color: "emerald" },
    { className: "bg-purple-500", name: "Nebula Purple", color: "purple" }
  ];

  const handleCopyId = () => {
    navigator.clipboard.writeText(userProfile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0A0A0B] rounded-r-3xl overflow-hidden h-full select-none font-sans text-slate-100">
      
      {/* Settings Navigation Rail */}
      <div className="w-full md:w-56 bg-[#0F0F11] border-b md:border-b-0 md:border-r border-white/5 p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
        <h3 className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">
          Settings Console
        </h3>

        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'privacy', label: 'Privacy', icon: Lock },
          { id: 'appearance', label: 'Appearance', icon: ImageIcon },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'media', label: 'Media Config', icon: Database },
          { id: 'language', label: 'Language', icon: Globe },
          { id: 'security', label: 'Cloud Synchrony', icon: Shield },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingsSection)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-xs text-left w-full flex-shrink-0 ${
                isActive 
                  ? "nexus-gradient text-white shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="hidden md:block flex-1" />

        <button
          onClick={onSignOut}
          className="w-full py-2 bg-rose-950/20 text-rose-400 hover:bg-rose-900/20 text-xs font-semibold rounded-xl border border-rose-900/30 transition text-center px-4"
        >
          Sign Out Node
        </button>
      </div>

      {/* Settings Action Content Area */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 text-left"
          >
            
            {/* PROFILE SECTION */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-slate-900 pb-2">
                  <h4 className="text-base font-bold text-white">Nexus Subscriber Profile</h4>
                  <p className="text-xs text-slate-400">Manage virtual metrics and bio status handles</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-900/30 rounded-2xl border border-slate-900">
                  {userProfile.avatar ? (
                    <img 
                      src={userProfile.avatar} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#2D5CFE]/50 shadow-xl" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-2xl border border-white/5">
                      {userProfile.name.slice(0,2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Permanent Subscriber ID</p>
                      
                      <div className="flex items-center gap-3 justify-center sm:justify-start mt-1">
                        <span className="font-mono text-xl font-bold tracking-widest text-cyan-400 select-all">
                          {userProfile.id}
                        </span>
                        
                        <button
                          onClick={handleCopyId}
                          type="button"
                          className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:text-white transition text-slate-400"
                          title="Copy Virtual ID"
                        >
                          {copiedId ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => setShowQr(!showQr)}
                          type="button"
                          className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:text-white transition text-slate-400"
                          title="Show QR profile identity"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center sm:justify-start items-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              onUpdateProfile({ avatar: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                        id="settings-avatar-upload"
                      />
                      <label 
                        htmlFor="settings-avatar-upload"
                        className="py-1 px-3 bg-[#2D5CFE] text-[10px] text-white rounded font-bold transition hover:bg-blue-600 cursor-pointer flex items-center shadow-lg shadow-blue-950/20"
                      >
                        Upload Local DP
                      </label>

                      {userProfile.avatar && (
                        <button
                          onClick={() => onUpdateProfile({ avatar: "" })}
                          className="py-1 px-2.5 bg-slate-800 text-[10px] text-slate-300 rounded font-semibold transition hover:bg-slate-750"
                        >
                          Reset Avatar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Display Card simulation */}
                {showQr && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-4 bg-white rounded-3xl w-48 text-center mx-auto space-y-2.5 shadow-2xl border-4 border-indigo-500"
                  >
                    <div className="w-full h-36 bg-slate-100 rounded-2xl flex items-center justify-center p-2">
                      <QrCode className="w-28 h-28 text-slate-950" />
                    </div>
                    <span className="font-mono text-xs text-slate-900 font-bold tracking-widest">{userProfile.id}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Display alias
                    </label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => onUpdateProfile({ name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500/80"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Profile biography status
                    </label>
                    <input
                      type="text"
                      value={userProfile.bio}
                      onChange={(e) => onUpdateProfile({ bio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500/80"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY SECTION */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-slate-900 pb-2">
                  <h4 className="text-base font-bold text-white">Operational privacy settings</h4>
                  <p className="text-xs text-slate-400">Configure visual status and read verification feeds</p>
                </div>

                <div className="space-y-4">
                  {/* Last Seen visibility */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-900">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Broadcast Last Seen</h5>
                      <p className="text-[10px] text-slate-400">Choose who can access your timing indicators</p>
                    </div>

                    <select
                      value={userProfile.lastSeenSetting}
                      onChange={(e: any) => onUpdateProfile({ lastSeenSetting: e.target.value })}
                      className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs p-1 px-2.5 focus:outline-none"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  {/* Online status visibility */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-900">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Broadcast Live Connection Badge</h5>
                      <p className="text-[10px] text-slate-400">Display online tick status inside chatting lists</p>
                    </div>

                    <select
                      value={userProfile.onlineSetting}
                      onChange={(e: any) => onUpdateProfile({ onlineSetting: e.target.value })}
                      className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs p-1 px-2.5 focus:outline-none"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  {/* Profile DP Privacy */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-900">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Profile Photo Display</h5>
                      <p className="text-[10px] text-slate-400">Option to mask avatar to strange virtual IDs</p>
                    </div>

                    <select
                      value={userProfile.dpSetting}
                      onChange={(e: any) => onUpdateProfile({ dpSetting: e.target.value })}
                      className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs p-1 px-2.5 focus:outline-none"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  {/* Typing Broadcast Toggle */}
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Interactive Typing indicators</h5>
                      <p className="text-[10px] text-slate-400">Broadcast dynamic "... typing" in dialogue views</p>
                    </div>

                    <input
                      type="checkbox"
                      checked={userProfile.typingIndicator}
                      onChange={(e) => onUpdateProfile({ typingIndicator: e.target.checked })}
                      className="rounded bg-zinc-900 border-white/5 text-[#2D5CFE] focus:ring-0 focus:ring-offset-0"
                    />
                  </div>

                  {/* Read receipts */}
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <div>
                      <h5 className="text-xs font-semibold text-white">{langSet.readReceiptsLabel}</h5>
                      <p className="text-[10px] text-slate-400">If disabled, double gray ticks never turn royal blue</p>
                    </div>

                    <input
                      type="checkbox"
                      checked={userProfile.readReceipts}
                      onChange={(e) => onUpdateProfile({ readReceipts: e.target.checked })}
                      className="rounded bg-zinc-900 border-white/5 text-[#2D5CFE] focus:ring-0 focus:ring-offset-0"
                    />
                  </div>
                </div>

                {/* BLOCK LIST MANAGEMENT */}
                <div className="pt-4 space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{langSet.blockedUsersLabel}</h5>
                  
                  {blockedUsersList.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-500">Your block listing index is empty.</p>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsersList.map((blockedId) => (
                        <div key={blockedId} className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-850">
                          <span className="font-mono text-xs text-white tracking-widest">{blockedId}</span>
                          <button
                            onClick={() => onUnblockUser(blockedId)}
                            className="py-1 px-2.5 bg-rose-950/20 text-rose-400 border border-rose-900/35 rounded text-[10px] uppercase font-bold hover:bg-rose-900/25 transition"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* APPEARANCE SECTION */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-base font-bold text-white">Appearance and styling</h4>
                  <p className="text-xs text-slate-400">Choose custom themes and element colors and wallpapers</p>
                </div>

                <div className="space-y-4">
                  {/* Theme Select */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      {langSet.themeLabel}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {themePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => onUpdateProfile({ theme: preset.id as any })}
                          className={`p-3.5 rounded-xl border text-xs font-semibold text-center transition ${
                            userProfile.theme === preset.id
                              ? "nexus-gradient text-white border-transparent shadow-lg"
                              : "bg-zinc-900 border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Select */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      {langSet.accentColorLabel}
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">Notice: Under the Sleek Interface theme, elements are standardized to royal blue.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {accentPresets.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => onUpdateProfile({ accentColor: preset.color })}
                          className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2.5 text-left transition ${
                            userProfile.accentColor === preset.color
                              ? "bg-zinc-900 border-[#2D5CFE] text-white font-bold"
                              : "bg-zinc-900/40 border-white/5 text-slate-400"
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${preset.className}`} />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-base font-bold text-white">Audible alerts feeds</h4>
                  <p className="text-xs text-slate-400">Modify tone behaviors and system haptics</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <div>
                      <h5 className="text-xs font-semibold text-white">New Message Ringtone Tones</h5>
                      <p className="text-[10px] text-slate-400">Play rapid digital notification trigger pulse</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded bg-zinc-900 border-white/5 text-[#2D5CFE] focus:ring-0 focus:ring-offset-0" />
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Device Vibration Feedback</h5>
                      <p className="text-[10px] text-slate-400">Trigger standard physical motor rumble alert</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded bg-zinc-900 border-white/5 text-[#2D5CFE] focus:ring-0 focus:ring-offset-0" />
                  </div>
                </div>
              </div>
            )}

            {/* MEDIA SECTION */}
            {activeSection === 'media' && (
              <div className="space-y-6">
                <div className="border-b border-slate-900 pb-2">
                  <h4 className="text-base font-bold text-white">{langSet.uploadQualityLabel}</h4>
                  <p className="text-xs text-slate-400">Manage compression profiles and offline caching</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Media Upload quality</h5>
                      <p className="text-[10px] text-slate-400">Upload profile resolution compression metric</p>
                    </div>

                    <select
                      value={userProfile.uploadQuality}
                      onChange={(e: any) => onUpdateProfile({ uploadQuality: e.target.value })}
                      className="bg-zinc-900 border border-white/5 text-slate-300 rounded-lg text-xs p-1 px-2.5 focus:outline-none"
                    >
                      <option value="hd">High Definition HD (Uncompressed)</option>
                      <option value="standard">Standard Balanced</option>
                      <option value="low">Data Saver Low quality</option>
                    </select>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Automated Download Limits</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2 bg-[#0F0F11] rounded-lg">
                        <span>Photos / Stickers</span>
                        <span className="text-[#2D5CFE] font-bold uppercase text-[10px]">Wi-Fi & Mobile</span>
                      </div>
                      <div className="flex justify-between p-2 bg-[#0F0F11] rounded-lg">
                        <span>Large Videos</span>
                        <span className="text-amber-500 font-bold uppercase text-[10px]">Wi-Fi Only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LANGUAGE SECTION */}
            {activeSection === 'language' && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-base font-bold text-white">{langSet.languageLabel}</h4>
                  <p className="text-xs text-slate-400">Switch worldwide interface vocabularies instantly</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { id: 'en', label: 'English', sub: 'Native layout' },
                    { id: 'ur', label: 'اردو', sub: 'Urdu language' },
                    { id: 'es', label: 'Español', sub: 'Spanish vocabulary' },
                    { id: 'fr', label: 'Français', sub: 'French translationset' },
                    { id: 'hi', label: 'हिन्दी', sub: 'Hindi configuration' },
                    { id: 'tr', label: 'Türkçe', sub: 'Turkish layout' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => onUpdateProfile({ language: lang.id })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition h-20 ${
                        activeLanguage === lang.id
                          ? "bg-zinc-900 border-[#2D5CFE] text-white"
                          : "bg-zinc-900/40 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-sm font-bold">{lang.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{lang.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY & CLOUD BACKUP SECTION */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-base font-bold text-white">Quantum Satellite Synchrony (E2E)</h4>
                  <p className="text-xs text-slate-400">Save settings, contacts and histories for secure cloud recoveries</p>
                </div>

                <div className="p-4 bg-zinc-900/20 border border-white/5 rounded-2xl flex items-start gap-4">
                  <CloudLightning className="w-8 h-8 text-[#2D5CFE] flex-shrink-0 animate-pulse" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Cloud Backup Protection Enabled</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      Nexus utilizes client-side encrypted backups. Your messages are hashed with your Password hash before syncing. Only you can restore your chat history.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={onBackupCloud}
                    type="button"
                    className="p-4 bg-[#0F0F11] hover:bg-zinc-800 rounded-2xl border border-white/5 text-left transition relative overflow-hidden group"
                  >
                    <div className="absolute right-4 top-4 text-[#2D5CFE] group-hover:scale-125 transition">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <h6 className="text-xs font-bold text-white">Force Synchronize NOW</h6>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[150px]">Backup contacts, themes, and chat logs</p>
                  </button>

                  <button
                    onClick={onRestoreCloud}
                    type="button"
                    className="p-4 bg-[#0F0F11] hover:bg-zinc-800 rounded-2xl border border-white/5 text-left transition relative overflow-hidden group"
                  >
                    <div className="absolute right-4 top-4 text-indigo-500 group-hover:scale-125 transition">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <h6 className="text-xs font-bold text-white">{langSet.recoverBtn}</h6>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[150px]">Restore dialogue files from satellite cloud</p>
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
