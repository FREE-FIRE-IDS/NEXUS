/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string; // Nexus ID, e.g., "+0764294"
  name: string;
  bio: string;
  avatar: string; // Base64 or local placeholder URL
  password?: string;
  registeredAt: string;
  
  // Settings
  theme: 'light' | 'dark' | 'amoled';
  accentColor: string; // Tailwind color class or hex
  bubbleColor: string; // Tailind background color class
  wallpaper: string; // Preset name or pattern
  language: string;

  // Privacy Settings
  lastSeenSetting: 'everyone' | 'contacts' | 'nobody';
  onlineSetting: 'everyone' | 'nobody';
  dpSetting: 'everyone' | 'contacts' | 'nobody';
  bioSetting: 'everyone' | 'contacts' | 'nobody';
  statusPrivacy: 'everyone' | 'contacts' | 'hide_selected' | 'share_selected';
  statusPrivacySelected: string[]; // nexusIds
  readReceipts: boolean;
  typingIndicator: boolean;

  // Storage and Media
  uploadQuality: 'hd' | 'standard' | 'low';
  autoDownload: {
    photos: 'never' | 'wifi' | 'cellular_wifi';
    videos: 'never' | 'wifi' | 'cellular_wifi';
    audio: 'never' | 'wifi' | 'cellular_wifi';
    documents: 'never' | 'wifi' | 'cellular_wifi';
  };

  // Chat items
  blockedUsers: string[]; // Nexus IDs
  archivedChats: string[]; // Chat IDs
  lockedChats: string[]; // Chat IDs
  mutedChats: string[]; // Chat IDs
  pinnedChats: string[]; // Chat IDs
  starredMessages: string[]; // Message IDs
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // Nexus IDs of users who voted
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'gif' | 'contact' | 'poll' | 'location';
  content: string; // Message content or caption
  mediaUrl?: string; // Image/video/audio base64 URL or relative path
  fileName?: string;
  fileSize?: string;
  duration?: number; // for audio voice messages in seconds
  poll?: Poll;
  reactions?: { [userId: string]: string }; // Map of userId -> emoji character
  seen: boolean;
  delivered: boolean;
  replyToMessage?: {
    id: string;
    senderName: string;
    content: string;
    type: string;
  };
  isStarred?: boolean;
  timestamp: string; // ISO 8601 string
  edited?: boolean;
}

export interface Chat {
  id: string;
  participantId: string; // User ID of the other user (virtual ID)
  name: string;
  avatar: string;
  bio: string;
  online: boolean;
  lastSeen?: string;
  typing?: boolean;
  unreadCount: number;
  lastMessage?: {
    content: string;
    type: string;
    timestamp: string;
    senderId: string;
    seen: boolean;
  };
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image' | 'video';
  content: string; // Used for text content or status caption
  mediaUrl?: string; // base64 URL
  textBg?: string; // Tailwind class
  timestamp: string; // ISO string (must delete after 24 hours, simulated)
  views: {
    userId: string;
    userName: string;
    timestamp: string;
    reaction?: string;
  }[];
}

export interface CallRecord {
  id: string;
  userId: string; // user dialled or who dialled
  userName: string;
  userAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration: number; // in seconds
  status: 'connected' | 'missed' | 'rejected' | 'busy';
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: string[]; // Emoji or small SVGs / image urls
}
