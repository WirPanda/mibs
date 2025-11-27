export interface UserDirectoryEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  blockedAt?: string;
  notes?: string;
  temporaryPassword?: string;
}
