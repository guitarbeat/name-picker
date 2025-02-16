export const SORT_CONFIG = {
  individual: [
    { key: 'rating', label: 'Rating' },
    { key: 'name', label: 'Name' },
    { key: 'wins', label: 'Wins' },
    { key: 'losses', label: 'Losses' },
    { key: 'updated_at', label: 'Last Updated' }
  ],
  aggregated: [
    { key: 'avgRating', label: 'Average Rating' },
    { key: 'totalRatings', label: 'Times Rated' },
    { key: 'name', label: 'Name' },
    { key: 'totalWins', label: 'Total Wins' },
    { key: 'totalLosses', label: 'Total Losses' }
  ],
  users: [
    { key: 'username', label: 'Username' },
    { key: 'lastActive', label: 'Last Active' },
    { key: 'ratingCount', label: 'Ratings Count' }
  ]
};

export const INITIAL_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: true, text: 'Rating Comparison' }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: { display: true, text: 'Rating' }
    }
  }
}; 