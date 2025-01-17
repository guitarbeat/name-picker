import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useSupabaseStorage from '../../supabase/useSupabaseStorage';
import { supabase } from '../../supabase/supabaseClient';
import './Profile.css';

// Constants
const ADMIN_USERNAME = 'aaron';
const VIEW_MODES = {
  INDIVIDUAL: 'individual',
  AGGREGATED: 'aggregated'
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const calculateWinRate = (wins, losses) => {
  return Math.round((wins / (wins + losses || 1)) * 100);
};

// Component
function Profile({ userName, onStartNewTournament }) {
  // State management
  const [ratings, setRatings, { loading, error }] = useSupabaseStorage('cat_name_ratings', [], userName);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsersRatings, setAllUsersRatings] = useState([]);
  const [selectedUser, setSelectedUser] = useState(userName);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [hiddenNames, setHiddenNames] = useState(new Set());
  const [viewMode, setViewMode] = useState(VIEW_MODES.INDIVIDUAL);
  const [aggregatedStats, setAggregatedStats] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'avgRating', direction: 'desc' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null });
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Effects
  useEffect(() => {
    setIsAdmin(userName.toLowerCase() === ADMIN_USERNAME);
  }, [userName]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsersRatings();
      fetchHiddenNames();
    }
  }, [isAdmin]);

  // Memoized values
  const currentRatings = useMemo(() => {
    return isAdmin && selectedUser !== userName 
      ? allUsersRatings[selectedUser] || []
      : ratings;
  }, [isAdmin, selectedUser, userName, allUsersRatings, ratings]);

  const stats = useMemo(() => {
    const totalNames = currentRatings.length;
    const averageRating = totalNames > 0 
      ? Math.round(currentRatings.reduce((sum, r) => sum + (r.rating || 1500), 0) / totalNames) 
      : 0;
    const totalMatches = currentRatings.reduce((sum, r) => sum + (r.wins || 0) + (r.losses || 0), 0);
    const topNames = [...currentRatings]
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
      .slice(0, 5);

    return { totalNames, averageRating, totalMatches, topNames };
  }, [currentRatings]);

  const sortedAggregatedStats = useMemo(() => {
    const stats = Object.values(aggregatedStats);
    const sortedStats = stats.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      
      return typeof aValue === 'number' 
        ? (aValue - bValue) * modifier
        : aValue.localeCompare(bValue) * modifier;
    });

    return {
      active: sortedStats.filter(stat => !hiddenNames.has(stat.id)),
      hidden: sortedStats.filter(stat => hiddenNames.has(stat.id))
    };
  }, [aggregatedStats, sortConfig, hiddenNames]);

  // Callbacks
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

      // Process ratings
      const ratingsByUser = data.reduce((acc, item) => {
        const userName = item.user_name;
        if (!acc[userName]) acc[userName] = [];
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

      // Calculate aggregated stats
      const aggregated = data.reduce((acc, item) => {
        const nameId = item.name_options.id;
        if (!acc[nameId]) {
          acc[nameId] = {
            id: nameId,
            name: item.name_options.name,
            description: item.name_options.description,
            totalRatings: 0,
            totalWins: 0,
            totalLosses: 0,
            ratings: [],
            users: new Set(),
          };
        }
        
        const stat = acc[nameId];
        stat.totalRatings++;
        stat.totalWins += item.wins || 0;
        stat.totalLosses += item.losses || 0;
        stat.ratings.push(item.rating);
        stat.users.add(item.user_name);
        
        return acc;
      }, {});

      // Calculate final stats
      Object.values(aggregated).forEach(stat => {
        stat.avgRating = Math.round(
          stat.ratings.reduce((sum, r) => sum + r, 0) / stat.ratings.length
        );
        stat.minRating = Math.min(...stat.ratings);
        stat.maxRating = Math.max(...stat.ratings);
        stat.uniqueUsers = stat.users.size;
        delete stat.ratings;
        delete stat.users;
      });

      setAllUsersRatings(ratingsByUser);
      setAggregatedStats(aggregated);
    } catch (err) {
      console.error('Error fetching all users ratings:', err);
    } finally {
      setLoadingAllUsers(false);
    }
  }, []);

  const fetchHiddenNames = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('hidden_names')
        .select('name_id');
      
      if (fetchError) throw fetchError;
      setHiddenNames(new Set(data.map(item => item.name_id)));
    } catch (err) {
      console.error('Error fetching hidden names:', err);
    }
  }, []);

  const handleToggleNameVisibility = useCallback(async (nameId) => {
    try {
      if (hiddenNames.has(nameId)) {
        await supabase
          .from('hidden_names')
          .delete()
          .eq('name_id', nameId);
        
        setHiddenNames(prev => {
          const newSet = new Set(prev);
          newSet.delete(nameId);
          return newSet;
        });
      } else {
        await supabase
          .from('hidden_names')
          .insert([{ name_id: nameId }]);
        
        setHiddenNames(prev => new Set([...prev, nameId]));
      }
      
      fetchAllUsersRatings();
    } catch (err) {
      console.error('Error toggling name visibility:', err);
    }
  }, [hiddenNames, fetchAllUsersRatings]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const handleDeleteUser = useCallback(async (userNameToDelete) => {
    if (!isAdmin) return;
    
    try {
      setDeleteStatus({ loading: true, error: null });
      
      // Delete user data in parallel
      await Promise.all([
        supabase
          .from('cat_name_ratings')
          .delete()
          .eq('user_name', userNameToDelete),
        supabase
          .from('tournament_progress')
          .delete()
          .eq('user_name', userNameToDelete)
      ]);

      await fetchAllUsersRatings();
      
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setDeleteStatus({ loading: false, error: null });

      if (selectedUser === userNameToDelete) {
        setSelectedUser(userName);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteStatus({ loading: false, error: err.message });
    }
  }, [isAdmin, selectedUser, userName, fetchAllUsersRatings]);

  const copyResultsToClipboard = useCallback(() => {
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

    navigator.clipboard.writeText(
      `Title: ${formattedDate} Cat Names 🐈‍⬛\nDescription: Cat Name Tournament Results\n\n${sortedNames}`
    ).then(() => {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    });
  }, [currentRatings]);

  // Loading and error states
  if (loading || loadingAllUsers) {
    return (
      <div className="profile container">
        <div className="loading-spinner" />
        <p className="subtitle">Loading profile data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="profile container">
        <span className="error-icon">⚠️</span>
        <p className="subtitle">Error loading profile: {error.message}</p>
      </div>
    );
  }

  // ... Rest of the JSX remains the same ...
  // ... existing JSX code continues here ...