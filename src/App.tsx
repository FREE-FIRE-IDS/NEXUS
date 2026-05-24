/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquareCode, 
  PhoneCall, 
  CircleDot, 
  Contact, 
  Settings, 
  Search, 
  Plus, 
  Archive, 
  Lock, 
  Bell, 
  FileText, 
  X, 
  Menu, 
  ArrowRightLeft, 
  Sparkles,
  UserCheck,
  Trash2
} from "lucide-react";

// Sub-components
import { SplashScreen } from "./components/SplashScreen";
import { AuthScreen } from "./components/AuthScreen";
import { VoiceVideoOverlay } from "./components/VoiceVideoOverlay";
import { StatusViewer } from "./components/StatusViewer";
import { ChatPanel } from "./components/ChatPanel";
import { SettingsPanel } from "./components/SettingsPanel";

// Types & Languages
import { UserProfile, Chat, Message, StatusUpdate, CallRecord } from "./types";
import { translations, TranslationSet } from "./languages";

export default function App() {
  // Navigation & Screen states
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'status' | 'contacts' | 'settings'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Core Messenger Database States (synced in localStorage)
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  // Sub-states
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactIdInput, setContactIdInput] = useState("");
  const [contactNameInput, setContactNameInput] = useState("");
  const [errorContact, setErrorContact] = useState("");

  // System Settings state
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'amoled'>('dark');
  const [accentColor, setAccentColor] = useState('cyan'); // cyan, indigo, emerald, purple
  const [bubbleColor, setBubbleColor] = useState('cyan');
  const [activeLanguage, setActiveLanguage] = useState('en');

  // Multi-tab Settings triggers
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [archivedChats, setArchivedChats] = useState<string[]>([]);
  const [lockedChats, setLockedChats] = useState<string[]>([]);
  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [uploadQuality, setUploadQuality] = useState<'hd' | 'standard' | 'low'>('standard');

  // Lock Verification overlay Modal
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [lockCodeInput, setLockCodeInput] = useState("");
  const [unresolvedLockChatId, setUnresolvedLockChatId] = useState<string | null>(null);
  const [lockPinCode, setLockPinCode] = useState("1234"); // default passcode

  // Active call overlay session state
  const [activeCall, setActiveCall] = useState<any | null>(null);
  
  // Status story active uploader
  const [activeStatusViewer, setActiveStatusViewer] = useState<StatusUpdate | null>(null);
  const [newStatusType, setNewStatusType] = useState<'text' | 'image' | 'video'>('text');
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusFile, setNewStatusFile] = useState<string>('');
  const [newStatusFileName, setNewStatusFileName] = useState('');

  // Native notification banners
  const [systemToasts, setSystemToasts] = useState<Array<{ id: string; title: string; desc: string; icon?: string }>>([]);

  // Contact delete modal reference state
  const [contactToDelete, setContactToDelete] = useState<Chat | null>(null);

  const langSet: TranslationSet = translations[activeLanguage] || translations['en'];

  // Initialize and check auto session recovery on boot
  useEffect(() => {
    // 1. Recover User from localStorage securely
    const savedId = localStorage.getItem("NEXUS_SAVED_ID");
    const savedPw = localStorage.getItem("NEXUS_SAVED_PW");
    const cachedProfileJSON = localStorage.getItem("NEXUS_CACHED_PROFILE");
    
    if (savedId && savedPw) {
      let isInitialized = false;
      let cachedProfileObj: any = null;

      if (cachedProfileJSON) {
        try {
          cachedProfileObj = JSON.parse(cachedProfileJSON);
          handleInitUserProfile(cachedProfileObj);
          isInitialized = true;
        } catch (e) {
          console.error("Failed to parse cached profile", e);
        }
      }

      // Sync/authenticate with Express backend in background
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nexusId: savedId, password: savedPw })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          handleInitUserProfile(data.profile);
        } else {
          // If login fails (e.g. backend restarted, resetting in-memory DB),
          // silently auto-register using cached details to recreate server credentials
          const profileToSync = cachedProfileObj || {
            id: savedId,
            name: localStorage.getItem("NEXUS_SAVED_NAME") || "Digital Node",
            bio: "Hey there! Custom offline restored node active.",
            avatar: ""
          };

          fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              name: profileToSync.name, 
              password: savedPw, 
              bio: profileToSync.bio, 
              avatar: profileToSync.avatar 
            })
          })
          .then(r => r.json())
          .then(regData => {
            if (regData.success) {
              const freshProfile = regData.profile || profileToSync;
              if (!isInitialized) {
                handleInitUserProfile(freshProfile);
              }
              // Quietly backup current records to newly re-created account on the server
              fetch("/api/sync/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nexusId: freshProfile.id,
                  profile: freshProfile,
                  chats: JSON.parse(localStorage.getItem(`NEXUS_CHATS_${freshProfile.id}`) || "[]"),
                  messages: JSON.parse(localStorage.getItem(`NEXUS_MSGS_${freshProfile.id}`) || "[]"),
                  statuses: JSON.parse(localStorage.getItem(`NEXUS_STATUSES_${freshProfile.id}`) || "[]"),
                  calls: JSON.parse(localStorage.getItem(`NEXUS_CALLS_${freshProfile.id}`) || "[]")
                })
              }).catch(() => {});
            }
          })
          .catch(() => {
            // Re-register connection failed, proceed completely offline
            if (!isInitialized) {
              fallbackOffline();
            }
          });
        }
      })
      .catch(() => {
        // Server offline, fall back to offline mode
        if (!isInitialized) {
          fallbackOffline();
        }
      });

      function fallbackOffline() {
        const mockProfile: UserProfile = {
          id: savedId!,
          name: localStorage.getItem("NEXUS_SAVED_NAME") || "Digital Node",
          bio: "Secured offline user node.",
          avatar: "",
          registeredAt: new Date().toISOString(),
          theme: 'dark',
          accentColor: 'cyan',
          bubbleColor: 'cyan',
          wallpaper: 'default',
          language: 'en',
          lastSeenSetting: 'everyone',
          onlineSetting: 'everyone',
          dpSetting: 'everyone',
          bioSetting: 'everyone',
          statusPrivacy: 'everyone',
          statusPrivacySelected: [],
          readReceipts: true,
          typingIndicator: true,
          uploadQuality: 'standard',
          autoDownload: { photos: 'wifi', videos: 'wifi', audio: 'wifi', documents: 'wifi' },
          blockedUsers: [],
          archivedChats: [],
          lockedChats: [],
          mutedChats: [],
          pinnedChats: [],
          starredMessages: []
        };
        handleInitUserProfile(mockProfile);
      }
    }

    // Keyboard Shortcuts integration (Desktop precision)
    const handleShortcuts = (e: KeyboardEvent) => {
      // Ctrl + N -> Reset selected chat, focus contact adding or chats search
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setSelectedChatId(null);
        setActiveTab('contacts');
        triggerToast("DESKTOP NOTIFICATION", "Shortcuts active: Ctrl+N triggered navigation panel.", "🚀");
      }
      // Ctrl + F -> focus searching in chat / expand inputs
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setSearchQuery("");
        triggerToast("DESKTOP SHORTCUT", "Ctrl+F triggered chats filter indexing.", "🔍");
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, []);

  const triggerToast = (title: string, desc: string, icon = "🔔") => {
    const id = `toast-${Date.now()}`;
    setSystemToasts(prev => [...prev, { id, title, desc, icon }]);
    setTimeout(() => {
      setSystemToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleInitUserProfile = (profile: any) => {
    setCurrentUser(profile);
    localStorage.setItem("NEXUS_CACHED_PROFILE", JSON.stringify(profile));
    
    // Apply user configurations
    setAppTheme(profile.theme || 'dark');
    setAccentColor(profile.accentColor || 'cyan');
    setBubbleColor(profile.bubbleColor || 'cyan');
    setActiveLanguage(profile.language || 'en');
    setBlockedUsers(profile.blockedUsers || []);
    setArchivedChats(profile.archivedChats || []);
    setLockedChats(profile.lockedChats || []);
    setMutedChats(profile.mutedChats || []);
    setPinnedChats(profile.pinnedChats || []);
    setTypingIndicator(profile.typingIndicator !== undefined ? profile.typingIndicator : true);
    setReadReceipts(profile.readReceipts !== undefined ? profile.readReceipts : true);
    setUploadQuality(profile.uploadQuality || 'standard');

    // Safe load conversation cache
    const cachedChats = localStorage.getItem(`NEXUS_CHATS_${profile.id}`);
    const cachedMsgs = localStorage.getItem(`NEXUS_MSGS_${profile.id}`);
    const cachedCalls = localStorage.getItem(`NEXUS_CALLS_${profile.id}`);
    const cachedStatuses = localStorage.getItem(`NEXUS_STATUSES_${profile.id}`);

    if (cachedChats && cachedMsgs) {
      setChats(JSON.parse(cachedChats));
      setMessages(JSON.parse(cachedMsgs));
    } else {
      // Preload 4 gorgeous automated chat channels
      const initialChats: Chat[] = [
        { id: "chat-+0101010", participantId: "+0101010", name: "Assistant Nexus Agent", avatar: "", bio: "Official AI companion. Ask me anything!", online: true, unreadCount: 1, lastSeen: "Online" },
        { id: "chat-+0246810", participantId: "+0246810", name: "Sophia Lin", avatar: "", bio: "Product Designer | Color aesthetics ✨", online: true, unreadCount: 1, lastSeen: "Active 5m ago" },
        { id: "chat-+0135790", participantId: "+0135790", name: "Vikram Patel", avatar: "", bio: "Tech Lead | Cloud compiler 💻", online: false, unreadCount: 0, lastSeen: "Last seen at 09:22" },
        { id: "chat-+0481516", participantId: "+0481516", name: "Emma Watson", avatar: "", bio: "Literature readings and film ☕", online: true, unreadCount: 0, lastSeen: "Online" }
      ];

      const initialMsgs: Message[] = [
        { id: "m-1", chatId: "chat-+0101010", senderId: "+0101010", senderName: "Assistant Nexus Agent", type: 'text', content: "Welcome to Nexus Messenger! Powered by Google Gemini. Type any inquiry or dial me directly via voice/video!", seen: false, delivered: true, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "m-2", chatId: "chat-+0246810", senderId: "+0246810", senderName: "Sophia Lin", type: 'text', content: "Hey! Let's build a stunning minimalist UI together. Check my visual designs in the Status tab in bottom menu! 🕒✨", seen: false, delivered: true, timestamp: new Date(Date.now() - 1800000).toISOString() }
      ];

      setChats(initialChats);
      setMessages(initialMsgs);
      saveCacheInstantly(profile.id, initialChats, initialMsgs, [], []);
    }

    if (cachedCalls) setCalls(JSON.parse(cachedCalls));
    
    // Status preloads
    if (cachedStatuses) {
      setStatuses(JSON.parse(cachedStatuses));
    } else {
      const demoStatuses: StatusUpdate[] = [
        {
          id: "stat-1",
          userId: "+0246810",
          userName: "Sophia Lin",
          userAvatar: "",
          type: 'text',
          content: "Designing the new Cosmic Slate pitch accent. Less is more! ✨👾",
          textBg: "bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-800",
          timestamp: new Date().toISOString(),
          views: []
        },
        {
          id: "stat-2",
          userId: "+0135790",
          userName: "Vikram Patel",
          userAvatar: "",
          type: 'image',
          content: "Debugging the virtual packet routing database metrics. 🖥️⚡",
          mediaUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop",
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          views: []
        }
      ];
      setStatuses(demoStatuses);
    }
  };

  const saveCacheInstantly = (uid: string, updatedChats: Chat[], updatedMsgs: Message[], updatedCalls?: CallRecord[], updatedStatuses?: StatusUpdate[]) => {
    localStorage.setItem(`NEXUS_CHATS_${uid}`, JSON.stringify(updatedChats));
    localStorage.setItem(`NEXUS_MSGS_${uid}`, JSON.stringify(updatedMsgs));
    if (updatedCalls) localStorage.setItem(`NEXUS_CALLS_${uid}`, JSON.stringify(updatedCalls));
    if (updatedStatuses) localStorage.setItem(`NEXUS_STATUSES_${uid}`, JSON.stringify(updatedStatuses));
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const finalProfile = { ...currentUser, ...updated };
    setCurrentUser(finalProfile);
    localStorage.setItem("NEXUS_CACHED_PROFILE", JSON.stringify(finalProfile));
    
    // Apply Settings Hooks directly
    if (updated.theme) setAppTheme(updated.theme);
    if (updated.accentColor) setAccentColor(updated.accentColor);
    if (updated.bubbleColor) setBubbleColor(updated.bubbleColor);
    if (updated.language) setActiveLanguage(updated.language);
    if (updated.blockedUsers) setBlockedUsers(updated.blockedUsers);
    if (updated.archivedChats) setArchivedChats(updated.archivedChats);
    if (updated.lockedChats) setLockedChats(updated.lockedChats);
    if (updated.mutedChats) setMutedChats(updated.mutedChats);
    if (updated.pinnedChats) setPinnedChats(updated.pinnedChats);
    if (updated.typingIndicator !== undefined) setTypingIndicator(updated.typingIndicator);
    if (updated.readReceipts !== undefined) setReadReceipts(updated.readReceipts);
    if (updated.uploadQuality) setUploadQuality(updated.uploadQuality);

    // Sync to back-end
    fetch("/api/sync/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nexusId: currentUser.id,
        profile: finalProfile,
        chats,
        messages,
        statuses,
        calls
      })
    });
  };

  // SEND MESSAGE HANDLER & AI BOT REPLY GATEWAY
  const handleSendMessage = (content: string, type: Message['type'] = 'text', mediaUrl?: string, additional?: any) => {
    if (!currentUser || !selectedChatId) return;

    const chatInstance = chats.find(c => c.id === selectedChatId);
    if (!chatInstance) return;

    if (blockedUsers.includes(chatInstance.participantId)) {
      triggerToast("BLOCK ALGORITHM", "You cannot send messages to blocked virtual identifiers.", "🚫");
      return;
    }

    const newMsg: Message = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      chatId: selectedChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      type,
      content,
      mediaUrl,
      replyToMessage: additional?.replyTo || undefined,
      poll: additional?.poll || undefined,
      seen: false,
      delivered: true,
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);

    // Update Chat indicator
    const updatedChats = chats.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: {
            content: type === 'poll' ? `📊 Poll: ${content}` : content,
            type,
            timestamp: new Date().toISOString(),
            senderId: currentUser.id,
            seen: true
          }
        };
      }
      return c;
    });
    setChats(updatedChats);
    saveCacheInstantly(currentUser.id, updatedChats, updatedMsgs, calls, statuses);

    // IF TARGET PARTICIPANT IS AI PERSONA, TRIGGER CONVERSATIONAL REPLY DYNAMICALLY
    const isBot = ["+0101010", "+0246810", "+0135790", "+0481516"].includes(chatInstance.participantId);
    if (isBot && !additional?.silentNotifyOnly) {
      
      // Hook active typing indicator after short link delays
      setTimeout(() => {
        setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, typing: true } : c));
      }, 800);

      // Call our Full Stack AI agent reply endpoint!
      const conversationHistory = updatedMsgs
        .filter(m => m.chatId === selectedChatId)
        .map(m => ({ senderName: m.senderName, content: m.content }));

      fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: chatInstance.participantId,
          conversationHistory,
          currentMessage: content
        })
      })
      .then(res => res.json())
      .then(botData => {
        // Disconnect typing status
        setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, typing: false } : c));

        const botMsg: Message = {
          id: `m-${Date.now()}-bot`,
          chatId: selectedChatId,
          senderId: botData.senderId,
          senderName: botData.senderName,
          type: 'text',
          content: botData.content,
          seen: false,
          delivered: true,
          timestamp: botData.timestamp
        };

        setMessages(prev => {
          const finished = [...prev, botMsg];
          // Turn reader saw ticks cyan
          if (readReceipts) {
            finished.forEach(m => {
              if (m.chatId === selectedChatId) m.seen = true;
            });
          }
          saveCacheInstantly(currentUser.id, updatedChats, finished, calls, statuses);
          return finished;
        });

        // Trigger dynamic satellite audio toast
        triggerToast(botData.senderName, botData.content.substring(0, 48) + "...", "💬");
      })
      .catch(() => {
        // Safe offline indicator recovery
        setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, typing: false } : c));
      });
    }
  };

  // PLACING INTERNET VOICE OR VIDEO CALL FEED
  const handlePlaceCall = (type: 'voice' | 'video') => {
    if (!currentUser || !selectedChatId) return;
    const chatInstance = chats.find(c => c.id === selectedChatId);
    if (!chatInstance) return;

    if (blockedUsers.includes(chatInstance.participantId)) {
      triggerToast("CALL BARRED", "Connections to blocked IDs are restricted.", "🚫");
      return;
    }

    const callSession = {
      id: `call-${Date.now()}`,
      userId: chatInstance.participantId,
      userName: chatInstance.name,
      userAvatar: chatInstance.avatar,
      type,
      direction: 'outgoing',
      status: 'connecting'
    };

    setActiveCall(callSession);

    // Simulate link vibrations ringing
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'ringing' } : null);
    }, 1200);

    // Simulate buddy pickup
    setTimeout(() => {
      setActiveCall((prev: any) => prev ? { ...prev, status: 'connected' } : null);
      
      // Append in historical logs
      const record: CallRecord = {
        id: `rec-${Date.now()}`,
        userId: chatInstance.participantId,
        userName: chatInstance.name,
        userAvatar: chatInstance.avatar,
        type,
        direction: 'outgoing',
        timestamp: new Date().toISOString(),
        duration: 0,
        status: 'connected'
      };

      setCalls(prev => {
        const appended = [record, ...prev];
        localStorage.setItem(`NEXUS_CALLS_${currentUser.id}`, JSON.stringify(appended));
        return appended;
      });
    }, 4500);
  };

  const handleAcceptCall = () => {
    if (!activeCall) return;
    setActiveCall((p: any) => ({ ...p, status: 'connected' }));
  };

  const handleHangupCall = (durationSecs: number) => {
    setActiveCall(null);
    triggerToast("NEXUS TELECOMMUNICATION", `Call session disconnected. Duration: ${durationSecs}s`, "📞");
    
    // Update active record duration
    if (currentUser && calls.length > 0) {
      setCalls(prev => {
        const copy = [...prev];
        if (copy[0]) {
          copy[0].duration = durationSecs;
          // if duration is 0, status is missed
          if (durationSecs === 0) copy[0].status = 'missed';
        }
        localStorage.setItem(`NEXUS_CALLS_${currentUser.id}`, JSON.stringify(copy));
        return copy;
      });
    }
  };

  // ADDING CONTACTS BY VIRTUAL NEXUS ID (+0......)
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorContact("");

    const fullId = contactIdInput.startsWith("+0") ? contactIdInput.trim() : `+0${contactIdInput.trim()}`;
    if (fullId.length < 5) {
      setErrorContact("Nexus ID must register valid numbers.");
      return;
    }

    // Verify duplication
    const duplicate = chats.find(c => c.participantId === fullId);
    if (duplicate) {
      setErrorContact("Dialog already open for this Virtual ID!");
      return;
    }

    const finalName = contactNameInput.trim() || `Nexus User ${fullId.slice(2, 6)}`;
    const newChat: Chat = {
      id: `chat-${fullId}`,
      participantId: fullId,
      name: finalName,
      avatar: "",
      bio: "Interactive digital user node active.",
      online: Math.random() > 0.4,
      unreadCount: 0,
      lastSeen: "Online"
    };

    const updated = [newChat, ...chats];
    setChats(updated);
    setSelectedChatId(newChat.id);
    saveCacheInstantly(currentUser.id, updated, messages, calls, statuses);

    setContactIdInput("");
    setContactNameInput("");
    setShowAddContact(false);
    triggerToast("CONDUIT CONNECTED", `E2E satellite linked initialized to identity ${fullId}!`, "🔗");
  };

  const handleForceBackupCloud = () => {
    if (!currentUser) return;
    fetch("/api/sync/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nexusId: currentUser.id,
        profile: currentUser,
        chats,
        messages,
        statuses,
        calls
      })
    })
    .then(res => res.json())
    .then(() => {
      triggerToast("CLOUD SYNCHRONOUS", langSet.backupSuccess, "☁️");
    })
    .catch(() => {
      triggerToast("SYNC EXCEPTION", "Network offline. backup stored in Local storage pipeline.", "🚫");
    });
  };

  const handleForceRestoreCloud = () => {
    if (!currentUser) return;
    const pwd = localStorage.getItem("NEXUS_SAVED_PW") || "12345";
    
    fetch("/api/sync/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nexusId: currentUser.id, password: pwd })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.backup) {
        setChats(data.backup.chats || []);
        setMessages(data.backup.messages || []);
        setStatuses(data.backup.statuses || []);
        setCalls(data.backup.calls || []);
        triggerToast("CLOUD RESTORATION", langSet.restoreSuccess, "☁️");
      }
    });
  };

  // STATUS UPDATER CREATOR LOGIC (IMAGE OR TEXT)
  const handlePublishTextStatus = (text: string) => {
    if (!currentUser) return;
    const newStatus: StatusUpdate = {
      id: `stat-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      type: 'text',
      content: text,
      textBg: "bg-gradient-to-tr from-cyan-600 to-indigo-700",
      timestamp: new Date().toISOString(),
      views: []
    };

    const updated = [newStatus, ...statuses];
    setStatuses(updated);
    saveCacheInstantly(currentUser.id, chats, messages, calls, updated);
    triggerToast("STATUS PUBLISHED", "Your visual status story is live on Nexus networks for 24 hours!", "🕒");
  };

  const handlePublishFileStatus = (type: 'image' | 'video', fileDataUrl: string, captionText: string) => {
    if (!currentUser) return;
    const newStatus: StatusUpdate = {
      id: `stat-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      type: type,
      content: captionText,
      mediaUrl: fileDataUrl,
      timestamp: new Date().toISOString(),
      views: []
    };

    const updated = [newStatus, ...statuses];
    setStatuses(updated);
    saveCacheInstantly(currentUser.id, chats, messages, calls, updated);
    triggerToast("STATUS PUBLISHED", `Your ${type} status story is live on Nexus networks!`, "🕒");
  };

  const handleStatusMuteToggle = (targetUserId: string) => {
    // Hide status story in local views
    setStatuses(prev => prev.filter(s => s.userId !== targetUserId));
    triggerToast("PRIVACY FILTERS", "Muted status stories from this account successfully.", "🔕");
  };

  // DELETE MESSAGE (FOR ME / FOR EVERYONE)
  const handleDeleteMessage = (messageId: string, forEveryone: boolean) => {
    if (!currentUser) return;
    const updatedMsgs = messages.filter(m => m.id !== messageId);
    setMessages(updatedMsgs);
    saveCacheInstantly(currentUser.id, chats, updatedMsgs, calls, statuses);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!currentUser) return;
    const updated = messages.map(m => m.id === messageId ? { ...m, content: newContent, edited: true } : m);
    setMessages(updated);
    saveCacheInstantly(currentUser.id, chats, updated, calls, statuses);
  };

  const handleToggleStarMessage = (messageId: string) => {
    if (!currentUser) return;
    const updated = messages.map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m);
    setMessages(updated);
    saveCacheInstantly(currentUser.id, chats, updated, calls, statuses);
    triggerToast("STAR HIGHLIGHT", "Message toggled in your Starred log bookmarks.", "⭐");
  };

  const handleAuthSuccess = (profile: any, tokenMsg?: string) => {
    handleInitUserProfile(profile);
    if (tokenMsg) {
      triggerToast("NEXUS ACCESS CONDUIT", tokenMsg, "🔐");
    }
  };

  // Sign out helper
  const handleSignOut = () => {
    localStorage.removeItem("NEXUS_SAVED_ID");
    localStorage.removeItem("NEXUS_SAVED_PW");
    setCurrentUser(null);
    setChats([]);
    setMessages([]);
    setStatuses([]);
    setCalls([]);
  };

  // Pin / Archiv toggle helpers
  const handleTogglePinned = (chatId: string) => {
    const isPinned = pinnedChats.includes(chatId);
    const updated = isPinned ? pinnedChats.filter(c => c !== chatId) : [...pinnedChats, chatId];
    handleUpdateProfile({ pinnedChats: updated });
    triggerToast("CONVERSATION FEED", isPinned ? "Unpinned conversation." : "Conversation pinned to top feed.", "📌");
  };

  const handleToggleArchived = (chatId: string) => {
    const isArchived = archivedChats.includes(chatId);
    const updated = isArchived ? archivedChats.filter(c => c !== chatId) : [...archivedChats, chatId];
    handleUpdateProfile({ archivedChats: updated });
    triggerToast("ARCHIVE METRICS", isArchived ? "Chat unarchived." : "Chat relocated to the Archiv vault.", "📦");
  };

  const handleToggleLocked = (chatId: string) => {
    const isLocked = lockedChats.includes(chatId);
    const updated = isLocked ? lockedChats.filter(c => c !== chatId) : [...lockedChats, chatId];
    handleUpdateProfile({ lockedChats: updated });
    triggerToast("VAULT ENCRYPTOR", isLocked ? "Chat unlocked successfully." : "Chat locked with secure code requirement.", "🔒");
  };

  // Filtering chats depending on tab search criteria
  const activeChatList = chats
    .filter(c => {
      // Archive view filter
      const isArch = archivedChats.includes(c.id);
      if (activeTab === 'chats' && isArch) return false;
      return true;
    })
    .filter(c => {
      if (!searchQuery.trim()) return true;
      return c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.participantId.includes(searchQuery);
    });

  // Render Theme Styles
  const getThemeClasses = () => {
    switch (appTheme) {
      case 'light': return "bg-slate-50 text-slate-900 border-slate-200";
      case 'amoled': return "bg-black text-white border-white/5";
      default: return "bg-[#050505] text-[#E0E0E0] border-white/5";
    }
  };

  const getAccentColorClass = () => {
    switch (accentColor) {
      case 'indigo': return 'from-blue-600 to-indigo-700 bg-[#2D5CFE] text-blue-400';
      case 'emerald': return 'from-emerald-500 to-emerald-600 bg-emerald-500 text-emerald-400';
      case 'purple': return 'from-purple-500 to-purple-600 bg-purple-500 text-purple-400';
      default: return 'from-blue-600 to-indigo-700 bg-[#2D5CFE] text-blue-400'; // blue maps to brand royal
    }
  };

  // SPLASH LIFECYCLE
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} langSet={langSet} />;
  }

  // AUTH REQUIRED GATEWAY
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} langSet={langSet} />;
  }

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const selectedChatMessages = messages.filter(m => m.chatId === selectedChatId);

  return (
    <div className={`min-h-screen flex items-center justify-center p-0 xl:p-6 transition-colors duration-200 ${getThemeClasses()}`}>
      
      {/* Dynamic flying toast banners in workspace */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {systemToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 50, opacity: 0, scale: 0.9 }}
              className="p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl flex gap-3 pointer-events-auto items-start"
            >
              <span className="text-lg">{toast.icon}</span>
              <div className="text-left font-sans flex-1">
                <p className="text-[11px] font-bold text-white uppercase tracking-wider">{toast.title}</p>
                <p className="text-[10px] text-slate-300 leading-normal mt-0.5">{toast.desc}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Primary Desktop Layout Container */}
      <div className="w-full max-w-7xl h-screen xl:h-[90vh] bg-[#141416]/95 border border-white/10 rounded-none xl:rounded-3xl flex flex-col md:flex-row shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Leftmost Sidebar Navigation Controls */}
        <div className="w-full md:w-20 bg-[#0F0F11] border-r border-white/5 flex flex-row md:flex-col items-center justify-between p-4 flex-shrink-0 z-20">
          
          <div className="flex items-center md:flex-col gap-6 w-full md:w-auto justify-between md:justify-start">
            {/* App Branding Symbol */}
            <div className="w-12 h-12 rounded-2xl nexus-gradient flex items-center justify-center text-white shadow-xl">
              <MessageSquareCode className="w-6 h-6" />
            </div>

            {/* Middle Nav Tab list */}
            <div className="flex md:flex-col gap-3.5">
              {[
                { id: 'chats', label: langSet.chatsTab, icon: MessageSquareCode },
                { id: 'calls', label: langSet.callsTab, icon: PhoneCall },
                { id: 'status', label: langSet.statusTab, icon: CircleDot },
                { id: 'contacts', label: langSet.contactsTab, icon: Contact },
                { id: 'settings', label: langSet.settingsTab, icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      if (tab.id !== 'chats') setSelectedChatId(null);
                    }}
                    className={`p-3 rounded-2xl relative transition hover:scale-105 active:scale-95 group ${
                      isActive 
                        ? "bg-[#2D5CFE]/12 text-[#2D5CFE] border border-[#2D5CFE]/20 shadow-inner" 
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                    title={tab.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="absolute left-full ml-3 py-1 px-2.5 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none hidden md:block">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-xs border border-white/5">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

        </div>

        {/* Middle Columns: Chats lists, calls archives or contacts selection grid */}
        <div className="w-full md:w-80 bg-slate-950 flex flex-col flex-shrink-0 border-r border-slate-900 font-sans">
          
          {/* Header query panel */}
          <div className="p-4 bg-slate-900/30 border-b border-slate-900/60 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
                <span>{langSet[`${activeTab}Tab` as keyof TranslationSet] || "Nexus"}</span>
                {activeTab === 'chats' && archivedChats.length > 0 && (
                  <span className="text-[9px] bg-slate-850 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">
                    {archivedChats.length} VAULTED
                  </span>
                )}
              </h2>

              {activeTab === 'contacts' && (
                <button
                  onClick={() => setShowAddContact(true)}
                  className="p-1 px-2 text-[10px] bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD ID</span>
                </button>
              )}
            </div>

            {/* Unified Filter Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={langSet.searchPlaceholder}
                className="w-full bg-zinc-900 border border-white/5 focus:border-[#2D5CFE]/60 transition rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none placeholder-slate-500"
              />
            </div>
          </div>

          {/* RENDERING LIST PANELS ACCORDING TO TAB TYPE */}
          <div className="flex-1 overflow-y-auto p-2">
            
            {/* 1. CHATS TAB */}
            {activeTab === 'chats' && (
              <div className="space-y-1">
                {activeChatList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8 font-mono">{langSet.noChats}</p>
                ) : (
                  activeChatList.map((ch) => {
                    const isSelected = selectedChatId === ch.id;
                    const isMuted = mutedChats.includes(ch.id);
                    const isPinned = pinnedChats.includes(ch.id);
                    const isLocked = lockedChats.includes(ch.id);

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          if (isLocked) {
                            setUnresolvedLockChatId(ch.id);
                            setIsAppLocked(true);
                          } else {
                            setSelectedChatId(ch.id);
                          }
                        }}
                        className={`p-3 rounded-2xl flex justify-between items-center cursor-pointer transition relative group ${
                          isSelected 
                            ? "active-chat glass-item text-white" 
                            : "glass-item text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            {ch.avatar ? (
                               <img src={ch.avatar} className="w-10 h-10 rounded-full object-cover border border-white/5" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold border border-white/5">
                                 {ch.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            {ch.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00D166] border border-slate-950 rounded-full" />
                            )}
                          </div>

                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate max-w-[110px]">{ch.name}</span>
                              {isLocked && <Lock className="w-3 h-3 text-[#2D5CFE]" />}
                              {isPinned && <span className="text-[10px] text-slate-400" title="Pinned to top">📌</span>}
                            </div>
                            
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono mt-0.5">
                              {ch.lastMessage ? ch.lastMessage.content : ch.bio}
                            </p>
                          </div>
                        </div>

                        {/* Unread indicators & Timestamp metadata */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="text-[8px] font-mono text-slate-500">
                            {ch.lastMessage 
                              ? new Date(ch.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "Active"}
                          </span>

                          <div className="flex items-center gap-1.5 mt-1">
                            {ch.unreadCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#2D5CFE] flex items-center justify-center text-[9px] font-bold text-white">
                                {ch.unreadCount}
                              </span>
                            )}

                            {/* Hover Quick Chat Modifier Controls */}
                            <div className="hidden group-hover:flex items-center gap-1 relative z-10">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleTogglePinned(ch.id); }}
                                className="p-1 hover:bg-slate-800 text-slate-400 rounded hover:text-white"
                                title="Pin chat"
                              >
                                📌
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleLocked(ch.id); }}
                                className="p-1 hover:bg-slate-800 text-slate-400 rounded hover:text-white"
                                title="Lock chat"
                              >
                                🔒
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleArchived(ch.id); }}
                                className="p-1 hover:bg-slate-800 text-slate-400 rounded hover:text-white"
                                title="Archive chat"
                              >
                                📦
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setContactToDelete(ch); }}
                                className="p-1 hover:bg-white/5 text-slate-400 hover:text-red-500 rounded transition"
                                title="Delete Contact"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. CALLS TAB */}
            {activeTab === 'calls' && (
              <div className="space-y-1.5 text-left">
                {calls.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8 font-mono">No dial-in records logged yet.</p>
                ) : (
                  calls.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-900/30 rounded-2xl flex justify-between items-center border border-slate-900">
                      <div className="flex items-center gap-3">
                        {c.userAvatar ? (
                          <img src={c.userAvatar} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-xs border border-white/5">
                            {c.userName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-bold text-white">{c.userName}</p>
                          <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                            <span>{c.direction === 'incoming' ? "Incoming Satellite" : "Outgoing Link"}</span>
                            <span>●</span>
                            <span>{c.type}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-mono text-slate-400">
                          {c.duration > 0 ? `${c.duration}s` : "Missed Link"}
                        </p>
                        <p className="text-[8px] text-slate-600 font-mono mt-0.5">
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. STATUS TAB */}
            {activeTab === 'status' && (
              <div className="space-y-4 text-left p-2">
                
                {/* User's OWN status creation panel */}
                <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Publish status story</h4>
                    <div className="flex gap-1 bg-zinc-950 p-0.5 rounded-lg border border-white/5">
                      <button 
                        type="button" 
                        onClick={() => { setNewStatusType('text'); setNewStatusFile(''); setNewStatusFileName(''); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${newStatusType === 'text' ? 'bg-[#2D5CFE] text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Text
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setNewStatusType('image'); setNewStatusFile(''); setNewStatusFileName(''); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${newStatusType === 'image' ? 'bg-[#2D5CFE] text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Photo
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setNewStatusType('video'); setNewStatusFile(''); setNewStatusFileName(''); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${newStatusType === 'video' ? 'bg-[#2D5CFE] text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Video
                      </button>
                    </div>
                  </div>

                  {newStatusType === 'text' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          placeholder="Write brief status..."
                          value={newStatusText}
                          onChange={(e) => setNewStatusText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newStatusText.trim()) {
                              handlePublishTextStatus(newStatusText);
                              setNewStatusText("");
                            }
                          }}
                          className="flex-1 bg-[#050505] border border-white/5 px-3 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-[#2D5CFE]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newStatusText.trim()) {
                              handlePublishTextStatus(newStatusText);
                              setNewStatusText("");
                            }
                          }}
                          className="px-3 bg-[#2D5CFE] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input 
                          type="file" 
                          accept={newStatusType === 'image' ? "image/*" : "video/*"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewStatusFileName(file.name);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewStatusFile(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" 
                          id="status-media-upload"
                        />
                        <label 
                          htmlFor="status-media-upload"
                          className="py-1.5 px-3 bg-[#2D5CFE] hover:bg-blue-600 transition text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center shadow-lg shadow-blue-950/20"
                        >
                          Choose {newStatusType === 'image' ? 'Photo' : 'Video'} File
                        </label>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                          {newStatusFileName || "No file selected"}
                        </span>
                      </div>

                      {newStatusFile && (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Add caption..." 
                            value={newStatusText}
                            onChange={(e) => setNewStatusText(e.target.value)}
                            className="w-full bg-[#050505] border border-white/5 px-3 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-[#2D5CFE]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handlePublishFileStatus(newStatusType as 'image' | 'video', newStatusFile, newStatusText);
                              setNewStatusFile('');
                              setNewStatusFileName('');
                              setNewStatusText('');
                            }}
                            className="w-full py-1.5 bg-[#2D5CFE] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition"
                          >
                            Share Status Story
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Recent updates feeds</h4>
                  
                  {statuses
                    .filter(st => st.userId === currentUser?.id || chats.some(c => c.participantId === st.userId))
                    .map((st) => (
                      <div 
                        key={st.id}
                        onClick={() => setActiveStatusViewer(st)}
                        className="p-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer transition select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {st.userAvatar ? (
                              <img src={st.userAvatar} className="w-10 h-10 rounded-full object-cover border-2 border-[#2D5CFE]" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-xs border border-white/5">
                                {st.userName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute inset-0 rounded-full border border-[#2D5CFE] border-dashed animate-spin delay-200" />
                          </div>

                          <div>
                            <p className="text-xs font-bold text-white">{st.userName}</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] bg-zinc-800 border border-white/5 text-[#2D5CFE] px-2.5 py-0.5 rounded-full uppercase font-bold text-center">
                          Open
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4. CONTACTS TAB */}
            {activeTab === 'contacts' && (
              <div className="space-y-1.5 text-left">
                {/* Add contact modal display */}
                {showAddContact && (
                  <form onSubmit={handleAddContact} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left space-y-3 mb-2 animate-bounce">
                    <div className="flex justify-between items-center text-[11px] font-black tracking-widest uppercase text-slate-400 border-b border-slate-800 pb-1">
                      <span>Add custom Nexus ID</span>
                      <button type="button" onClick={() => setShowAddContact(false)} className="text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {errorContact && (
                      <p className="text-[9px] text-rose-400 font-mono leading-none">{errorContact}</p>
                    )}

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-400 font-semibold mb-1 block">Nexus ID Numbers</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +0982715"
                          value={contactIdInput}
                          onChange={(e) => setContactIdInput(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-400 font-semibold mb-1 block">Custom Nickname (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Mike Wheeler"
                          value={contactNameInput}
                          onChange={(e) => setContactNameInput(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 transition rounded-lg text-white text-xs font-bold"
                    >
                      Establish Connection Securely
                    </button>
                  </form>
                )}

                {/* Contacts roster index */}
                {chats.map((cont) => (
                  <div 
                    key={cont.id}
                    onClick={() => {
                      setSelectedChatId(cont.id);
                      setActiveTab('chats');
                    }}
                    className="p-3 bg-slate-900/20 border border-slate-900 hover:bg-slate-900/35 rounded-2xl flex justify-between items-center cursor-pointer transition relative group"
                  >
                    <div className="flex items-center gap-3">
                      {cont.avatar ? (
                        <img src={cont.avatar} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#2D5CFE] font-bold text-xs border border-white/5">
                          {cont.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{cont.name}</p>
                        <p className="text-[9px] font-mono text-[#2D5CFE] mt-1">{cont.participantId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactToDelete(cont);
                        }}
                        className="p-1.5 hover:bg-red-950/40 text-slate-500 hover:text-red-500 rounded-lg transition"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 font-mono italic">Quick message</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. SETTINGS TAB - SHORTCUT VIEW */}
            {activeTab === 'settings' && (
              <div className="p-3 bg-slate-900/10 rounded-2xl text-center space-y-4">
                <Settings className="w-12 h-12 text-slate-705 mx-auto animate-spin delay-1000" />
                <p className="text-xs text-slate-400 leading-normal">
                  To customize visual parameters, languages, or synchrony locks, expand settings directly in the workspace pane!
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-left text-[11px] font-mono whitespace-pre text-cyan-400">
                  <span>ID: {currentUser.id}</span>{"\n"}
                  <span>Alias: {currentUser.name}</span>{"\n"}
                  <span>E2E Token Status: Active</span>
                </div>
              </div>
            )}

          </div>

          {/* Footer operational status indicator */}
          <div className="p-3 bg-slate-900/60 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500 px-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>STABLE CHANNEL</span>
            </span>
            <span>v1.0.8p</span>
          </div>

        </div>

        {/* Right Workspace Side: Chat panels OR complete Settings boards */}
        <div className="flex-1 min-w-0 h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'settings' ? (
              <SettingsPanel 
                userProfile={currentUser}
                langSet={langSet}
                activeLanguage={activeLanguage}
                onUpdateProfile={handleUpdateProfile}
                onBackupCloud={handleForceBackupCloud}
                onRestoreCloud={handleForceRestoreCloud}
                onSignOut={handleSignOut}
                blockedUsersList={blockedUsers}
                onUnblockUser={(id) => handleUpdateProfile({ blockedUsers: blockedUsers.filter(b => b !== id) })}
              />
            ) : selectedChat ? (
              <ChatPanel 
                chat={selectedChat}
                messages={selectedChatMessages}
                currentUserId={currentUser.id}
                langSet={langSet}
                typingIndicator={typingIndicator}
                uploadQuality={uploadQuality}
                readReceipts={readReceipts}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                onToggleStarMessage={handleToggleStarMessage}
                onClearChat={() => {
                  setMessages(prev => prev.filter(m => m.chatId !== selectedChatId));
                  triggerToast("WIPED HISTORY", "Chat history logs destroyed locally.", "🧹");
                }}
                onMuteChat={() => {
                  const isMuted = mutedChats.includes(selectedChat.id);
                  const updated = isMuted ? mutedChats.filter(c => c !== selectedChat.id) : [...mutedChats, selectedChat.id];
                  handleUpdateProfile({ mutedChats: updated });
                }}
                onLockChat={() => {
                  const isLocked = lockedChats.includes(selectedChat.id);
                  const updated = isLocked ? lockedChats.filter(c => c !== selectedChat.id) : [...lockedChats, selectedChat.id];
                  handleUpdateProfile({ lockedChats: updated });
                }}
                onArchiveChat={() => {
                  handleToggleArchived(selectedChat.id);
                  setSelectedChatId(null);
                }}
                onPlaceCall={handlePlaceCall}
                onDeleteContact={(cid) => {
                  const ch = chats.find(c => c.id === cid);
                  if (ch) setContactToDelete(ch);
                }}
              />
            ) : (
              // Empty visual workspace landing card bento
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-700 mb-6 shadow-inner">
                  <MessageSquareCode className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase">Nexus Digital Workspace</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm leading-normal">
                  Claim virtual, SIM-free +0 identifiers. Chat end-to-end encrypted with satellites, create secure cloud backups, and talk with automatic smart agent nodes seamlessly.
                </p>

                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-900 text-left max-w-xs space-y-2 mt-8 text-[11px] font-mono">
                  <p className="text-indigo-400 font-bold uppercase flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Logged Session Node</span>
                  </p>
                  <p className="text-slate-300">Nexus ID: {currentUser.id}</p>
                  <p className="text-slate-300">Alias: {currentUser.name}</p>
                  <p className="text-slate-400">Security Sync: Stable satellite encryption</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* OVERLAY SECTIONS IN GLOBAL PORTALS */}

      {/* 1. Voice and Video Calling active connection Overlay screen */}
      {activeCall && (
        <VoiceVideoOverlay 
          session={activeCall}
          onHangup={handleHangupCall}
          onAccept={handleAcceptCall}
          langSet={langSet}
        />
      )}

      {/* 2. Status Story viewer element */}
      {activeStatusViewer && (
        <StatusViewer 
          status={activeStatusViewer}
          onClose={() => setActiveStatusViewer(null)}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          onStatusReply={(uid, msg) => {
            triggerToast("STATUS FEEDBACK", "Your reply reference was sent successfully inside chats!", "💬");
            // Also append simulated message in recipient's chat panel dynamically!
            const targetChat = chats.find(c => c.participantId === uid);
            if (targetChat) {
              const replyMsg: Message = {
                id: `m-stat-reply-${Date.now()}`,
                chatId: targetChat.id,
                senderId: currentUser.id,
                senderName: currentUser.name,
                type: 'text',
                content: msg,
                seen: false,
                delivered: true,
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, replyMsg]);
            }
          }}
          onMuteUser={handleStatusMuteToggle}
        />
      )}

      {/* 3. PIN Lock Verification Overlay (secure vault checks) */}
      <AnimatePresence>
        {isAppLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="w-12 h-12 rounded-full bg-[#2D5CFE]/10 flex items-center justify-center mx-auto mb-4 text-[#2D5CFE]">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>

              <h4 className="text-white font-bold tracking-tight">VAULT PIN REQUIRED</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-1.5 px-3">
                This Nexus Chat node is encrypted. Enter validation PIN to authenticate access logic (Default: 1234).
              </p>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (lockCodeInput === lockPinCode) {
                    if (unresolvedLockChatId) {
                      setSelectedChatId(unresolvedLockChatId);
                    }
                    setIsAppLocked(false);
                    setLockCodeInput("");
                    setUnresolvedLockChatId(null);
                    triggerToast("VAULT OPENED", "Dynamic chat block decrypted.", "🔓");
                  } else {
                    triggerToast("SECURITY DETECTED", "Invalid validator PIN. Password recovery lock active.", "🚫");
                    setLockCodeInput("");
                  }
                }}
                className="mt-4 space-y-4"
              >
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={lockCodeInput}
                  onChange={(e) => setLockCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full text-center py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xl tracking-widest text-white focus:outline-none focus:border-[#2D5CFE]"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAppLocked(false);
                      setLockCodeInput("");
                      setUnresolvedLockChatId(null);
                    }}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-[#2D5CFE] hover:bg-[#1A3BB0] text-white rounded-xl text-xs font-semibold"
                  >
                    Decrypt
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Delete Contact Confirmation Portal Overlay */}
      <AnimatePresence>
        {contactToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-sm bg-zinc-950 border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-5 h-5 animate-pulse" />
              </div>

              <div className="text-center">
                <h4 className="text-white font-bold tracking-tight">DELETE CONTACT RELATION</h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed px-1">
                  Are you sure you want to delete contact <span className="text-white font-semibold">{contactToDelete.name}</span> ({contactToDelete.participantId})?
                  This action permanently terminates the link, purging all associated local message streams and settings.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setContactToDelete(null)}
                  className="flex-1 py-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-slate-300 rounded-xl text-xs font-semibold font-sans transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const chatId = contactToDelete.id;
                    const updatedChats = chats.filter(c => c.id !== chatId);
                    const updatedMsgs = messages.filter(m => m.chatId !== chatId);

                    setChats(updatedChats);
                    setMessages(updatedMsgs);

                    if (selectedChatId === chatId) {
                      setSelectedChatId(null);
                    }

                    if (currentUser) {
                      saveCacheInstantly(currentUser.id, updatedChats, updatedMsgs, calls, statuses);
                      
                      // Background cloud backup integration
                      fetch("/api/sync/backup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          nexusId: currentUser.id,
                          profile: currentUser,
                          chats: updatedChats,
                          messages: updatedMsgs,
                          statuses,
                          calls
                        })
                      }).catch(() => {});
                    }

                    triggerToast("CONTACT REMOVED", `Contact "${contactToDelete.name}" vanished from networks.`, "🗑️");
                    setContactToDelete(null);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold font-sans transition shadow-lg shadow-red-950/20"
                >
                  Delete permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
