/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Mic, 
  Send, 
  Check, 
  CheckCheck, 
  Trash2, 
  Reply, 
  Copy, 
  Star, 
  Eye, 
  Download, 
  CornerUpLeft, 
  CornerUpRight, 
  Search, 
  Lock, 
  Unlock, 
  SmilePlus, 
  Image as ImageIcon, 
  FileText, 
  BarChart2, 
  MapPin, 
  Sparkles, 
  FileBox,
  Share,
  X,
  Volume2,
  BellOff,
  Archive
} from "lucide-react";
import { Message, Chat, PollOption } from "../types";
import { TranslationSet } from "../languages";

interface ChatPanelProps {
  chat: Chat;
  messages: Message[];
  currentUserId: string;
  langSet: TranslationSet;
  typingIndicator: boolean;
  uploadQuality: 'hd' | 'standard' | 'low';
  readReceipts: boolean;
  onSendMessage: (content: string, type?: Message['type'], mediaUrl?: string, additional?: any) => void;
  onDeleteMessage: (messageId: string, forEveryone: boolean) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onToggleStarMessage: (messageId: string) => void;
  onClearChat: () => void;
  onMuteChat: () => void;
  onLockChat: () => void;
  onArchiveChat: () => void;
  onPlaceCall: (type: 'voice' | 'video') => void;
  onDeleteContact?: (chatId: string) => void;
}

// Preset assets for media simulations
const sampleGifs = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ZkbHl1aGhyNGZsdGg0MW53NXYwMTJ2Nm84cmFrNTlzNDVtd2RxaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3NtY188QaxDdC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpjbzV5MGQ5enZ4ZjZ1dzZ2eThqNHFqanY4NXZydTZobDhpcm16YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13CoXDiaCcCStG/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2FwMHU1NjBscDgwZmdodXFpbmVrb3U0b2Zhd3o2cjR6M2tqYzVyNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9Fr6r9p26j8Z2/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm5vczVxN2t6NXpwbzhhd3B5NHVub3YxMmQ5ZWt3MDhmbDZ5ejFrMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CuMiNoTRzc2kw/giphy.gif"
];

const sampleStickers = ["🛸", "🤖", "🪐", "🦄", "⚡", "👾", "✨", "🔥", "🦄", "🐱", "🚀", "🍕"];

export function ChatPanel({
  chat,
  messages,
  currentUserId,
  langSet,
  typingIndicator,
  uploadQuality,
  readReceipts,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onToggleStarMessage,
  onClearChat,
  onMuteChat,
  onLockChat,
  onArchiveChat,
  onPlaceCall,
  onDeleteContact,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Drawer Toggles
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGifs, setShowGifs] = useState(false);

  // Poll Creator states
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsInput, setPollOptionsInput] = useState("");

  // Edit states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Reply message tracking state
  const [replyMessageRef, setReplyMessageRef] = useState<Message | null>(null);

  // Voice recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSecs, setVoiceSecs] = useState(0);
  const voiceTimerRef = useRef<any>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat.typing]);

  // Handle local voice recording timer ticks
  useEffect(() => {
    if (isRecordingVoice) {
      voiceTimerRef.current = setInterval(() => {
        setVoiceSecs(p => p + 1);
      }, 1000);
    } else {
      clearInterval(voiceTimerRef.current);
      setVoiceSecs(0);
    }
    return () => clearInterval(voiceTimerRef.current);
  }, [isRecordingVoice]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(
      inputText, 
      'text', 
      undefined, 
      replyMessageRef ? { replyTo: { id: replyMessageRef.id, senderName: replyMessageRef.senderName, content: replyMessageRef.content, type: replyMessageRef.type } } : null
    );
    
    setInputText("");
    setReplyMessageRef(null);
    setShowEmojiPicker(false);
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    // Locate the active message and append/retract the voice of current user ID
    const msg = messages.find(m => m.id === messageId);
    if (msg && msg.poll) {
      msg.poll.options = msg.poll.options.map((opt: PollOption) => {
        let currentVotes = [...opt.votes];
        if (currentVotes.includes(currentUserId)) {
          currentVotes = currentVotes.filter(v => v !== currentUserId);
        } else {
          // If poll enforces single vote per option, restrict
          currentVotes.push(currentUserId);
        }
        return { ...opt, votes: currentVotes };
      });
      // trigger state force renders
      onSendMessage(`Voted in poll: "${msg.poll.question}"`, 'text', undefined, { silentNotifyOnly: true });
    }
  };

  const handleDeployPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || !pollOptionsInput.trim()) return;

    const optList = pollOptionsInput.split(",")
      .map((txt, idx) => ({ id: `opt-${idx}-${Date.now()}`, text: txt.trim(), votes: [] }))
      .filter(o => o.text.length > 0);

    const pollData = {
      question: pollQuestion,
      options: optList,
      allowMultiple: true
    };

    onSendMessage(pollQuestion, 'poll', undefined, { poll: pollData });
    
    setPollQuestion("");
    setPollOptionsInput("");
    setShowPollCreator(false);
  };

  const handleMockAttachmentSubmit = (type: Message['type'], label: string, url: string) => {
    onSendMessage(label, type, url);
    setShowAttachMenu(false);
  };

  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
  };

  const cancelVoiceRecording = () => {
    setIsRecordingVoice(false);
  };

  const finishVoiceRecording = () => {
    if (!isRecordingVoice) return;
    setIsRecordingVoice(false);
    // Send a beautiful simulated high quality voice message
    onSendMessage("Voice Recording", 'audio', "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", { duration: voiceSecs || 4 });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportChatLogs = () => {
    const rawData = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderName}: ${m.content}`).join("\n");
    const blob = new Blob([rawData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Nexus_Chat_Log_${chat.participantId}.txt`;
    a.click();
    setShowMenu(false);
  };

  // Filtering messages in search drawer
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0B] border-l border-white/5 rounded-r-3xl h-full overflow-hidden relative select-none font-sans">
      
      {/* Dynamic Header */}
      <div className="h-20 px-6 bg-[#0F0F11] border-b border-white/5 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          {chat.avatar ? (
            <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full object-cover border border-white/5" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold border border-white/5">
              {chat.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">{chat.name}</span>
              {chat.online && <span className="w-2.5 h-2.5 rounded-full bg-[#00D166] animate-pulse" />}
            </div>
            
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              {chat.typing ? (
                <span className="text-cyan-400 font-bold animate-pulse">{langSet.typingText}</span>
              ) : chat.online ? (
                <span className="text-emerald-400 font-semibold">{langSet.onlineText}</span>
              ) : (
                <span>{chat.lastSeen || langSet.lastSeenText}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 relative">
          <button 
            onClick={() => onPlaceCall('voice')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-xl transition"
            title="Encrypted voice call link"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={() => onPlaceCall('video')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-xl transition"
            title="Digital satellite video feed"
          >
            <Video className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
            title="Search local dialogue messages"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

          {/* Quick Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-11 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-30 font-sans text-xs flex flex-col gap-1">
              <button 
                onClick={() => { onMuteChat(); setShowMenu(false); }}
                className="w-full text-left p-2.5 hover:bg-slate-800 rounded-xl text-slate-300 flex items-center gap-2"
              >
                <BellOff className="w-4 h-4 text-amber-400" />
                <span>Mute Client Feed</span>
              </button>

              <button 
                onClick={() => { onLockChat(); setShowMenu(false); }}
                className="w-full text-left p-2.5 hover:bg-slate-800 rounded-xl text-slate-300 flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Lock Chat Node</span>
              </button>

              <button 
                onClick={() => { onArchiveChat(); setShowMenu(false); }}
                className="w-full text-left p-2.5 hover:bg-slate-800 rounded-xl text-slate-300 flex items-center gap-2"
              >
                <Archive className="w-4 h-4 text-indigo-400" />
                <span>Archive Chat</span>
              </button>

              <button 
                onClick={handleExportChatLogs}
                className="w-full text-left p-2.5 hover:bg-slate-800 rounded-xl text-slate-300 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Chat TXT</span>
              </button>

              <div className="border-t border-slate-850 my-1" />

              <button 
                onClick={() => { onClearChat(); setShowMenu(false); }}
                className="w-full text-left p-2.5 hover:bg-rose-950/20 text-rose-400 hover:bg-slate-800 rounded-xl flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear History Logs</span>
              </button>

              {onDeleteContact && (
                <button 
                  onClick={() => { onDeleteContact(chat.id); setShowMenu(false); }}
                  className="w-full text-left p-2.5 hover:bg-red-950/45 text-red-400 rounded-xl flex items-center gap-2 font-semibold"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete Contact</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline Search Bar Filter */}
      {showSearch && (
        <div className="bg-slate-900/90 border-b border-slate-850 p-2 flex items-center gap-2 px-4">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Matching messages content..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none text-xs"
          />
          <button onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dialogue Chat message display board list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0B] bg-[radial-gradient(rgba(45,92,254,0.035)_1px,transparent_1px)] bg-[size:16px_16px]">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <BarChart2 className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
            <p className="text-sm font-mono tracking-wide">Secure E2E link secured with: {chat.name}</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">{langSet.aboutSection}</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
              >
                <div 
                  className={`max-w-[75%] shadow-md flex flex-col relative ${
                    isMe 
                      ? "chat-bubble-me text-white" 
                      : "chat-bubble-them text-zinc-200 border border-white/5 shadow-md"
                  }`}
                >
                  
                  {/* Reply Reference header inside message card */}
                  {msg.replyToMessage && (
                    <div className="p-2 rounded-lg bg-black/25 text-[10px] leading-tight mb-2 border-l-2 border-[#2D5CFE] flex flex-col text-slate-300">
                      <span className="font-bold text-[#2D5CFE]">{msg.replyToMessage.senderName}</span>
                      <span className="truncate">{msg.replyToMessage.content}</span>
                    </div>
                  )}

                  {/* Render content based on message type */}
                  {msg.type === 'image' && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                      <img src={msg.mediaUrl} alt="Attached Visual media" className="w-full max-h-48 object-cover" />
                    </div>
                  )}

                  {msg.type === 'video' && (
                    <div className="mb-2 rounded-xl overflow-hidden bg-black/40 border border-black/20 p-2 flex flex-col items-center justify-center">
                      <video src={msg.mediaUrl} controls className="w-full max-h-48 rounded-lg" />
                    </div>
                  )}

                  {msg.type === 'audio' && (
                    <div className="mb-2 flex items-center gap-3 bg-black/25 p-2.5 rounded-xl border border-white/5">
                      <div className="w-9 h-9 rounded-full bg-[#2D5CFE]/10 flex items-center justify-center text-[#2D5CFE] text-xs">
                        {msg.duration ? `${msg.duration}s` : "Play"}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1 w-28 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2D5CFE]" style={{ width: "45%" }} />
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">VOICENOTE SENSING</p>
                      </div>
                    </div>
                  )}

                  {msg.type === 'document' && (
                    <a 
                      href={msg.mediaUrl} 
                      download={msg.fileName}
                      className="mb-2 flex items-center gap-3 bg-black/25 p-2 rounded-xl border border-white/5 hover:bg-white/5 transition"
                    >
                      <FileBox className="w-8 h-8 text-[#2D5CFE]" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-white max-w-[120px] truncate">{msg.fileName || "nexus_doc.pdf"}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{msg.fileSize || "4.8 MB"}</p>
                      </div>
                    </a>
                  )}

                  {msg.type === 'poll' && msg.poll && (
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 mb-2 space-y-2.5 text-left w-56 sm:w-64">
                      <p className="text-xs font-bold text-[#2D5CFE] flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4" />
                        <span>{msg.poll.question}</span>
                      </p>

                      <div className="space-y-1.5">
                        {msg.poll.options.map((opt) => {
                          const userHasVoted = opt.votes.includes(currentUserId);
                          const totalVotes = msg.poll!.options.reduce((acc, currentOpt) => acc + currentOpt.votes.length, 0);
                          const percentage = totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleVotePoll(msg.id, opt.id)}
                              className="w-full bg-[#111113] hover:bg-[#18181B] p-2 rounded-lg text-left relative overflow-hidden flex justify-between items-center text-[11px] font-medium border border-white/5"
                            >
                              {/* Background loading bar */}
                              <div className="absolute top-0 bottom-0 left-0 bg-[#2D5CFE]/12 transition-all duration-300" style={{ width: `${percentage}%` }} />
                              
                              <span className="relative z-10 text-slate-200 truncate flex items-center gap-1">
                                {userHasVoted && <span className="text-[#2D5CFE]">●</span>}
                                {opt.text}
                              </span>
                              <span className="relative z-10 text-[10px] font-mono text-slate-400">
                                {opt.votes.length} ({Math.round(percentage)}%)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {msg.type === 'sticker' && (
                    <span className="text-4xl py-2 select-none">{msg.content}</span>
                  )}

                  {msg.type === 'gif' && (
                    <div className="mb-2 rounded-xl overflow-hidden max-h-40 border border-slate-900">
                      <img src={msg.mediaUrl} alt="GIF" className="w-full object-cover" />
                    </div>
                  )}

                  {/* Standard Text description */}
                  {msg.type !== 'poll' && msg.type !== 'sticker' && msg.type !== 'gif' && (
                    <p className="text-xs leading-normal select-text break-words font-sans">
                      {msg.content}
                    </p>
                  )}

                  {/* Message footer timestamp + double ticks in inline details */}
                  <div className="flex items-center gap-1 justify-end text-[8px] font-mono text-slate-500 mt-1">
                    {msg.edited && <span className="text-[7px] bg-zinc-800 text-[#2D5CFE] px-1 rounded uppercase">EDITED</span>}
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    
                    {isMe && (
                      <span className="ml-1">
                        {msg.seen && readReceipts ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#2D5CFE]" />
                        ) : msg.delivered ? (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-450" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Message quick action buttons triggered on hover */}
                  <div className={`absolute top-0 ${isMe ? "left-0 -translate-x-[110%]" : "right-0 translate-x-[110%]"} hidden group-hover:flex items-center bg-zinc-900 border border-white/5 rounded-lg p-1 space-x-1 shadow-2xl z-20`}>
                    <button 
                      onClick={() => setReplyMessageRef(msg)}
                      className="p-1 hover:bg-zinc-800 text-slate-400 hover:text-[#2D5CFE] rounded transition"
                      title="Reply"
                    >
                      <Reply className="w-3 h-3" />
                    </button>

                    <button 
                      onClick={() => handleCopyText(msg.content)}
                      className="p-1 hover:bg-zinc-800 text-slate-400 hover:text-white rounded transition"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button 
                      onClick={() => onToggleStarMessage(msg.id)}
                      className="p-1 hover:bg-zinc-800 text-slate-400 hover:text-amber-400 rounded transition"
                      title="Star highlight"
                    >
                      <Star className="w-3 h-3" />
                    </button>

                    <button 
                      onClick={() => onDeleteMessage(msg.id, true)}
                      className="p-1 hover:bg-zinc-800 text-rose-500 hover:text-rose-400 rounded transition"
                      title="Delete everyone"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing mock element */}
        {chat.typing && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono py-1 px-4">
            <span className="w-2 h-2 rounded-full bg-[#2D5CFE] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#2D5CFE] animate-bounce delay-150" />
            <span className="w-2 h-2 rounded-full bg-[#2D5CFE] animate-bounce delay-300" />
            <span className="ml-1">{chat.name} {langSet.typingText}</span>
          </div>
        )}

        {/* Dummy anchor for chat scroll bottom */}
        <div ref={listEndRef} />
      </div>

      {/* DRAWERS & DIALOG OVERLAYS IN ACTION BOX */}

      {/* Attachment Submenu Drawer */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-4 bg-zinc-950/95 border border-white/5 rounded-2xl grid grid-cols-3 gap-2.5 p-3.5 z-20 shadow-2xl">
          <button
            type="button"
            onClick={() => handleMockAttachmentSubmit('image', "Attached HD Photo", "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600&auto=format&fit=crop")}
            className="flex flex-col items-center p-2.5 hover:bg-white/5 rounded-xl text-[#2D5CFE] text-center text-[10px] font-medium transition"
          >
            <ImageIcon className="w-5 h-5 mb-1 text-[#2D5CFE]" />
            <span>HQ Image</span>
          </button>

          <button
            type="button"
            onClick={() => handleMockAttachmentSubmit('video', "Attached Film Log", "https://www.w3schools.com/html/mov_bbb.mp4")}
            className="flex flex-col items-center p-2.5 hover:bg-white/5 rounded-xl text-purple-400 text-center text-[10px] font-medium transition"
          >
            <Video className="w-5 h-5 mb-1 text-purple-400" />
            <span>Video Clip</span>
          </button>

          <button
            type="button"
            onClick={() => handleMockAttachmentSubmit('document', "system_requirements.pdf", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")}
            className="flex flex-col items-center p-2.5 hover:bg-white/5 rounded-xl text-emerald-400 text-center text-[10px] font-medium transition"
          >
            <FileText className="w-5 h-5 mb-1 text-emerald-400" />
            <span>PDF Doc</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPollCreator(true)}
            className="flex flex-col items-center p-2.5 hover:bg-white/5 rounded-xl text-amber-400 text-center text-[10px] font-medium transition"
          >
            <BarChart2 className="w-5 h-5 mb-1 text-amber-400" />
            <span>Deploy Poll</span>
          </button>

          <button
            type="button"
            onClick={() => handleMockAttachmentSubmit('location', "Sat-Map Coordinates: 37.7749N, 122.4194W", "https://maps.google.com")}
            className="flex flex-col items-center p-2.5 hover:bg-white/5 rounded-xl text-rose-400 text-center text-[10px] font-medium transition"
          >
            <MapPin className="w-5 h-5 mb-1 text-rose-400" />
            <span>Map Node</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowGifs(!showGifs); setShowAttachMenu(false); }}
            className="flex flex-col items-center p-2.5 hover:bg-white/5 rounded-xl text-indigo-400 text-center text-[10px] font-medium transition"
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span>GIF Vault</span>
          </button>
        </div>
      )}

      {/* Poll Creator popup */}
      {showPollCreator && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-30">
          <form onSubmit={handleDeployPoll} className="w-full max-w-sm bg-zinc-950 border border-white/5 rounded-2xl p-5 shadow-2xl text-left space-y-4 font-sans">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{langSet.pollCreateBtn}</h4>
            
            <div>
              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">{langSet.pollQuestion}</label>
              <input
                type="text"
                required
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="e.g. Which design is better?"
                className="w-full px-3 py-2 bg-[#050505] border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-[#2D5CFE]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">{langSet.pollOptions}</label>
              <input
                type="text"
                required
                value={pollOptionsInput}
                onChange={(e) => setPollOptionsInput(e.target.value)}
                placeholder="Option A, Option B, Option C..."
                className="w-full px-3 py-2 bg-[#050505] border border-white/5 rounded-lg text-white text-xs focus:outline-none focus:border-[#2D5CFE]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button 
                type="button" 
                onClick={() => setShowPollCreator(false)}
                className="py-1.5 px-3.5 bg-zinc-800 text-slate-300 rounded-lg font-semibold text-xs transition"
              >
                Cancel
              </button>

              <button 
                type="submit" 
                className="py-1.5 px-3.5 nexus-gradient hover:opacity-90 rounded-lg font-semibold text-xs text-white shadow-md transition"
              >
                Submit Poll
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GIF Selection grid */}
      {showGifs && (
        <div className="absolute bottom-20 left-4 w-72 bg-[#0F0F11] border border-white/5 rounded-2xl p-3.5 z-20 shadow-2xl flex flex-col gap-2.5">
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Select Trending GIF</span>
            <button onClick={() => setShowGifs(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto">
            {sampleGifs.map((gifUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSendMessage("Sent GIF", 'gif', gifUrl);
                  setShowGifs(false);
                }}
                className="rounded-lg overflow-hidden border border-white/5 hover:scale-105 transition"
              >
                <img src={gifUrl} className="w-full h-20 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stickers Selection Drawer */}
      {showStickers && (
        <div className="absolute bottom-20 left-4 w-72 bg-[#0F0F11] border border-white/5 rounded-2xl p-3.5 z-20 shadow-2xl flex flex-col gap-2.5">
          <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-semibold">Stickers Drawer</span>
            <button onClick={() => setShowStickers(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 py-1">
            {sampleStickers.map((sticker, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSendMessage(sticker, 'sticker');
                  setShowStickers(false);
                }}
                className="text-3xl hover:scale-135 transition"
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Swipe/Active Reply Reference Floating Indicator bar above input */}
      {replyMessageRef && (
        <div className="mx-4 mt-2 p-2.5 bg-zinc-900 border border-white/5 rounded-xl relative flex justify-between items-center border-l-4 border-[#2D5CFE] animate-pulse text-xs text-slate-300">
          <div className="text-left">
            <p className="text-[10px] text-[#2D5CFE] font-bold">{replyMessageRef.senderName}</p>
            <p className="text-slate-300 truncate max-w-[200px]">{replyMessageRef.content}</p>
          </div>
          <button onClick={() => setReplyMessageRef(null)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <div className="p-3 bg-[#0F0F11] border-t border-white/5 relative z-10 flex items-center gap-2">
        
        {/* Attachment menu toggle button */}
        <button
          type="button"
          onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); setShowStickers(false); }}
          className={`p-2.5 rounded-xl border transition ${
            showAttachMenu 
              ? "bg-[#2D5CFE]/12 border-[#2D5CFE]/30 text-[#2D5CFE]" 
              : "bg-zinc-900 border-white/5 text-slate-400 hover:text-white"
          }`}
          title="Digital attachment menus"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>

        {/* Sticker toggle button */}
        <button
          type="button"
          onClick={() => { setShowStickers(!showStickers); setShowAttachMenu(false); }}
          className={`p-2.5 rounded-xl border transition ${
            showStickers 
              ? "bg-[#2D5CFE]/12 border-[#2D5CFE]/30 text-[#2D5CFE]" 
              : "bg-zinc-900 border-white/5 text-slate-400 hover:text-white"
          }`}
          title="Stickers Drawer"
        >
          <Smile className="w-4.5 h-4.5" />
        </button>

        {/* Voice recording layout VS Typing layout */}
        {isRecordingVoice ? (
          <div className="flex-1 bg-rose-950/20 border border-rose-900/30 rounded-xl px-4 py-2.5 flex justify-between items-center text-rose-400 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>RECORDING VOICE CLIP: {voiceSecs}s</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={cancelVoiceRecording}
                type="button"
                className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-wider"
              >
                Slide to Cancel
              </button>

              <button 
                onClick={finishVoiceRecording}
                type="button"
                className="py-1 px-3 bg-rose-600 text-white font-bold rounded-lg text-[10px] tracking-wider transition"
              >
                SEND
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendText} className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Locking message packets... type / help for shortcuts"
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-white/5 text-white text-xs focus:outline-none focus:border-[#2D5CFE]/80 transition"
            />

            {/* If has content show Send icon; else show simulated audio recorder holding icon */}
            {inputText.trim() ? (
              <button
                type="submit"
                className="p-2.5 rounded-xl nexus-gradient text-white transition flex items-center justify-center shadow-lg hover:opacity-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={startVoiceRecording}
                onTouchStart={startVoiceRecording}
                className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-slate-400 hover:text-[#2D5CFE] transition"
                title="Hold to Record voice message logs"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
