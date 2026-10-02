export type Role = "user" | "admin";
export type TagStyle = "bar" | "dot" | "block" | "letter";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  role: Role;
  code: string;
  tagStyle: TagStyle;
  createdAt: string;
}
export type PublicUser = Omit<User, "passwordHash">;

export interface Friendship {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface ShiftTemplate {
  id: string;
  userId: string;
  name: string;
  start: string; // HH:mm
  end: string;
  color: string; // hex
}

export interface Shift {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  templateId: string;
}

export interface Swap {
  id: string;
  requesterId: string;
  targetId: string;
  requesterShiftId: string;
  targetShiftId: string | null; // null = give away
  note: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "friend_request" | "friend_accepted" | "swap_request" | "swap_result" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface DB {
  users: User[];
  friendships: Friendship[];
  templates: ShiftTemplate[];
  shifts: Shift[];
  swaps: Swap[];
  notifications: Notification[];
}
