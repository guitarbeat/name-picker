import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';
import { supabase, deleteName } from '../../supabase/supabaseClient';
import { Chart as ChartJS, 
  LineController, LineElement, PointElement, 
  LinearScale, CategoryScale, Title, BarController, 
  BarElement, PieController, ArcElement, 
  RadarController, RadialLinearScale 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import CalendarButton from '../CalendarButton/CalendarButton';
import styles from './Profile.module.css';
import { formatTimestamp } from '../../utils/adminActions';
import PropTypes from 'prop-types';

// Register Chart.js components
ChartJS.register(
  LineController, LineElement, BarController, BarElement,
  PieController, ArcElement, PointElement, LinearScale,
  CategoryScale, Title, RadarController, RadialLinearScale
);

// Constants and Configurations
const SORT_CONFIG = {
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
  ]
};

const TIME_FILTERS = ['All Time', 'Today', 'This Week', 'This Month'];
const DEFAULT_RATING = 1500;
const ACTIVE_THRESHOLD = 3600000; // 1 hour in milliseconds

// Reusable Components
const Button = memo(({ onClick, className, disabled, children, variant = 'default', ...props }) => (
  <button
    onClick={onClick}
    className={`${styles.button} ${styles[variant]} ${className || ''}`}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
));

const Modal = memo(({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
});

const Card = memo(({ className, children, ...props }) => (
  <div className={`${styles.card} ${className || ''}`} {...props}>
    {children}
  </div>
));

const StatsCard = memo(({ label, value, emoji }) => (
  <Card className={styles.statItem}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue}>{value}</span>
    {emoji && <span className={styles.statEmoji}>{emoji}</span>}
  </Card>
));

// Utility Functions
const calculateStats = (ratings) => {
  const totalNames = ratings.length;
  const totalMatches = ratings.reduce((sum, r) => sum + (r.wins || 0) + (r.losses || 0), 0);
  const averageRating = totalNames > 0 
    ? Math.round(ratings.reduce((sum, r) => sum + (r.rating || DEFAULT_RATING), 0) / totalNames) 
    : 0;
  
  return {
    totalNames,
    averageRating,
    totalMatches,
    winRate: totalMatches > 0 
      ? Math.round((ratings.reduce((sum, r) => sum + (r.wins || 0), 0) / totalMatches) * 100)
      : 0
  };
};

const processUserRatings = (data) => {
  const lastActivity = {};
  const ratingsByUser = {};

  data.forEach(item => {
    if (!item.name_options) return;
    
    const userName = item.user_name;
    
    // Update last activity
    if (!lastActivity[userName] || new Date(item.updated_at) > new Date(lastActivity[userName])) {
      lastActivity[userName] = item.updated_at;
    }
    
    // Process ratings
    if (!ratingsByUser[userName]) {
      ratingsByUser[userName] = [];
    }
    
    ratingsByUser[userName].push({
      id: item.name_options.id,
      name: item.name_options.name,
      description: item.name_options.description,
      rating: item.rating,
      wins: item.wins,
      losses: item.losses,
      updated_at: item.updated_at
    });
  });

  return { lastActivity, ratingsByUser };
};

// Subcomponents
const ProfileStats = memo(({ ratings }) => {
  const stats = useMemo(() => calculateStats(ratings), [ratings]);

  return (
    <div className={styles.statsContainer}>
      <StatsCard label="Total Names" value={stats.totalNames} emoji="📝" />
      <StatsCard label="Average Rating" value={stats.averageRating} emoji="⭐" />
      <StatsCard label="Total Matches" value={stats.totalMatches} emoji="🎮" />
      <StatsCard label="Win Rate" value={`${stats.winRate}%`} emoji="🏆" />
    </div>
  );
});

const NameCard = memo(({ name, isHidden, onToggleVisibility, onDelete, isAdmin }) => {
  const { name: nameText, rating = DEFAULT_RATING, wins = 0, losses = 0, updated_at } = name;

  return (
    <Card className={`${styles.nameCard} ${isHidden ? styles.isHidden : ''}`}>
      <div className={styles.nameHeader}>
        <h3 className={styles.nameTitle}>{nameText}</h3>
        <div className={styles.rating}>{rating.toLocaleString()}</div>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.record}>
          <span className={styles.wins}>{wins} wins</span>
          <span className={styles.separator}>•</span>
          <span className={styles.losses}>{losses} losses</span>
        </div>
      </div>

      {isAdmin && (
        <div className={styles.cardActions}>
          <button
            onClick={() => onToggleVisibility(name.id, nameText)}
            className={`${styles.visibilityToggle} ${isHidden ? styles.hidden : ''}`}
            aria-label={`${isHidden ? 'Show' : 'Hide'} ${nameText}`}
          >
            <span className={styles.visibilityIcon}>
              {isHidden ? '🔒' : '🔓'}
            </span>
            <span>{isHidden ? 'Hidden' : 'Hide'}</span>
          </button>
          {isHidden && (
            <button
              onClick={() => onDelete(name)}
              className={`${styles.button} ${styles.delete}`}
              aria-label={`Delete ${nameText}`}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}

      {isHidden && (
        <div className={styles.hiddenStatus}>
          <p className={styles.hiddenText}>This name is hidden from tournaments</p>
        </div>
      )}
    </Card>
  );
});

const UserCard = memo(({ user, onUserAction }) => (
  <Card className={styles.userCard}>
    <div className={styles.userInfo}>
      <span className={styles.userName}>{user.name}</span>
      <div className={styles.userStats}>
        <div className={styles.userStat}>
          <span className={styles.userStatLabel}>Names Rated</span>
          <span className={styles.userStatValue}>{user.ratingsCount}</span>
        </div>
        <div className={styles.userStat}>
          <span className={styles.userStatLabel}>Average Rating</span>
          <span className={styles.userStatValue}>{Math.round(user.averageRating)}</span>
        </div>
      </div>
      <span className={styles.lastActive}>{formatTimestamp(user.lastActive)}</span>
    </div>
    <div className={styles.userActions}>
      {['view', 'export', 'delete'].map(action => (
        <Button
          key={action}
          onClick={() => onUserAction(action, user)}
          variant={action === 'delete' ? 'delete' : 'default'}
        >
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </Button>
      ))}
    </div>
  </Card>
));

const AdminPanel = memo(({ users, onUserAction, onRefreshData }) => (
  <div className={styles.adminPanel}>
    <div className={styles.adminHeader}>
      <h2>Admin Dashboard</h2>
      <Button onClick={onRefreshData}>Refresh</Button>
    </div>
    <div className={styles.controls}>
      {TIME_FILTERS.map(filter => (
        <Button key={filter}>{filter}</Button>
      ))}
    </div>
    <div className={styles.userList}>
      {users.map(user => (
        <UserCard key={user.id} user={user} onUserAction={onUserAction} />
      ))}
    </div>
  </div>
));

const ChartSection = memo(({ aggregatedNames }) => {
  const topNames = useMemo(() => {
    return aggregatedNames.slice(0, 10);
  }, [aggregatedNames]);

  // Calculate rating distribution for pie chart
  const ratingDistribution = useMemo(() => {
    const distribution = {
      'Elite (1800+)': 0,
      'Strong (1650-1799)': 0,
      'Good (1500-1649)': 0,
      'Average (1350-1499)': 0,
      'Developing (<1350)': 0
    };

    aggregatedNames.forEach(name => {
      if (name.averageRating >= 1800) distribution['Elite (1800+)']++;
      else if (name.averageRating >= 1650) distribution['Strong (1650-1799)']++;
      else if (name.averageRating >= 1500) distribution['Good (1500-1649)']++;
      else if (name.averageRating >= 1350) distribution['Average (1350-1499)']++;
      else distribution['Developing (<1350)']++;
    });

    return distribution;
  }, [aggregatedNames]);

  const pieChartData = {
    labels: Object.keys(ratingDistribution),
    datasets: [{
      data: Object.values(ratingDistribution),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',   // Elite - Indigo
        'rgba(16, 185, 129, 0.8)',   // Strong - Green
        'rgba(245, 158, 11, 0.8)',   // Good - Amber
        'rgba(59, 130, 246, 0.8)',   // Average - Blue
        'rgba(156, 163, 175, 0.8)',  // Developing - Gray
      ],
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(59, 130, 246)',
        'rgb(156, 163, 175)',
      ],
      borderWidth: 1
    }]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Rating Distribution',
        color: 'var(--text-primary)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'right',
        labels: {
          color: 'var(--text-primary)',
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const chartData = {
    labels: topNames.map(n => n.name),
    datasets: [
      {
        label: 'Average Rating',
        data: topNames.map(n => n.averageRating),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
      {
        label: 'Win Rate %',
        data: topNames.map(n => n.winRate),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Top 10 Cat Names - Rating & Win Rate',
        color: 'var(--text-primary)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-primary)'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      },
      x: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const popularityData = {
    labels: topNames.map(n => n.name),
    datasets: [{
      label: 'Times Rated',
      data: topNames.map(n => n.totalVotes),
      backgroundColor: 'rgba(239, 68, 68, 0.5)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 1
    }]
  };

  const popularityOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      title: {
        ...options.plugins.title,
        text: 'Most Rated Cat Names'
      }
    }
  };

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartRow}>
        <div className={styles.chartWrapper}>
          <Bar data={chartData} options={options} />
        </div>
        <div className={styles.pieChartWrapper}>
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <Bar data={popularityData} options={popularityOptions} />
      </div>
    </div>
  );
});

const AggregatedStats = memo(({ allUsersRatings }) => {
  const aggregatedNames = useMemo(() => {
    const nameMap = new Map();

    // Combine ratings for each name across all users
    Object.values(allUsersRatings).forEach(userRatings => {
      userRatings.forEach(rating => {
        if (!nameMap.has(rating.name)) {
          nameMap.set(rating.name, {
            name: rating.name,
            description: rating.description,
            totalRating: 0,
            totalVotes: 0,
            wins: 0,
            losses: 0,
            users: new Set()
          });
        }
        
        const nameStats = nameMap.get(rating.name);
        nameStats.totalRating += rating.rating || DEFAULT_RATING;
        nameStats.wins += rating.wins || 0;
        nameStats.losses += rating.losses || 0;
        nameStats.users.add(rating.user_name);
        nameStats.totalVotes++;
      });
    });

    // Convert to array and calculate averages
    return Array.from(nameMap.values())
      .map(stats => ({
        ...stats,
        averageRating: Math.round(stats.totalRating / stats.totalVotes),
        userCount: stats.users.size,
        winRate: stats.wins + stats.losses > 0 
          ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) 
          : 0
      }))
      .sort((a, b) => b.averageRating - a.averageRating);
  }, [allUsersRatings]);

  return (
    <section className={styles.aggregatedSection}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>📊</span>
        Overall Cat Name Rankings
      </h2>
      
      <ChartSection aggregatedNames={aggregatedNames} />

      <div className={styles.ratingsGrid}>
        {aggregatedNames.map(name => (
          <Card key={name.name} className={styles.aggregatedCard}>
            <div className={styles.nameHeader}>
              <h3 className={styles.nameTitle}>{name.name}</h3>
              <div className={styles.rating}>{name.averageRating.toLocaleString()}</div>
            </div>
            <div className={styles.stats}>
              <div className={styles.record}>
                <span className={styles.wins}>{name.wins} wins</span>
                <span className={styles.separator}>•</span>
                <span className={styles.losses}>{name.losses} losses</span>
              </div>
            </div>
            <div className={styles.aggregatedStats}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Win Rate:</span>
                <span className={styles.statValue}>{name.winRate}%</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Times Rated:</span>
                <span className={styles.statValue}>{name.totalVotes}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Users:</span>
                <span className={styles.statValue}>{name.userCount}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
});

// Main Component
const Profile = ({ userName, onStartNewTournament }) => {
  // State
  const [isAdmin] = useState(userName.toLowerCase() === 'aaron');
  const [viewMode, setViewMode] = useState('individual');
  const [hiddenNames, setHiddenNames] = useState(new Set());
  const [showDeleteNameConfirm, setShowDeleteNameConfirm] = useState(false);
  const [nameToDelete, setNameToDelete] = useState(null);
  const [deleteNameStatus, setDeleteNameStatus] = useState({ loading: false, error: null });
  const [allUsersRatings, setAllUsersRatings] = useState({});
  const [userLastActivity, setUserLastActivity] = useState({});
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [currentUserRatings, setCurrentUserRatings] = useState([]);
  const [currentlyViewedUser, setCurrentlyViewedUser] = useState(userName);
  const [showAggregated, setShowAggregated] = useState(false);

  // Data fetching
  const [ratings, setRatings, { loading, error }] = useSupabaseStorage('cat_name_ratings', [], userName);

  const fetchUserRatings = useCallback(async (targetUserName) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('cat_name_ratings')
        .select(`
          rating,
          wins,
          losses,
          updated_at,
          name_options (
            id,
            name,
            description
          )
        `)
        .eq('user_name', targetUserName);

      if (fetchError) throw fetchError;

      const processedRatings = data.map(item => ({
        id: item.name_options.id,
        name: item.name_options.name,
        description: item.name_options.description,
        rating: item.rating || DEFAULT_RATING,
        wins: item.wins || 0,
        losses: item.losses || 0,
        updated_at: item.updated_at
      }));

      setCurrentUserRatings(processedRatings);
    } catch (err) {
      console.error('Error fetching user ratings:', err);
    }
  }, []);

  const fetchAllUsersRatings = useCallback(async () => {
    try {
      setLoadingAllUsers(true);
      
      const { data, error: fetchError } = await supabase
        .from('cat_name_ratings')
        .select(`
          rating,
          wins,
          losses,
          user_name,
          updated_at,
          name_options (
            id,
            name,
            description
          )
        `);

      if (fetchError) throw fetchError;

      const { lastActivity, ratingsByUser } = processUserRatings(data);
      setUserLastActivity(lastActivity);
      setAllUsersRatings(ratingsByUser);
    } catch (err) {
      console.error('Error fetching all users ratings:', err);
    } finally {
      setLoadingAllUsers(false);
    }
  }, []);

  const fetchHiddenNames = useCallback(async () => {
    try {
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('hidden_names')
        .select('name_id');

      if (hiddenError) throw hiddenError;

      const newHiddenNames = new Set(hiddenData?.map(item => item.name_id) || []);
      setHiddenNames(newHiddenNames);
    } catch (err) {
      console.error('Error fetching hidden names:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserRatings(userName);
  }, [userName, fetchUserRatings]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsersRatings();
      fetchHiddenNames();
    }
  }, [isAdmin, fetchAllUsersRatings, fetchHiddenNames]);

  useEffect(() => {
    // Always fetch hidden names, even for non-admin users
    fetchHiddenNames();
  }, [fetchHiddenNames]);

  const handleUserAction = useCallback(async (action, user) => {
    if (action === 'view') {
      // When viewing a user's profile, update the currently viewed user and fetch their ratings
      setCurrentlyViewedUser(user.name);
      await fetchUserRatings(user.name);
    } else if (action === 'delete') {
      try {
        await Promise.all([
          supabase.from('cat_name_ratings').delete().eq('user_name', user.name),
          supabase.from('tournament_progress').delete().eq('user_name', user.name)
        ]);
        await fetchAllUsersRatings();
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  }, [fetchAllUsersRatings, fetchUserRatings]);

  const handleToggleNameVisibility = useCallback(async (nameId, nameText) => {
    const isHidden = hiddenNames.has(nameId);
    if (!window.confirm(`Are you sure you want to ${isHidden ? 'show' : 'hide'} this name?`)) return;

    try {
      const { error } = isHidden 
        ? await supabase.from('hidden_names').delete().eq('name_id', nameId)
        : await supabase.from('hidden_names').insert([{ name_id: nameId }]);

      if (error) throw error;

      // Refresh hidden names after toggling
      await fetchHiddenNames();
    } catch (error) {
      console.error('Error toggling name visibility:', error);
    }
  }, [hiddenNames, fetchHiddenNames]);

  const handleDeleteName = useCallback(async (nameId) => {
    try {
      setDeleteNameStatus({ loading: true, error: null });
      const { error } = await deleteName(nameId);
      if (error) throw error;

      setRatings(prev => prev.filter(r => r.id !== nameId));
      setShowDeleteNameConfirm(false);
    } catch (err) {
      setDeleteNameStatus({ loading: false, error: err.message });
    }
  }, [setRatings]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  const users = Object.entries(allUsersRatings).map(([name, ratings]) => ({
    id: name,
    name,
    ratingsCount: ratings.length,
    averageRating: ratings.reduce((sum, r) => sum + (r.rating || DEFAULT_RATING), 0) / ratings.length,
    lastActive: userLastActivity[name],
    isActive: Date.now() - new Date(userLastActivity[name]).getTime() < ACTIVE_THRESHOLD
  }));

  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <h1>{currentlyViewedUser}'s Cat Name Rankings</h1>
        <div className={styles.headerActions}>
          {isAdmin && (
            <Button 
              onClick={() => setShowAggregated(!showAggregated)}
              variant="default"
            >
              {showAggregated ? 'Show Individual View' : 'Show Overall Rankings'}
            </Button>
          )}
          {userName.toLowerCase() === 'aaron' && (
            <Button onClick={onStartNewTournament}>Start Tournament</Button>
          )}
        </div>
      </header>

      {isAdmin && !showAggregated && (
        <AdminPanel
          users={users}
          onUserAction={handleUserAction}
          onRefreshData={fetchAllUsersRatings}
        />
      )}

      <div className={styles.mainContent}>
        {showAggregated ? (
          <AggregatedStats allUsersRatings={allUsersRatings} />
        ) : (
          <>
            <ProfileStats ratings={currentUserRatings} />

            <div className={styles.ratingSections}>
              <section>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🎯</span>
                  {currentlyViewedUser}'s Active Names
                </h2>
                <div className={styles.ratingsGrid}>
                  {currentUserRatings
                    .filter(name => !hiddenNames.has(name.id))
                    .sort((a, b) => (b.rating || DEFAULT_RATING) - (a.rating || DEFAULT_RATING))
                    .map(name => (
                      <NameCard
                        key={name.id}
                        name={name}
                        isHidden={false}
                        onToggleVisibility={handleToggleNameVisibility}
                        onDelete={(name) => {
                          setNameToDelete(name);
                          setShowDeleteNameConfirm(true);
                        }}
                        isAdmin={isAdmin}
                      />
                    ))}
                </div>
              </section>

              {currentUserRatings.some(name => hiddenNames.has(name.id)) && (
                <section className={styles.hiddenNamesSection}>
                  <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🔒</span>
                    {currentlyViewedUser}'s Hidden Names
                    <span className={styles.sectionSubtitle}>(Names must be hidden before deletion)</span>
                  </h2>
                  <div className={styles.ratingsGrid}>
                    {currentUserRatings
                      .filter(name => hiddenNames.has(name.id))
                      .sort((a, b) => (b.rating || DEFAULT_RATING) - (a.rating || DEFAULT_RATING))
                      .map(name => (
                        <NameCard
                          key={name.id}
                          name={name}
                          isHidden={true}
                          onToggleVisibility={handleToggleNameVisibility}
                          onDelete={(name) => {
                            setNameToDelete(name);
                            setShowDeleteNameConfirm(true);
                          }}
                          isAdmin={isAdmin}
                        />
                      ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        title="Delete Name"
        isOpen={showDeleteNameConfirm}
        onClose={() => setShowDeleteNameConfirm(false)}
      >
        <p>Are you sure you want to permanently delete <strong>{nameToDelete?.name}</strong>?</p>
        <p className={styles.warningText}>This action cannot be undone!</p>
        
        <div className={styles.modalButtons}>
          <Button 
            onClick={() => handleDeleteName(nameToDelete.id)}
            variant="delete"
            disabled={deleteNameStatus.loading}
          >
            {deleteNameStatus.loading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
          <Button 
            onClick={() => setShowDeleteNameConfirm(false)}
            disabled={deleteNameStatus.loading}
          >
            Cancel
          </Button>
        </div>
        {deleteNameStatus.error && (
          <p className={styles.errorMessage}>
            Error: {deleteNameStatus.error}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Profile;