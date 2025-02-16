import { useState, useEffect, useCallback, useRef } from 'react';
import { PreferenceSorter } from '../components/Tournament/PreferenceSorter';
import EloRating from '../components/Tournament/EloRating';

export function useTournament({ names = [], existingRatings = {}, onComplete }) {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentMatchNumber, setCurrentMatchNumber] = useState(1);
  const [totalMatches, setTotalMatches] = useState(1);
  const [sorter, setSorter] = useState(null);
  const [elo] = useState(() => new EloRating());
  const [resolveVote, setResolveVote] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [currentRatings, setCurrentRatings] = useState(existingRatings);

  // Add debug logging
  console.log('useTournament initialized with names:', names);
  
  // Add validation check
  if (!Array.isArray(names) || names.length < 2) {
    console.error('Invalid names array:', names);
    return { currentMatch: null };
  }

  // Add deep equality check for names
  const prevNames = useRef([]);
  useEffect(() => {
    if (JSON.stringify(prevNames.current) !== JSON.stringify(names)) {
      console.log('Names changed, reinitializing tournament');
      prevNames.current = names;
      // Add tournament initialization logic here
    }
  }, [names]);

  const getCurrentRatings = useCallback(() => {
    const ratingsArray = names.map(name => {
      const existingData = typeof currentRatings[name.name] === 'object'
        ? currentRatings[name.name]
        : { rating: currentRatings[name.name] || 1500, wins: 0, losses: 0 };

      const totalNames = names.length;
      const position = matchHistory.filter(vote => 
        (vote.match.left.name === name.name && vote.result === 'left') ||
        (vote.match.right.name === name.name && vote.result === 'right')
      ).length;

      // Count wins and losses from vote history
      const wins = matchHistory.filter(vote => 
        (vote.match.left.name === name.name && vote.result === 'left') ||
        (vote.match.right.name === name.name && vote.result === 'right')
      ).length;

      const losses = matchHistory.filter(vote => 
        (vote.match.left.name === name.name && vote.result === 'right') ||
        (vote.match.right.name === name.name && vote.result === 'left')
      ).length;

      const ratingSpread = Math.min(1000, totalNames * 25);
      const positionValue = ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
      const newPositionRating = 1500 + positionValue;
      const matchesPlayed = currentMatchNumber;
      const maxMatches = totalMatches;
      const blendFactor = Math.min(0.8, (matchesPlayed / maxMatches) * 0.9);
      const newRating = Math.round(
        (blendFactor * newPositionRating) +
        ((1 - blendFactor) * existingData.rating)
      );
      const minRating = 1000;
      const maxRating = 2000;
      const finalRating = Math.max(minRating, Math.min(maxRating, newRating));

      return {
        name: name.name,
        rating: finalRating,
        wins: existingData.wins + wins,
        losses: existingData.losses + losses,
        confidence: (matchesPlayed / maxMatches)
      };
    });

    return ratingsArray;
  }, [names, currentRatings, matchHistory, currentMatchNumber, totalMatches]);

  useEffect(() => {
    if (!names || names.length === 0) {
      console.log('No names provided for tournament');
      return;
    }

    console.log('Starting new tournament with names:', names);
    const nameStrings = names.map(n => n.name);
    const newSorter = new PreferenceSorter(nameStrings);
    setSorter(newSorter);
    
    const n = names.length;
    // Calculate matches based on merge sort complexity
    const estimatedMatches = n <= 2 ? 1 : Math.ceil(n * Math.log2(n));
    console.log(`Tournament setup: ${n} names, ${estimatedMatches} matches`);
    setTotalMatches(estimatedMatches);
    setCurrentMatchNumber(1);
    setRoundNumber(1);
    setMatchHistory([]);
    setCanUndo(false);
    setCurrentRatings(existingRatings);

    runTournament(newSorter);
  }, [names]);

  const runTournament = async (tournamentSorter) => {
    try {
      const initialState = {
        names,
        existingRatings,
        currentMatchNumber: 1,
        roundNumber: 1,
        matchHistory: []
      };
      localStorage.setItem('tournamentState', JSON.stringify(initialState));

      const sortedResults = await tournamentSorter.sort(async (leftName, rightName) => {
        const left = names.find(n => n.name === leftName);
        const right = names.find(n => n.name === rightName);
        setCurrentMatch({ left, right });
        return new Promise((resolve) => {
          setResolveVote(() => resolve);
        });
      });

      const ratingsArray = sortedResults.map((name, index) => {
        const existingData = typeof existingRatings[name] === 'object'
          ? existingRatings[name]
          : { rating: existingRatings[name] || 1500, wins: 0, losses: 0 };

        const totalNames = sortedResults.length;
        const position = index;
        const ratingSpread = Math.min(1000, totalNames * 25);
        const positionValue = ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
        const newPositionRating = 1500 + positionValue;
        const matchesPlayed = currentMatchNumber;
        const maxMatches = totalMatches;
        const blendFactor = Math.min(0.8, (matchesPlayed / maxMatches) * 0.9);
        const newRating = Math.round(
          (blendFactor * newPositionRating) +
          ((1 - blendFactor) * existingData.rating)
        );
        const minRating = 1000;
        const maxRating = 2000;
        const finalRating = Math.max(minRating, Math.min(maxRating, newRating));

        return {
          name,
          rating: finalRating,
          wins: existingData.wins,
          losses: existingData.losses,
          confidence: (matchesPlayed / maxMatches)
        };
      });

      localStorage.removeItem('tournamentState');
      onComplete(ratingsArray);
    } catch (error) {
      console.error('Tournament error:', error);
      const savedState = localStorage.getItem('tournamentState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setCurrentMatchNumber(state.currentMatchNumber);
        setRoundNumber(state.roundNumber);
        setMatchHistory(state.matchHistory || []);
      }
    }
  };

  const handleVote = useCallback((result) => {
    if (isTransitioning || !resolveVote) return;

    setIsTransitioning(true);
    
    let voteValue;
    switch (result) {
      case 'left':
        voteValue = -1;
        break;
      case 'right':
        voteValue = 1;
        break;
      case 'both':
        voteValue = Math.random() * 0.2 - 0.1;
        break;
      case 'none':
        voteValue = Math.random() * 0.1 - 0.05;
        break;
      default:
        voteValue = 0;
    }
    
    const voteData = {
      matchNumber: currentMatchNumber,
      result: voteValue, // Store the numeric result
      timestamp: Date.now(),
      match: {
        left: currentMatch.left,
        right: currentMatch.right
      }
    };

    setMatchHistory(prev => [...prev, voteData]);
    setCanUndo(true);
    
    localStorage.setItem('lastVote', JSON.stringify(voteData));

    resolveVote(voteValue);
    
    // Check if this was the last match
    if (currentMatchNumber >= totalMatches) {
      console.log('Tournament complete:', { currentMatchNumber, totalMatches });
      const finalRatings = getCurrentRatings();
      onComplete(finalRatings);
      return;
    }

    setCurrentMatchNumber(prev => prev + 1);
    
    // For 2 names, we stay in round 1
    if (names.length > 2) {
      const matchesPerRound = Math.ceil(names.length / 2);
      if (currentMatchNumber % matchesPerRound === 0) {
        setRoundNumber(prev => prev + 1);
      }
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [resolveVote, isTransitioning, currentMatchNumber, totalMatches, names.length, currentMatch, onComplete, getCurrentRatings]);

  const handleUndo = useCallback(() => {
    if (isTransitioning || !canUndo || matchHistory.length === 0) return;

    setIsTransitioning(true);

    const lastVote = matchHistory[matchHistory.length - 1];
    setCurrentMatch(lastVote.match);
    setCurrentMatchNumber(lastVote.matchNumber);
    setMatchHistory(prev => prev.slice(0, -1));
    
    if (sorter) {
      sorter.undoLastPreference();
    }

    if (currentMatchNumber % Math.ceil(names.length / 2) === 1) {
      setRoundNumber(prev => prev - 1);
    }

    setCanUndo(matchHistory.length > 1);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [isTransitioning, canUndo, matchHistory, names.length, sorter]);

  const progress = Math.round((currentMatchNumber / totalMatches) * 100);

  return {
    currentMatch,
    isTransitioning,
    roundNumber,
    currentMatchNumber,
    totalMatches,
    progress,
    handleVote,
    handleUndo,
    canUndo,
    getCurrentRatings
  };
} 