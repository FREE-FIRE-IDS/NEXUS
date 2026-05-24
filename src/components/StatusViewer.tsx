/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  Send, 
  Heart, 
  ThumbsUp, 
  Laugh, 
  VolumeX, 
  Volume2, 
  SmilePlus, 
  Archive 
} from "lucide-react";
import { StatusUpdate } from "../types";

interface StatusViewerProps {
  status: StatusUpdate;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentUserId: string;
  currentUserName: string;
  onStatusReply?: (statusUserId: string, replyText: string) => void;
  onMuteUser?: (statusUserId: string) => void;
}

const statusEmojiReactions = ["🔥", "❤️", "👍", "😂", "😮", "😢", "🙌"];

export function StatusViewer({ 
  status, 
  onClose, 
  onNext, 
  onPrev, 
  currentUserId,
  currentUserName,
  onStatusReply, 
  onMuteUser 
}: StatusViewerProps) {
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [showViewerList, setShowViewerList] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionsList, setReactionsList] = useState<string[]>([]);

  // Simulation of viewing user log
  useEffect(() => {
    // Add current user anonymously to status view array dynamically if not present
    const hasViewed = status.views.some(v => v.userId === currentUserId);
    if (!hasViewed) {
      status.views.push({
        userId: currentUserId,
        userName: currentUserName,
        timestamp: new Date().toISOString()
      });
    }
  }, [status, currentUserId, currentUserName]);

  // Story advancement timer (ticks up every 100ms for continuous progress bar)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 1.5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, status.id]);

  // Handle action when progress reaches 100
  useEffect(() => {
    if (progress >= 100) {
      if (onNext) {
        onNext();
      } else {
        onClose();
      }
    }
  }, [progress, onNext, onClose]);

  // Reset progress bar value on story change
  useEffect(() => {
    setProgress(0);
  }, [status.id]);

  const handleSendReaction = (emoji: string) => {
    setReactionsList(prev => [...prev, emoji]);
    // Save live viewer reaction onto the actual mock status structure
    const viewerEntry = status.views.find(v => v.userId === currentUserId);
    if (viewerEntry) {
      viewerEntry.reaction = emoji;
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    if (onStatusReply) {
      onStatusReply(status.userId, `Replied to status: "${replyText}"`);
    }
    
    setReplyText("");
    // Pulse notification toast
    setProgress(100); // skip to close out
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between items-center font-sans text-slate-100 select-none">
        
        {/* Background Visual Render card depending on status type */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          {status.type === 'text' ? (
            <div className={`w-full h-full ${status.textBg || "bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-800"} flex flex-col justify-center items-center p-8 text-center`}>
              <p className="text-2xl sm:text-3xl font-bold max-w-lg leading-relaxed text-shadow-md select-text">
                {status.content}
              </p>
            </div>
          ) : status.type === 'video' ? (
            <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
              <video 
                src={status.mediaUrl} 
                autoPlay 
                muted 
                loop 
                playsInline
                className="max-h-full max-w-full object-contain"
              />
              
              {status.content && (
                <div className="absolute bottom-24 inset-x-0 bg-black/65 backdrop-blur-md p-4 text-center text-sm border-t border-slate-900 leading-normal select-text select-none">
                  {status.content}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
              <img 
                src={status.mediaUrl} 
                alt="Status content" 
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
              
              {status.content && (
                <div className="absolute bottom-24 inset-x-0 bg-black/65 backdrop-blur-md p-4 text-center text-sm border-t border-slate-900 leading-normal select-text">
                  {status.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top bar controls & story indicator progresses (analogous to Instagram / WhatsApp) */}
        <div className="relative z-10 w-full p-4 bg-gradient-to-b from-black/80 to-transparent flex flex-col gap-3">
          
          {/* Progress Segment bar */}
          <div className="w-full flex gap-1.5 px-1 py-1">
            <div className="flex-1 bg-slate-800/80 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            {/* User details */}
            <div className="flex items-center gap-3">
              {status.userAvatar ? (
                <img src={status.userAvatar} className="w-10 h-10 rounded-full object-cover border border-[#2D5CFE]/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-xs border border-white/5">
                  {status.userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white">{status.userName}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {new Date(status.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Quick Controllers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-slate-300 transition text-xs font-mono"
              >
                {isPaused ? "RESUME" : "PAUSE"}
              </button>

              {onMuteUser && (
                <button
                  onClick={() => {
                    onMuteUser(status.userId);
                    onClose();
                  }}
                  className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-rose-400 hover:text-rose-300 transition"
                  title="Mute status updates from this account"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating live flying reaction emojis on screen */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {reactionsList.map((emoji, index) => (
            <motion.div
              key={index}
              initial={{ y: 200, scale: 0.5, opacity: 1 }}
              animate={{ y: -450, scale: [1.2, 2.2, 1], opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute text-5xl select-none"
              style={{ 
                left: `${30 + (index * 12) % 45}%`, 
                textShadow: "0 10px 20px rgba(0,0,0,0.5)" 
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Next/Prev Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 w-14 flex items-center justify-center bg-gradient-to-r from-black/20 to-transparent cursor-pointer" onClick={onPrev}>
          <ChevronLeft className="w-6 h-6 text-slate-400 hover:text-white transition" />
        </div>
        <div className="absolute inset-y-0 right-0 w-14 flex items-center justify-center bg-gradient-to-l from-black/20 to-transparent cursor-pointer" onClick={onNext}>
          <ChevronRight className="w-6 h-6 text-slate-400 hover:text-white transition" />
        </div>

        {/* Dynamic bottom panel: View count trigger OR status reply input bar */}
        <div className="relative z-10 w-full p-4 bg-gradient-to-t from-black/95 to-transparent flex flex-col items-center">
          
          {/* Reaction picker widget */}
          <div className="flex gap-2.5 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/60 mb-3.5 shadow-lg">
            {statusEmojiReactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="hover:scale-135 active:scale-95 transition text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Current user's OWN status display -> can view list of viewers! */}
          {status.userId === currentUserId ? (
            <div className="w-full max-w-sm flex flex-col items-center">
              <button
                onClick={() => setShowViewerList(!showViewerList)}
                className="py-1 px-4 bg-slate-900 hover:bg-slate-850 rounded-full text-xs text-slate-300 flex items-center gap-1.5 transition border border-slate-800"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{status.views.length} Views</span>
              </button>

              <AnimatePresence>
                {showViewerList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full mt-2 bg-slate-950 border border-slate-900 rounded-2xl p-2.5 max-h-32 overflow-y-auto"
                  >
                    {status.views.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center font-mono">No feedback logged yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {status.views.map((viewer, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-900 last:border-0 px-1">
                            <span className="text-white font-medium">{viewer.userName}</span>
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px]">
                              {viewer.reaction && <span className="text-xs">{viewer.reaction}</span>}
                              <span>{new Date(viewer.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // OTHER USER STATUSES: Reply form box
            <form onSubmit={handleReplySubmit} className="w-full max-w-md flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to status..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-500 text-white focus:outline-none text-xs"
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white transition flex items-center justify-center shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </AnimatePresence>
  );
}
