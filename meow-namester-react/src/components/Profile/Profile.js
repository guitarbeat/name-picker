import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';
import { supabase, deleteName } from '../../supabase/supabaseClient';
import { 
  SortControls,
  DeleteConfirmationModal,
  BarChart,
  PieChart,
  VisibilityToggle,
  RatingStats,
  DeleteButton,
  AdminUserCard,
  SortIndicator
} from './components';
import { 
  formatDate,
  getWinRate,
  isUserActive
} from './utils/profileUtils';
import { 
  SORT_CONFIG,
  INITIAL_CHART_OPTIONS
} from './constants';
import styles from './Profile.module.css';
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LineController, 
  LineElement, 
  PointElement, 
  LinearScale, 
  CategoryScale,
  Title,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  RadarController,
  RadialLinearScale
} from 'chart.js';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import CalendarButton from '../CalendarButton/CalendarButton';
import ProfileStats from './components/ProfileStats';
import AdminUserCardComponent from './components/AdminUserCard';

// Register Chart.js components
ChartJS.register(
  LineController,
  LineElement,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  RadarController,
  RadialLinearScale
);

const getChartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    title: { 
      display: true, 
      text: title,
      padding: { top: 10, bottom: 15 }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: { display: true, text: 'Value' },
      min: 1000,
      max: 3000,
      ticks: { stepSize: 500 }
    },
    x: {
      ticks: {
        autoSkip: true,
        maxRotation: 45,
        minRotation: 45
      }
    }
  }
});

function Profile({ userName, onStartNewTournament }) {
  const [ratings, setRatings, { loading, error }] = useSupabaseStorage('cat_name_ratings', [], userName);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsersRatings, setAllUsersRatings] = useState([]);
  const [selectedUser, setSelectedUser] = useState(userName);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [hiddenNames, setHiddenNames] = useState(new Set());
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'aggregated'
  const [aggregatedStats, setAggregatedStats] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'avgRating', direction: 'desc' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null });
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteNameConfirm, setShowDeleteNameConfirm] = useState(false);
  const [nameToDelete, setNameToDelete] = useState(null);
  const [deleteNameStatus, setDeleteNameStatus] = useState({ loading: false, error: null });
  const [userLastActivity, setUserLastActivity] = useState({});
  const [sortUsersConfig, setSortUsersConfig] = useState({ 
    key: 'username', 
    direction: 'desc' 
  });
  const [isAdminPanelMinimized, setIsAdminPanelMinimized] = useState(false);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [chartOptions, setChartOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Rating Comparison'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Rating'
        }
      }
    }
  });
  const [activeCharts, setActiveCharts] = useState({
    ratingComparison: true,
    winLossRatio: true,
    ratingDistribution: false
  });

  const USER_SORT_OPTIONS = [
    { key: 'username', label: 'Username' },
    { key: 'lastActive', label: 'Last Active' },
    { key: 'ratingCount', label: 'Ratings Count' }
  ];

  const chartToggles = [
    { key: 'ratingComparison', label: 'Rating Comparison' },
    { key: 'winLossRatio', label: 'Win/Loss Ratio' },
    { key: 'ratingDistribution', label: 'Rating Distribution' }
  ];

  const fetchAllUsersRatings = useCallback(async () => {
    try {
      setLoadingAllUsers(true);
      
      const { data, error } = await supabase
        .from('cat_name_ratings')
        .select(`
          rating,
          wins,
          losses,
          user_name,
          updated_at,
          name_options!inner(id, name, description)
        `)
        .not('name_options.id', 'is', null);

      if (error) throw error;

      // Track last activity per user
      const lastActivity = {};
      data.forEach(item => {
        if (!lastActivity[item.user_name] || new Date(item.updated_at) > new Date(lastActivity[item.user_name])) {
          lastActivity[item.user_name] = item.updated_at;
        }
      });
      setUserLastActivity(lastActivity);

      // Process individual user ratings
      const ratingsByUser = data.reduce((acc, item) => {
        if (!item.name_options) return acc; // Skip if name has been deleted
        
        const userName = item.user_name;
        if (!acc[userName]) {
          acc[userName] = [];
        }
        
        const ratingEntry = {
          id: item.name_options.id,
          name: item.name_options.name,
          description: item.name_options.description,
          rating: item.rating,
          wins: item.wins,
          losses: item.losses,
          updated_at: item.updated_at // Ensure we're including the timestamp
        };
        
        acc[userName].push(ratingEntry);
        return acc;
      }, {});

      // Calculate aggregated statistics
      const aggregatedStats = {};
      Object.values(ratingsByUser).forEach(userRatings => {
        userRatings.forEach(rating => {
          if (!aggregatedStats[rating.id]) {
            aggregatedStats[rating.id] = {
              id: rating.id,
              name: rating.name,
              description: rating.description,
              ratings: [],
              totalWins: 0,
              totalLosses: 0,
              uniqueUsers: new Set(),
            };
          }
          
          const stats = aggregatedStats[rating.id];
          stats.ratings.push(rating.rating || 1500);
          stats.totalWins += rating.wins || 0;
          stats.totalLosses += rating.losses || 0;
          stats.uniqueUsers.add(rating.user_name);
        });
      });

      // Calculate final aggregated metrics
      Object.values(aggregatedStats).forEach(stats => {
        stats.avgRating = Math.round(
          stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length
        );
        stats.minRating = Math.round(Math.min(...stats.ratings));
        stats.maxRating = Math.round(Math.max(...stats.ratings));
        stats.totalRatings = stats.ratings.length;
        stats.uniqueUsers = stats.uniqueUsers.size;
        delete stats.ratings; // Clean up the temporary ratings array
      });

      setAllUsersRatings(ratingsByUser);
      setAggregatedStats(aggregatedStats);
    } catch (err) {
      console.error('Error fetching all users ratings:', err);
      setToast({
        show: true,
        message: `Error fetching ratings: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoadingAllUsers(false);
    }
  }, []);

  useEffect(() => {
    setIsAdmin(userName.toLowerCase() === 'aaron');
    if (isAdmin) fetchAllUsersRatings();
  }, [userName, isAdmin, fetchAllUsersRatings]);

  const fetchHiddenNames = async () => {
    const { data, error } = await supabase.from('hidden_names').select('name_id');
    if (error) {
      setToast({ show: true, message: `Error fetching hidden names: ${error.message}`, type: 'error' });
    } else {
      setHiddenNames(new Set(data?.map(item => item.name_id) || []));
    }
  };

  const handleToggleNameVisibility = async (nameId) => {
    const isHidden = hiddenNames.has(nameId);
    if (!window.confirm(`Are you sure you want to ${isHidden ? 'show' : 'hide'} this name?`)) return;

    const { error } = isHidden 
      ? await supabase.from('hidden_names').delete().eq('name_id', nameId)
      : await supabase.from('hidden_names').insert([{ name_id: nameId }]);

    if (error) {
      setToast({ show: true, message: `Error toggling name visibility: ${error.message}`, type: 'error' });
    } else {
      setHiddenNames(prev => {
        const newHiddenNames = new Set(prev);
        isHidden ? newHiddenNames.delete(nameId) : newHiddenNames.add(nameId);
        return newHiddenNames;
      });
      setToast({ show: true, message: `Name ${isHidden ? 'shown' : 'hidden'} successfully`, type: 'success' });
    }
  };

  const handleSort = (type, key) => {
    const isSameKey = sortConfig.key === key;
    const direction = isSameKey && sortConfig.direction === 'desc' ? 'asc' : 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedAggregatedStats = useMemo(() => {
    const stats = Object.values(aggregatedStats).sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * modifier;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return 0;
    });

    return {
      active: stats.filter(stat => !hiddenNames.has(stat.id)),
      hidden: stats.filter(stat => hiddenNames.has(stat.id))
    };
  }, [aggregatedStats, sortConfig, hiddenNames]);

  const handleDeleteUser = async (userNameToDelete) => {
    if (!isAdmin) return;
    
    try {
      setDeleteStatus({ loading: true, error: null });
      
      // Delete user's ratings
      const { error: ratingsError } = await supabase
        .from('cat_name_ratings')
        .delete()
        .eq('user_name', userNameToDelete);
      
      if (ratingsError) throw ratingsError;

      // Delete user's tournament progress
      const { error: progressError } = await supabase
        .from('tournament_progress')
        .delete()
        .eq('user_name', userNameToDelete);
      
      if (progressError) throw progressError;

      // Refresh data
      await fetchAllUsersRatings();
      
      // Reset state
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setDeleteStatus({ loading: false, error: null });

      // If the deleted user was selected, reset to admin's view
      if (selectedUser === userNameToDelete) {
        setSelectedUser(userName);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteStatus({ loading: false, error: err.message });
    }
  };

  const copyResultsToClipboard = () => {
    const sortedNames = [...ratings]
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
      .map(name => name.name)
      .join('\n');

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });

    const textToCopy = `Title: ${formattedDate} Cat Names 🐈‍⬛\nDescription: Cat Name Tournament Results\n\n${sortedNames}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setToast({
        show: true,
        message: 'Results copied to clipboard!',
        type: 'success'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    });
  };

  const handleDeleteName = async (nameId, name) => {
    try {
      setDeleteNameStatus({ loading: true, error: null });
      
      const { error } = await deleteName(nameId);
      if (error) throw error;

      // Refresh both user data and ratings
      await Promise.all([
        fetchAllUsersRatings(),
        fetchHiddenNames(),
        setRatings(prev => prev.filter(r => r.id !== nameId))
      ]);

      setDeleteNameStatus({ loading: false, error: null });
      setShowDeleteNameConfirm(false);
    } catch (err) {
      setDeleteNameStatus({ loading: false, error: err.message });
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never active';
    
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes/60)}h ago`;
  };

  const isAdminUser = (user) => {
    return user === 'admin' || user.endsWith('@admin'); // Update with your admin check
  };

  const currentRatings = isAdmin && selectedUser !== userName 
    ? allUsersRatings[selectedUser] || []
    : ratings;

  const totalNames = currentRatings.length;
  const averageRating = totalNames > 0 
    ? Math.round(currentRatings.reduce((sum, r) => sum + (r.rating || 1500), 0) / totalNames) 
    : 0;
  const totalMatches = currentRatings.reduce((sum, r) => sum + (r.wins || 0) + (r.losses || 0), 0);
  
  const sortedCurrentRatings = useMemo(() => {
    if (!currentRatings || currentRatings.length === 0) return [];
    
    return [...currentRatings].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * modifier;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      // Handle dates
      if (sortConfig.key === 'updated_at') {
        const dateA = new Date(aValue || 0);
        const dateB = new Date(bValue || 0);
        return (dateA - dateB) * modifier;
      }
      return 0;
    });
  }, [currentRatings, sortConfig]);

  useEffect(() => {
    setSortConfig({
      key: viewMode === 'individual' ? 'rating' : 'avgRating',
      direction: 'desc'
    });
  }, [viewMode]);

  const getSortValue = (user) => {
    switch(sortUsersConfig.key) {
      case 'lastActive': 
        return new Date(userLastActivity[user]).getTime();
      case 'ratingCount':
        return allUsersRatings[user]?.length || 0;
      default: 
        return user.toLowerCase();
    }
  };

  const sortedUsers = useMemo(() => {
    return Object.keys(allUsersRatings).sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);
      return sortUsersConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [allUsersRatings, sortUsersConfig, userLastActivity]);

  const handleUserSort = (key) => {
    setSortUsersConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleAdminPanel = () => {
    setIsAdminPanelMinimized(prev => !prev);
  };

  // Add useEffect to initialize user sorting
  useEffect(() => {
    if (isAdmin) {
      setSortUsersConfig({ key: 'lastActive', direction: 'desc' });
    }
  }, [isAdmin]);

  // Update chart data effect
  useEffect(() => {
    if (viewMode === 'individual') {
      const visibleRatings = currentRatings
        .filter(r => !hiddenNames.has(r.id))
        .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
        .slice(0, 15); // Limit to top 15 names

      setChartData({
        labels: visibleRatings.map(r => r.name),
        datasets: [{
          label: 'Rating',
          data: visibleRatings.map(r => r.rating || 1500),
          backgroundColor: '#4BC0C0',
          borderColor: '#4BC0C0',
          borderWidth: 1
        }]
      });
    } else {
      const sortedStats = Object.values(aggregatedStats)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 15);

      setChartData({
        labels: sortedStats.map(stat => stat.name),
        datasets: [{
          label: 'Average Rating',
          data: sortedStats.map(stat => stat.avgRating),
          backgroundColor: '#9966FF',
          borderColor: '#9966FF',
          borderWidth: 1
        }]
      });
    }
  }, [currentRatings, hiddenNames, viewMode, aggregatedStats]);

  // Add new chart data generators
  const getWinLossData = useCallback(() => {
    const data = viewMode === 'individual' ? 
      currentRatings.map(r => ({ wins: r.wins || 0, losses: r.losses || 0 })) :
      Object.values(aggregatedStats).map(s => ({ wins: s.totalWins, losses: s.totalLosses }));
      
    return {
      labels: viewMode === 'individual' ? 
        currentRatings.map(r => r.name) :
        Object.values(aggregatedStats).map(s => s.name),
      datasets: [{
        label: 'Wins',
        data: data.map(d => d.wins),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }, {
        label: 'Losses',
        data: data.map(d => d.losses),
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      }]
    };
  }, [currentRatings, aggregatedStats, viewMode]);

  const getRatingDistributionData = useCallback(() => {
    const ratings = viewMode === 'individual' ?
      currentRatings.map(r => r.rating) :
      Object.values(aggregatedStats).flatMap(s => 
        Array(s.totalRatings).fill(s.avgRating)
      );
      
    const ranges = Array.from({ length: 5 }, (_, i) => {
      const min = 1000 + i * 200;
      const max = 1200 + i * 200;
      return {
        label: `${min}-${max}`,
        count: ratings.filter(r => r >= min && r < max).length
      };
    });

    return {
      labels: ranges.map(r => r.label),
      datasets: [{
        data: ranges.map(r => r.count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
        ]
      }]
    };
  }, [currentRatings, aggregatedStats, viewMode]);

  // Reusable data formatting
  const formatChartData = (labels, dataset) => ({
    labels,
    datasets: [{
      ...chartOptions.datasets[0],
      data: dataset
    }]
  });

  // Generic list renderers
  const renderSortControls = (type) => (
    <div className={styles.sortControls}>
      {SORT_CONFIG[type].map(({ key, label }) => (
        <SortControls
          key={key}
          label={label}
          active={sortConfig.key === key}
          direction={sortConfig.direction}
          onClick={() => handleSort(type, key)}
        />
      ))}
    </div>
  );

  const renderChartToggles = () => (
    <div className={styles.chartControls}>
      {chartToggles.map(({ key, label }) => (
        <div
          key={key}
          className={`${styles.chartToggle} ${activeCharts[key] ? styles.active : ''}`}
          onClick={() => setActiveCharts(prev => ({ ...prev, [key]: !prev[key] }))}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && setActiveCharts(prev => ({ ...prev, [key]: !prev[key] }))}
        >
          {label}
        </div>
      ))}
    </div>
  );

  // Simplified data preparation using existing utils
  const { activeStats, hiddenStats } = useMemo(() => ({
    activeStats: Object.values(aggregatedStats).filter(stat => !hiddenNames.has(stat.id)),
    hiddenStats: Object.values(aggregatedStats).filter(stat => hiddenNames.has(stat.id))
  }), [aggregatedStats, hiddenNames]);

  // Unified card renderer using existing component patterns
  const renderRatingCards = (names) => (
    <div className={styles.ratingsGrid}>
      {names.map(name => (
        <div key={name.id} className={styles.ratingCard}>
          <div className={styles.ratingCardHeader}>
            <h4 className={styles.name}>{name.name}</h4>
            <VisibilityToggle name={name} hiddenNames={hiddenNames} onToggle={handleToggleNameVisibility} />
          </div>
          <RatingStats rating={name.rating} wins={name.wins} losses={name.losses} />
          <DeleteButton onDelete={() => { setNameToDelete(name); setShowDeleteNameConfirm(true); }} />
        </div>
      ))}
    </div>
  );

  // Aggregated stats renderer using existing constants
  const renderAggregatedStats = (stats) => (
    <div className={styles.aggregatedStatsGrid}>
      {stats.map(stat => (
        <AggregatedStatCard
          key={stat.id}
          stat={stat}
          hiddenNames={hiddenNames}
          onToggleVisibility={handleToggleNameVisibility}
        />
      ))}
    </div>
  );

  // Unified chart section using existing chart components
  const renderChartSection = () => (
    <div className={styles.chartGrid}>
      {activeCharts.ratingComparison && (
        <BarChart data={chartData} options={chartOptions} />
      )}
      {activeCharts.winLossRatio && (
        <BarChart 
          data={getWinLossData()} 
          options={getChartOptions('Win/Loss Comparison')} 
        />
      )}
      {activeCharts.ratingDistribution && (
        <PieChart 
          data={getRatingDistributionData()} 
          options={getChartOptions('Rating Distribution')} 
        />
      )}
    </div>
  );

  // Admin panel section using existing user utils
  const renderAdminPanel = () => (
    <aside className={styles.adminPanel}>
      <div className={`${styles.adminPanelHeader} ${isAdminPanelMinimized ? styles.minimized : ''}`}>
        <button 
          onClick={toggleAdminPanel}
          className={styles.minimizeButton}
          aria-label={isAdminPanelMinimized ? 'Expand admin panel' : 'Collapse admin panel'}
        />
      </div>
      
      {!isAdminPanelMinimized && (
        <>
          <div className={styles.viewControls}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'individual' ? styles.active : ''}`}
              onClick={() => setViewMode('individual')}
            >
              Individual View
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'aggregated' ? styles.active : ''}`}
              onClick={() => setViewMode('aggregated')}
            >
              Aggregated View
            </button>
          </div>
          <div className={styles.adminToolbar}>
            <button onClick={copyResultsToClipboard} className={styles.actionButton}>
              📋 Copy Results
            </button>
            <CalendarButton 
              rankings={currentRatings}
              userName={userName}
              hiddenNames={hiddenNames}
            />
            <button onClick={fetchAllUsersRatings} className={styles.actionButton}>
              🔄 Refresh Data
            </button>
          </div>

          {viewMode === 'individual' && (
            <div className={styles.userControls}>
              <div className={styles.sortControls}>
                <span>Sort users by:</span>
                {USER_SORT_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleUserSort(key)}
                    className={sortUsersConfig.key === key ? styles.activeSort : ''}
                  >
                    {label}
                    {sortUsersConfig.key === key && (
                      <SortIndicator direction={sortUsersConfig.direction} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.userGrid}>
            {sortedUsers.map(user => (
              <AdminUserCardComponent
                key={user}
                user={user}
                userData={allUsersRatings[user]}
                lastActive={userLastActivity[user]}
                isCurrentUser={user === userName}
                onDelete={() => {
                  setUserToDelete(user);
                  setShowDeleteConfirm(true);
                }}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );

  console.log('sortConfig:', sortConfig);
  console.log('SORT_CONFIG:', SORT_CONFIG);

  if (loading || loadingAllUsers) return (
    <div className={styles.profileContainer}>
      <LoadingSpinner size="large" />
      <p className={styles.subtitle}>Loading profile data...</p>
    </div>
  );
  
  if (error) return (
    <div className={styles.profileContainer}>
      <span className={styles.errorIcon}>⚠️</span>
      <p className={styles.subtitle}>Error loading profile: {error.message}</p>
    </div>
  );

  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <div className={styles.profileTitle}>
          <h2>
            <span className={styles.profileEmoji}>🐈‍⬛</span>
            {isAdmin ? 'Admin Dashboard' : `${userName}'s Profile`}
          </h2>
          {!isAdmin && (
            <p className={styles.profileSubtitle}>Cat Name Connoisseur</p>
          )}
        </div>

        <button 
          onClick={onStartNewTournament}
          className={styles.startTournamentButton}
        >
          <span className={styles.buttonIcon}>🏆</span>
          Start New Tournament
        </button>
      </header>

      <div className={styles.contentWrapper}>
        {viewMode === 'individual' ? (
          <>
            <SortControls 
              type="individual" 
              sortConfig={sortConfig} 
              handleSort={handleSort} 
            />
            <ProfileStats 
              totalNames={totalNames}
              totalMatches={totalMatches}
              averageRating={averageRating}
            />
            {renderRatingCards(ratings.filter(r => !hiddenNames.has(r.id)))}
          </>
        ) : (
          <AggregatedView
            activeStats={activeStats}
            hiddenStats={hiddenStats}
            sortConfig={sortConfig}
            renderStats={renderAggregatedStats}
          />
        )}
      </div>

      {renderChartSection()}
      {isAdmin && renderAdminPanel()}

      {/* Delete Name Confirmation Modal */}
      {showDeleteNameConfirm && (
        <DeleteConfirmationModal
          itemType="Name"
          itemName={nameToDelete?.name}
          onConfirm={() => handleDeleteName(nameToDelete.id, nameToDelete.name)}
          onCancel={() => setShowDeleteNameConfirm(false)}
          status={deleteNameStatus}
        />
      )}
    </div>
  );
}

export default Profile;