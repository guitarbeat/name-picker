import React, { useState, useEffect, useCallback } from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';
import { supabase, deleteName } from '../../supabase/supabaseClient';
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

      // Process individual user ratings
      const ratingsByUser = data.reduce((acc, item) => {
        if (!item.name_options) return acc; // Skip if name has been deleted
        
        const userName = item.user_name;
        if (!acc[userName]) {
          acc[userName] = [];
        }
        acc[userName].push({
          id: item.name_options.id,
          name: item.name_options.name,
          description: item.name_options.description,
          rating: item.rating,
          wins: item.wins,
          losses: item.losses,
          updated_at: item.updated_at
        });
        return acc;
      }, {});

      setAllUsersRatings(ratingsByUser);
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
      console.log('Fetching hidden names...');
      const { data: hiddenData, error: hiddenError } = await supabase
        .from('hidden_names')
        .select('name_id');

      if (hiddenError) {
        console.error('Error fetching hidden names:', hiddenError);
        throw hiddenError;
      }

      console.log('Received hidden names:', hiddenData);
      const newHiddenNames = new Set(hiddenData?.map(item => item.name_id) || []);
      console.log('Setting hidden names to:', newHiddenNames);
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
      
      if (!window.confirm(`Are you sure you want to ${action} the name "${name}"?\n\n${isHidden ? 'This will make it available in tournaments again.' : 'This will remove it from future tournaments.'}`)) {
        return;
      }

      if (isHidden) {
        // Unhide name
        const { error: unhideError } = await supabase
          .from('hidden_names')
          .delete()
          .eq('name_id', nameId);
        
        if (unhideError) throw unhideError;
        
        // Update local state immediately
        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.delete(nameId);
        setHiddenNames(newHiddenNames);
      } else {
        // Hide name
        const { error: hideError } = await supabase
          .from('hidden_names')
          .insert([{ name_id: nameId }]);
        
        if (hideError) throw hideError;
        
        // Update local state immediately
        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.add(nameId);
        setHiddenNames(newHiddenNames);
      }
      
      // Show success toast
      setToast({
        show: true,
        message: `Name ${isHidden ? 'shown' : 'hidden'} successfully`,
        type: 'success'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      
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
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      
      console.log('Current hidden names:', hiddenNames);
      console.log('Attempting to delete name:', { nameId, name });
      
      // Double check the name is actually hidden
      if (!hiddenNames.has(nameId)) {
        // If not hidden, hide it first
        const { error: hideError } = await supabase
          .from('hidden_names')
          .insert([{ name_id: nameId }]);
        
        if (hideError) throw hideError;
        
        // Update local state
        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.add(nameId);
        setHiddenNames(newHiddenNames);

        // Wait a moment for the hidden status to be reflected in the database
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const { error, success } = await deleteName(nameId);
      
      if (error) throw error;
      if (!success) throw new Error('Deletion failed without an error');

      // Only update state if deletion was successful
      if (success) {
        // Update local state immediately
        setAllUsersRatings(prev => {
          const updated = { ...prev };
          // Remove the deleted name from all users' ratings
          Object.keys(updated).forEach(user => {
            updated[user] = updated[user].filter(rating => rating.id !== nameId);
          });
          return updated;
        });

        const newHiddenNames = new Set(hiddenNames);
        newHiddenNames.delete(nameId);
        setHiddenNames(newHiddenNames);

        // Refresh data
        await Promise.all([
          fetchAllUsersRatings(),
          fetchHiddenNames()
        ]);
        
        // Reset state
        setShowDeleteNameConfirm(false);
        setNameToDelete(null);
        setDeleteNameStatus({ loading: false, error: null });
        
        // Show success toast
        setToast({
          show: true,
          message: `Successfully deleted "${name}"`,
          type: 'success'
        });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      }
    } catch (err) {
      console.error('Error deleting name:', err);
      setDeleteNameStatus({ loading: false, error: err.message });
      
      // Show error toast
      setToast({
        show: true,
        message: `Error deleting name: ${err.message}`,
        type: 'error'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
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
  
  const topNames = [...currentRatings]
    .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
    .slice(0, 5);

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-title">
          <h2>
            <span className="profile-emoji">😺</span>
            {isAdmin ? 'Admin Dashboard' : `${userName}'s Profile`}
          </h2>
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
              <button 
                onClick={() => {
                  const sortedNames = [...currentRatings]
                    .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
                    .map((name, index) => `${index + 1}. ${name.name}`)
                    .join('\n');

                  const topName = currentRatings
                    .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))[0]?.name || 'No names rated';

                  const today = new Date();
                  const formattedDate = today.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  });

                  const text = `🐈‍⬛ ${topName}`;
                  const details = `${formattedDate} Cat Name Rankings:\n\n${sortedNames}`;
                  const dates = `${today.toISOString()}/${new Date(today.getTime() + 3600000).toISOString()}`;
                  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&details=${encodeURIComponent(details)}&dates=${dates.replace(/[-:]/g, '')}`;
                  
                  window.open(calendarUrl, '_blank');
                }}
                className="action-button secondary-button"
                title="Add to Google Calendar"
              >
                📅 Add to Calendar
              </button>
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
          {!isAdmin && (
            <p className="profile-subtitle">Cat Name Connoisseur</p>
          )}
        </div>
        <button 
          onClick={onStartNewTournament}
          className="action-button primary-button"
        >
          <span className="button-icon">🏆</span>
          Start New Tournament
        </button>
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

            <div className="stat-card">
              <h3>
                <span className="card-icon">🏅</span>
                Top 5 Names
              </h3>
              {topNames.length > 0 ? (
                <ol className="top-names-list">
                  {topNames.map((name, index) => (
                    <li key={name.id} className="top-name-item">
                      <div className="rank-badge">{index + 1}</div>
                      <div className="name-details">
                        <span className="name-text">{name.name}</span>
                        <div className="name-stats">
                          <span className="rating-badge">
                            {Math.round(name.rating || 1500)}
                          </span>
                          <span className="record-text">
                            W: {name.wins || 0} L: {name.losses || 0}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="subtitle">No names rated yet</p>
              )}
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
                  .filter(name => !hiddenNames.has(name.id))
                  .map(name => (
                    <div key={name.id} className="rating-card">
                      <div className="rating-card-header">
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
                      <div className="stats">
                        <div className="stat">
                          <span className="stat-number">{Math.round(name.rating || 1500)}</span>
                          <span className="stat-text">Rating</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">{name.wins || 0}</span>
                          <span className="stat-text">Wins</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">{name.losses || 0}</span>
                          <span className="stat-text">Losses</span>
                        </div>
                      </div>
                      <div className="timestamps">
                        <div className="timestamp">
                          <span className="timestamp-label">Last Updated:</span>
                          <span className="timestamp-value">{formatDate(name.updated_at)}</span>
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
                        <div className="stats">
                          <div className="stat">
                            <span className="stat-number">{Math.round(name.rating || 1500)}</span>
                            <span className="stat-text">Rating</span>
                          </div>
                          <div className="stat">
                            <span className="stat-number">{name.wins || 0}</span>
                            <span className="stat-text">Wins</span>
                          </div>
                          <div className="stat">
                            <span className="stat-number">{name.losses || 0}</span>
                            <span className="stat-text">Losses</span>
                          </div>
                        </div>
                        <div className="timestamps">
                          <div className="timestamp">
                            <span className="timestamp-label">Last Updated:</span>
                            <span className="timestamp-value">{formatDate(name.updated_at)}</span>
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