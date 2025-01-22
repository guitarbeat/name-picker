import React, { useState, useEffect, useCallback } from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';
import { supabase, deleteName } from '../../supabase/supabaseClient';
import CalendarButton from '../CalendarButton/CalendarButton';
import './Profile.css';

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

  const fetchAllUsersRatings = useCallback(async () => {
    try {
      setLoadingAllUsers(true);
      console.log('Fetching all users ratings...'); // Debug log
      
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

      console.log('Raw data from database:', data); // Debug log

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
        
        console.log(`Processing rating for ${ratingEntry.name}:`, ratingEntry); // Debug log
        
        acc[userName].push(ratingEntry);
        return acc;
      }, {});

      console.log('Processed ratings by user:', ratingsByUser); // Debug log

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
  }, [userName]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsersRatings();
      fetchHiddenNames();
    }
  }, [isAdmin, fetchAllUsersRatings]);

  const fetchHiddenNames = async () => {
    try {
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('hidden_names')
        .select('name_id');

      if (hiddenError) throw hiddenError;

      // Create Set of UUIDs
      const newHiddenNames = new Set(hiddenData?.map(item => item.name_id) || []);
      setHiddenNames(newHiddenNames);
    } catch (err) {
      console.error('Error in fetchHiddenNames:', err);
      setToast({
        show: true,
        message: `Error fetching hidden names: ${err.message}`,
        type: 'error'
      });
    }
  };

  const handleToggleNameVisibility = async (nameId, name) => {
    try {
      const isHidden = hiddenNames.has(nameId);
      const action = isHidden ? 'show' : 'hide';
      
      if (!window.confirm(`Are you sure you want to ${action} the name "${name}"?`)) {
        return;
      }

      if (isHidden) {
        // Unhide name - using proper UUID comparison
        const { error: unhideError } = await supabase
          .from('hidden_names')
          .delete()
          .eq('name_id', nameId); // UUID comparison
        
        if (unhideError) throw unhideError;
        
        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.delete(nameId);
        setHiddenNames(newHiddenNames);
      } else {
        // Hide name - using UUID for insertion
        const { error: hideError } = await supabase
          .from('hidden_names')
          .insert([{ 
            id: crypto.randomUUID(), // Generate new UUID for hidden_names entry
            name_id: nameId 
          }]);
        
        if (hideError) throw hideError;
        
        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.add(nameId);
        setHiddenNames(newHiddenNames);
      }

      setToast({
        show: true,
        message: `Name ${isHidden ? 'shown' : 'hidden'} successfully`,
        type: 'success'
      });

      // Refresh data
      await Promise.all([
        fetchAllUsersRatings(),
        fetchHiddenNames()
      ]);
    } catch (err) {
      console.error('Error toggling name visibility:', err);
      setToast({
        show: true,
        message: `Error ${hiddenNames.has(nameId) ? 'showing' : 'hiding'} name: ${err.message}`,
        type: 'error'
      });
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortedAggregatedStats = () => {
    const stats = Object.values(aggregatedStats);
    const sortedStats = stats.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'number') {
        return (aValue - bValue) * modifier;
      }
      return aValue.localeCompare(bValue) * modifier;
    });

    // Separate hidden and active names
    return {
      active: sortedStats.filter(stat => !hiddenNames.has(stat.id)),
      hidden: sortedStats.filter(stat => hiddenNames.has(stat.id))
    };
  };

  // Add a helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Parse the UTC timestamp from Supabase
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Format the date using Intl.DateTimeFormat with local timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
      
      return formatter.format(date);
    } catch (error) {
      console.error('Error formatting date:', error, 'for dateString:', dateString);
      return 'N/A';
    }
  };

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
    const sortedNames = [...currentRatings]
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
    if (!isAdmin) return;
    
    try {
      setDeleteNameStatus({ loading: true, error: null });
      
      // Call the deleteName function from supabaseClient
      const { error: deleteError, success } = await deleteName(nameId);
      
      if (deleteError) throw deleteError;
      if (!success) throw new Error('Delete operation failed');

      // Only update state if deletion was successful
      if (success) {
        // Update local state
        setAllUsersRatings(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(user => {
            updated[user] = updated[user].filter(rating => rating.id !== nameId);
          });
          return updated;
        });

        // Remove from hidden names if it was hidden
        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.delete(nameId);
        setHiddenNames(newHiddenNames);

        // Show success message and cleanup
        setShowDeleteNameConfirm(false);
        setNameToDelete(null);
        setDeleteNameStatus({ loading: false, error: null });
        
        setToast({
          show: true,
          message: `Successfully deleted "${name}"`,
          type: 'success'
        });

        // Refresh data
        await Promise.all([
          fetchAllUsersRatings(),
          fetchHiddenNames()
        ]);
      }
    } catch (err) {
      console.error('Error deleting name:', err);
      setDeleteNameStatus({ loading: false, error: err.message });
      
      setToast({
        show: true,
        message: `Error deleting name: ${err.message}`,
        type: 'error'
      });
    }
  };

  if (loading || loadingAllUsers) return (
    <div className="profile container">
      <div className="loading-spinner"></div>
      <p className="subtitle">Loading profile data...</p>
    </div>
  );
  
  if (error) return (
    <div className="profile container">
      <span className="error-icon">⚠️</span>
      <p className="subtitle">Error loading profile: {error.message}</p>
    </div>
  );

  const currentRatings = isAdmin && selectedUser !== userName 
    ? allUsersRatings[selectedUser] || []
    : ratings;

  const totalNames = currentRatings.length;
  const averageRating = totalNames > 0 
    ? Math.round(currentRatings.reduce((sum, r) => sum + (r.rating || 1500), 0) / totalNames) 
    : 0;
  const totalMatches = currentRatings.reduce((sum, r) => sum + (r.wins || 0) + (r.losses || 0), 0);
  
  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-title">
          <h2>
            <span className="profile-emoji">😺</span>
            {isAdmin ? 'Admin Dashboard' : `${userName}'s Profile`}
          </h2>
          {!isAdmin && (
            <p className="profile-subtitle">Cat Name Connoisseur</p>
          )}
        </div>

        <button 
          onClick={onStartNewTournament}
          className="start-tournament-button"
        >
          <span className="button-icon">🏆</span>
          Start New Tournament
        </button>

        {isAdmin && (
          <div className="admin-controls">
            <div className="view-controls">
              <button 
                className={`view-button ${viewMode === 'individual' ? 'active' : ''}`}
                onClick={() => setViewMode('individual')}
              >
                Individual View
              </button>
              <button 
                className={`view-button ${viewMode === 'aggregated' ? 'active' : ''}`}
                onClick={() => setViewMode('aggregated')}
              >
                Aggregated View
              </button>
            </div>
            <button 
              onClick={copyResultsToClipboard}
              className="action-button secondary-button"
              title="Copy ranked names to clipboard"
            >
              📋 Copy Results
            </button>
            <CalendarButton 
              rankings={currentRatings}
              userName={userName}
              hiddenNames={hiddenNames}
            />
            <button 
              onClick={fetchAllUsersRatings} 
              className="action-button secondary-button"
            >
              🔄 Refresh Data
            </button>
            {showCopyToast && (
              <div className="toast success">
                Results copied to clipboard!
              </div>
            )}
            {viewMode === 'individual' && (
              <>
                <div className="user-switcher">
                  <button
                    className={`user-avatar ${selectedUser === userName ? 'active' : ''}`}
                    onClick={() => setSelectedUser(userName)}
                    title="Your Profile"
                  >
                    👤 You
                  </button>
                  {Object.keys(allUsersRatings)
                    .filter(user => user !== userName)
                    .sort()
                    .map(user => (
                      <button
                        key={user}
                        className={`user-avatar ${selectedUser === user ? 'active' : ''}`}
                        onClick={() => setSelectedUser(user)}
                        title={`View ${user}'s profile`}
                      >
                        👤 {user}
                      </button>
                    ))
                  }
                </div>
                <div className="user-controls">
                  {selectedUser !== userName && (
                    <button
                      onClick={() => {
                        setUserToDelete(selectedUser);
                        setShowDeleteConfirm(true);
                      }}
                      className="action-button danger-button"
                      title="Delete this user's data"
                    >
                      🗑️ Delete User Data
                    </button>
                  )}
                </div>
              </>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>⚠️ Delete User Data</h3>
                  <p>Are you sure you want to delete all data for user <strong>{userToDelete}</strong>?</p>
                  <p className="warning-text">This action cannot be undone!</p>
                  
                  {deleteStatus.error && (
                    <div className="error-message">
                      Error: {deleteStatus.error}
                    </div>
                  )}
                  
                  <div className="modal-actions">
                    <button
                      onClick={() => handleDeleteUser(userToDelete)}
                      className="action-button danger-button"
                      disabled={deleteStatus.loading}
                    >
                      {deleteStatus.loading ? 'Deleting...' : 'Yes, Delete User Data'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setUserToDelete(null);
                        setDeleteStatus({ loading: false, error: null });
                      }}
                      className="action-button secondary-button"
                      disabled={deleteStatus.loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {viewMode === 'individual' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>
                <span className="card-icon">📊</span>
                Overview
              </h3>
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-label">Names Rated</span>
                  <span className="stat-value">{totalNames}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Matches</span>
                  <span className="stat-value">{totalMatches}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Rating</span>
                  <span className="stat-value">{averageRating}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ratings-sections">
            <section className="active-names-section">
              <h3 className="section-title">
                <span className="section-icon">🎯</span>
                Active Names
              </h3>
              <div className="ratings-grid">
                {currentRatings
                  .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
                  .filter(name => !hiddenNames.has(name.id))
                  .map((name, index) => (
                    <div key={name.id} className="rating-card">
                      <div className="rating-card-header">
                        <div className="name-rank">#{index + 1}</div>
                        <h4 className="name">{name.name}</h4>
                        <button
                          onClick={() => handleToggleNameVisibility(name.id, name.name)}
                          className={`visibility-toggle ${hiddenNames.has(name.id) ? 'hidden' : ''}`}
                          title={`Click to ${hiddenNames.has(name.id) ? 'show' : 'hide'} this name ${hiddenNames.has(name.id) ? 'in' : 'from'} tournaments`}
                        >
                          <span className="visibility-icon">
                            {hiddenNames.has(name.id) ? '🔒' : '🔓'}
                          </span>
                          <span className="visibility-text">
                            {hiddenNames.has(name.id) ? 'Hidden' : 'Visible'}
                          </span>
                        </button>
                      </div>
                      <div className="rating-info">
                        <div className="rating-value">Rating: {Math.round(name.rating || 1500)}</div>
                        <div className="record">
                          <span className="wins">🏆 Wins: {name.wins || 0}</span>
                          <span className="losses">❌ Losses: {name.losses || 0}</span>
                        </div>
                      </div>
                      <div className="rating-card-actions">
                        <div className="timestamps">
                          <div className="timestamp">
                            <span className="timestamp-label">Last Updated:</span>
                            <span className="timestamp-value">
                              {formatDate(name.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {currentRatings.some(name => hiddenNames.has(name.id)) && (
              <section className="hidden-names-section">
                <h3 className="section-title">
                  <span className="section-icon">🚫</span>
                  Hidden Names
                </h3>
                <div className="ratings-grid">
                  {currentRatings
                    .filter(name => hiddenNames.has(name.id))
                    .map(name => (
                      <div key={name.id} className="rating-card is-hidden">
                        <div className="rating-card-header">
                          <h4 className="name">{name.name}</h4>
                          <div className="card-actions">
                            <button
                              onClick={() => handleToggleNameVisibility(name.id, name.name)}
                              className={`visibility-toggle ${hiddenNames.has(name.id) ? 'hidden' : ''}`}
                              title={`Click to ${hiddenNames.has(name.id) ? 'show' : 'hide'} this name ${hiddenNames.has(name.id) ? 'in' : 'from'} tournaments`}
                            >
                              <span className="visibility-icon">
                                {hiddenNames.has(name.id) ? '🔒' : '🔓'}
                              </span>
                              <span className="visibility-text">
                                {hiddenNames.has(name.id) ? 'Hidden' : 'Visible'}
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                setNameToDelete(name);
                                setShowDeleteNameConfirm(true);
                              }}
                              className="delete-button"
                              title="Delete this name permanently"
                            >
                              <span className="delete-icon">🗑️</span>
                            </button>
                          </div>
                        </div>
                        <div className="rating-info">
                          <div className="rating-value">Rating: {Math.round(name.rating || 1500)}</div>
                          <div className="record">
                            <span className="wins">🏆 Wins: {name.wins || 0}</span>
                            <span className="losses">❌ Losses: {name.losses || 0}</span>
                          </div>
                        </div>
                        <div className="rating-card-actions">
                          <div className="timestamps">
                            <div className="timestamp">
                              <span className="timestamp-label">Last Updated:</span>
                              <span className="timestamp-value">
                                {formatDate(name.updated_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden-status">
                          <p className="hidden-text">This name is hidden from tournaments</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        </>
      ) : (
        <div className="aggregated-view">
          <div className="aggregated-stats-header">
            <h3>Aggregated Name Statistics</h3>
            <div className="sort-controls">
              <span>Sort by:</span>
              <button 
                onClick={() => handleSort('avgRating')}
                className={sortConfig.key === 'avgRating' ? 'active' : ''}
              >
                Average Rating {sortConfig.key === 'avgRating' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
              </button>
              <button 
                onClick={() => handleSort('totalRatings')}
                className={sortConfig.key === 'totalRatings' ? 'active' : ''}
              >
                Times Rated {sortConfig.key === 'totalRatings' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
              </button>
              <button 
                onClick={() => handleSort('name')}
                className={sortConfig.key === 'name' ? 'active' : ''}
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
          
          <div className="aggregated-sections">
            <section className="active-names-section">
              <h3 className="section-title">
                <span className="section-icon">🎯</span>
                Active Names
              </h3>
              <div className="aggregated-stats-grid">
                {getSortedAggregatedStats().active.map(stat => (
                  <div key={stat.id} className="aggregated-stat-card">
                    <div className="stat-card-header">
                      <h4 className="name">{stat.name}</h4>
                      {stat.description && (
                        <div className="name-description" title={stat.description}>
                          ℹ️
                        </div>
                      )}
                      <button
                        onClick={() => handleToggleNameVisibility(stat.id, stat.name)}
                        className={`visibility-toggle ${hiddenNames.has(stat.id) ? 'hidden' : ''}`}
                        title={`Click to ${hiddenNames.has(stat.id) ? 'show' : 'hide'} this name ${hiddenNames.has(stat.id) ? 'in' : 'from'} tournaments`}
                      >
                        <span className="visibility-icon">
                          {hiddenNames.has(stat.id) ? '🔒' : '🔓'}
                        </span>
                        <span className="visibility-text">
                          {hiddenNames.has(stat.id) ? 'Hidden' : 'Visible'}
                        </span>
                      </button>
                    </div>
                    <div className="aggregated-stats">
                      <div className="stat-row">
                        <div className="stat">
                          <span className="stat-label">Avg Rating</span>
                          <span className="stat-value">{stat.avgRating}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Times Rated</span>
                          <span className="stat-value">{stat.totalRatings}</span>
                        </div>
                      </div>
                      <div className="stat-row">
                        <div className="stat">
                          <span className="stat-label">Rating Range</span>
                          <span className="stat-value">{stat.minRating} - {stat.maxRating}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Unique Users</span>
                          <span className="stat-value">{stat.uniqueUsers}</span>
                        </div>
                      </div>
                      <div className="stat-row">
                        <div className="stat">
                          <span className="stat-label">Total W/L</span>
                          <span className="stat-value">
                            {stat.totalWins}/{stat.totalLosses}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Win Rate</span>
                          <span className="stat-value">
                            {Math.round((stat.totalWins / (stat.totalWins + stat.totalLosses || 1)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {getSortedAggregatedStats().hidden.length > 0 && (
              <section className="hidden-names-section">
                <h3 className="section-title">
                  <span className="section-icon">🚫</span>
                  Hidden Names
                </h3>
                <div className="aggregated-stats-grid">
                  {getSortedAggregatedStats().hidden.map(stat => (
                    <div key={stat.id} className="aggregated-stat-card is-hidden">
                      <div className="stat-card-header">
                        <h4 className="name">{stat.name}</h4>
                        {stat.description && (
                          <div className="name-description" title={stat.description}>
                            ℹ️
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleNameVisibility(stat.id, stat.name)}
                          className={`visibility-toggle ${hiddenNames.has(stat.id) ? 'hidden' : ''}`}
                          title={`Click to ${hiddenNames.has(stat.id) ? 'show' : 'hide'} this name ${hiddenNames.has(stat.id) ? 'in' : 'from'} tournaments`}
                        >
                          <span className="visibility-icon">
                            {hiddenNames.has(stat.id) ? '🔒' : '🔓'}
                          </span>
                          <span className="visibility-text">
                            {hiddenNames.has(stat.id) ? 'Hidden' : 'Visible'}
                          </span>
                        </button>
                      </div>
                      <div className="aggregated-stats">
                        <div className="stat-row">
                          <div className="stat">
                            <span className="stat-label">Avg Rating</span>
                            <span className="stat-value">{stat.avgRating}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Times Rated</span>
                            <span className="stat-value">{stat.totalRatings}</span>
                          </div>
                        </div>
                        <div className="stat-row">
                          <div className="stat">
                            <span className="stat-label">Rating Range</span>
                            <span className="stat-value">{stat.minRating} - {stat.maxRating}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Unique Users</span>
                            <span className="stat-value">{stat.uniqueUsers}</span>
                          </div>
                        </div>
                        <div className="stat-row">
                          <div className="stat">
                            <span className="stat-label">Total W/L</span>
                            <span className="stat-value">
                              {stat.totalWins}/{stat.totalLosses}
                            </span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Win Rate</span>
                            <span className="stat-value">
                              {Math.round((stat.totalWins / (stat.totalWins + stat.totalLosses || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden-status">
                        <p className="hidden-text">This name is hidden from tournaments</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
      {/* Delete Name Confirmation Modal */}
      {showDeleteNameConfirm && nameToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Delete Name</h3>
            <p>Are you sure you want to permanently delete the name <strong>{nameToDelete.name}</strong>?</p>
            <p className="warning-text">This action cannot be undone!</p>
            
            {deleteNameStatus.error && (
              <div className="error-message">
                Error: {deleteNameStatus.error}
              </div>
            )}
            
            <div className="modal-actions">
              <button
                onClick={() => handleDeleteName(nameToDelete.id, nameToDelete.name)}
                className="action-button danger-button"
                disabled={deleteNameStatus.loading}
              >
                {deleteNameStatus.loading ? 'Deleting...' : 'Yes, Delete Name'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteNameConfirm(false);
                  setNameToDelete(null);
                  setDeleteNameStatus({ loading: false, error: null });
                }}
                className="action-button secondary-button"
                disabled={deleteNameStatus.loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;