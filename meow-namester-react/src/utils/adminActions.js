export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // More than a day
  return date.toLocaleDateString();
};

export const calculateUserStats = (ratings) => {
  if (!ratings?.length) return {
    avgRating: 0,
    totalGames: 0,
    winRate: 0
  };
  
  const totalGames = ratings.reduce((sum, r) => sum + (r.wins + r.losses), 0);
  const totalWins = ratings.reduce((sum, r) => sum + r.wins, 0);
  
  return {
    avgRating: Math.round(
      ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) / ratings.length
    ),
    totalGames,
    winRate: totalGames ? Math.round((totalWins / totalGames) * 100) : 0
  };
}; 