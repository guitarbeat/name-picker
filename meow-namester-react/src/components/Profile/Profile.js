import React from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';

function Profile({ userName, onStartNewTournament }) {
  const [ratings, , { loading, error }] = useSupabaseStorage('cat_names', [], userName);

  if (loading) return <div className="profile-loading">Loading your profile...</div>;
  if (error) return <div className="profile-error">Error loading profile: {error.message}</div>;

  // Calculate statistics
  const totalNames = ratings.length;
  const averageRating = totalNames > 0 
    ? Math.round(ratings.reduce((sum, r) => sum + (r.elo_rating || 1500), 0) / totalNames) 
    : 0;
  const totalMatches = ratings.reduce((sum, r) => sum + (r.wins || 0) + (r.losses || 0), 0);
  
  const topNames = [...ratings]
    .sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500))
    .slice(0, 5);

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h2>{userName}'s Profile</h2>
        <button 
          onClick={onStartNewTournament}
          className="primary-button"
        >
          Start New Tournament
        </button>
      </header>

      <div className="profile-stats">
        <div className="stat-card">
          <h3>Overview</h3>
          <ul>
            <li>Names Rated: {totalNames}</li>
            <li>Total Matches: {totalMatches}</li>
            <li>Average Rating: {averageRating}</li>
          </ul>
        </div>

        <div className="stat-card">
          <h3>Top 5 Names</h3>
          {topNames.length > 0 ? (
            <ol className="top-names-list">
              {topNames.map(name => (
                <li key={name.id}>
                  <span className="name">{name.name}</span>
                  <span className="rating">{Math.round(name.elo_rating || 1500)}</span>
                  <span className="record">
                    W: {name.wins || 0} L: {name.losses || 0}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>No names rated yet</p>
          )}
        </div>
      </div>

      <div className="all-names">
        <h3>All Rated Names</h3>
        <div className="names-grid">
          {ratings.map(name => (
            <div key={name.id} className="name-card">
              <h4>{name.name}</h4>
              <div className="name-stats">
                <div>Rating: {Math.round(name.elo_rating || 1500)}</div>
                <div>Wins: {name.wins || 0}</div>
                <div>Losses: {name.losses || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile; 