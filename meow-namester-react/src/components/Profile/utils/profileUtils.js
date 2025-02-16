export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export const getWinRate = (wins, losses) => 
  Math.round((wins / (wins + losses || 1)) * 100);

export const isUserActive = (lastActivity) => {
  if (!lastActivity) return false;
  return Date.now() - new Date(lastActivity).getTime() < 1000 * 60 * 15;
};

export const formatLastActive = (timestamp) => {
  if (!timestamp) return 'Never active';
  
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes/60)}h ago`;
}; 