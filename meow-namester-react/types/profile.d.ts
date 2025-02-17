interface NameRating {
  id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  updated_at: string;
}

interface AggregatedStats {
  [key: string]: {
    avgRating: number;
    totalRatings: number;
    totalWins: number;
    totalLosses: number;
  };
}

export interface User {
  id: string;
  name: string;
  ratingsCount: number;
  averageRating: number;
  lastActive: string;
  isActive: boolean;
  sessionTime?: string;
  completionRate?: string;
}

export interface AdminDashboardProps {
  userName: string;
  users: User[];
  onUserAction: (action: 'view' | 'export' | 'delete', user: User) => void;
  onRefreshData: () => void;
  allUsersRatings: Record<string, Rating[]>;
}

export interface Rating {
  id: string;
  rating: number;
  timestamp: string;
} 