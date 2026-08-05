export type BillStatus = 'draft' | 'under_review' | 'needs_revision' | 'approved' | 'rejected';

export type AccessPermission = 'read' | 'edit';

export type AppTheme = 'dark' | 'light';

export type OfficialRole = 'civilian' | 'prosecutor' | 'judge' | 'governor' | 'admin';

export const OFFICIAL_ROLE_LABELS: Record<OfficialRole, string> = {
  civilian: 'Гражданин / Инициатор',
  prosecutor: '⚖️ Генеральный прокурор',
  judge: '🏛️ Председатель Верховного суда',
  governor: '📜 Губернатор',
  admin: '👑 Системный Администратор (Федеральное Правительство)'
};

export type VoteDecision = 'approved' | 'rejected' | 'needs_revision';

export interface CommissionVotes {
  prosecutor?: VoteDecision;
  judge?: VoteDecision;
  governor?: VoteDecision;
}

export interface FederalGovernmentVerdict {
  status: VoteDecision;
  reason: string;
  updatedAt: string;
  adminName: string;
}

export interface ComparisonRow {
  id: string;
  articleTitle: string;
  wasContent: string;
  becameContent: string;
  notes?: string;
}

export interface BillComment {
  id: string;
  billId: string;
  authorName: string;
  authorRole?: string;
  content: string;
  createdAt: string;
  articleId?: string;
}

export interface AccessLink {
  id: string;
  token: string;
  permission: AccessPermission;
  label: string;
  createdAt: string;
  expiresAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: string;
  details: string;
  hash: string;
}

export interface Bill {
  id: string;
  title: string;
  targetLaw: string;
  lawCode?: string;
  author: string;
  authorRole: string;
  status: BillStatus;
  statusReason?: string;
  explanatoryNote: string;
  comparisons: ComparisonRow[];
  shareTokens: AccessLink[];
  comments: BillComment[];
  votes?: CommissionVotes;
  federalVerdict?: FederalGovernmentVerdict;
  sha256Hash?: string; // Криптографический отпечаток целостности документа
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

export interface RolePinRegistry {
  prosecutor: string;
  judge: string;
  governor: string;
  adminCode: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  officialRole: OfficialRole;
  isOfficialVerified: boolean;
  department: string;
  avatarUrl?: string;
  emblemUrl?: string;
}

export interface DbConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
}
