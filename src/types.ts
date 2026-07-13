/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppUser {
  id: string;
  displayId?: string;
  originalDisplayId?: string;
  displayIdExpiredAt?: string | null;
  name: string;
  avatar: string;
  level: number;
  coins: number;
  xp: number;
  isAgent?: boolean;
  whatsapp?: string;
  role?: 'user' | 'agent' | 'admin' | 'agency_owner' | 'authorized_coin_agent';
  agent_coin_inventory?: number;
  bio?: string;
  followers?: string[];
  following?: string[];
  gender?: 'male' | 'female' | null;
  birthdate?: string | null;
  country?: string;
  clanId?: string;
  agencyId?: string;
  agencyName?: string;
  senderXp?: number;
  charmXp?: number;
  badges?: string[];
  vipLevel?: number;
  diamonds?: number;
  lockedDiamonds?: number;
  phone?: string;
  email?: string;
  createdAt?: string;
}

export interface Clan {
  clanId: string;
  clanName: string;
  clanLogo: string;
  ownerId: string;
  totalXp: number;
}

export interface Badge {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  unlockCriteria: string;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: string;
  isEncrypted?: boolean;
  rawCiphertext?: string;
  iv?: string;
  isRead?: boolean;
}

export interface VoiceSeat {
  index: number; // 0 = Host, 1 to 8 = Guests
  userId: string | null; // null if seat is empty
  isMuted: boolean;
  isLocked: boolean;
}

export interface VoiceRoom {
  id: string;
  name: string;
  hostName: string;
  hostAvatar: string;
  isPrivate: boolean;
  password?: string;
  level: number;
  xp: number;
  activeUsersCount: number;
  seats: VoiceSeat[];
  owner_id?: string;
}

export interface AgentTransferLog {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  timestamp: string;
}

export interface Gift {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  cost: number;
  xpReward: number;
  isPremium: boolean;
}

export interface BlueprintFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: FolderNode[];
  contentKey?: string;
}
