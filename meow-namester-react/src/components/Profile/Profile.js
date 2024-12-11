import React, { useState, useEffect } from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';
import { supabase } from '../../supabase/supabaseClient';
import './Profile.css';

function Profile({ userName, onStartNewTournament }) {
  const [ratings, , { loading, error }] = useSupabaseStorage('cat_name_ratings', [], userName);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsersRatings, setAllUsersRatings] = useState([]);
  const [selectedUser, setSelectedUser] = useState(userName);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  useEffect(() => {
    // Check if user is admin (Aaron)
    setIsAdmin(userName.toLowerCase() === 'aaron');
  }, [userName]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsersRatings();
    }
  }, [isAdmin]);

  const fetchAllUsersRatings = async () => {
    try {
      setLoadingAllUsers(true);
      const { data, error: fetchError } = await supabase
        .from('cat_name_ratings')
        .select(`
          rating,
          wins,
          losses,
          user_name,
          name_options (
            id,
            name
          )
        `);

      if (fetchError) throw fetchError;

      // Group ratings by user
      const ratingsByUser = data.reduce((acc, item) => {
        const userName = item.user_name;
        if (!acc[userName]) {
          acc[userName] = [];
        }
        acc[userName].push({
          id: item.name_options.id,
          name: item.name_options.name,
          rating: item.rating,
          wins: item.wins,
          losses: item.losses
        });
        return acc;
      }, {});

      setAllUsersRatings(ratingsByUser);
    } catch (err) {
      console.error('Error fetching all users ratings:', err);
    } finally {
      setLoadingAllUsers(false);
    }
  };

  if (loading || loadingAllUsers) return (
    <div className="profile-loading">
      <div className="loading-spinner"></div>
      <p>Loading profile data...</p>
    </div>
  );
  
  if (error) return (
    <div className="profile-error">
      <span className="error-icon">⚠️</span>
      <p>Error loading profile: {error.message}</p>
    </div>
  );

  // Get the current ratings to display (either selected user's or current user's)
  const currentRatings = isAdmin && selectedUser !== userName 
    ? allUsersRatings[selectedUser] || []
    : ratings;

  // Calculate statistics for current view
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
              <p className="profile-subtitle">Viewing data for: {selectedUser}</p>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="user-select"
              >
                <option value={userName}>Your Profile</option>
                {Object.keys(allUsersRatings)
                  .filter(user => user !== userName)
                  .sort()
                  .map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))
                }
              </select>
              <button 
                onClick={fetchAllUsersRatings} 
                className="refresh-button"
              >
                🔄 Refresh Data
              </button>
            </div>
          )}
          {!isAdmin && (
            <p className="profile-subtitle">Cat Name Connoisseur</p>
          )}
        </div>
        <button 
          onClick={onStartNewTournament}
          className="new-tournament-button"
        >
          <span className="button-icon">🏆</span>
          Start New Tournament
        </button>
      </header>

      <div className="profile-stats">
        <div className="stat-card overview-card">
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

        <div className="stat-card leaderboard-card">
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
            <p className="no-data-message">No names rated yet</p>
          )}
        </div>
      </div>

      <div className="all-names-section">
        <h3>
          <span className="section-icon">📝</span>
          All Rated Names
        </h3>
        <div className="names-grid">
          {currentRatings.map(name => (
            <div key={name.id} className="name-card">
              <h4>{name.name}</h4>
              <div className="name-stats">
                <div className="stat-row">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-label">Rating:</span>
                  <span className="stat-value">{Math.round(name.rating || 1500)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-label">Wins:</span>
                  <span className="stat-value">{name.wins || 0}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-icon">💔</span>
                  <span className="stat-label">Losses:</span>
                  <span className="stat-value">{name.losses || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile; 