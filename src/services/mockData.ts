import type { UserProfile } from '../types/bill';

export const INITIAL_USER: UserProfile = {
  id: 'usr_001',
  firstName: 'Александр',
  lastName: 'Северов',
  officialRole: 'civilian',
  isOfficialVerified: false,
  department: 'Законодательный Портал Инициатив'
};

// Clean default DB - No demo bills!
export const INITIAL_BILLS = [];
