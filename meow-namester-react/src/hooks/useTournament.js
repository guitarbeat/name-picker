import { useState, useEffect, useCallback } from 'react';
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
  const [voteHistory, setVoteHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);

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
    const estimatedMatches = Math.ceil(n * Math.log2(n));
    setTotalMatches(estimatedMatches);
    setCurrentMatchNumber(1);
    setRoundNumber(1);
    setVoteHistory([]);
    setCanUndo(false);

    runTournament(newSorter);
  }, [names]);

  const runTournament = async (tournamentSorter) => {
    try {
      const initialState = {
        names,
        existingRatings,
        currentMatchNumber: 1,
        roundNumber: 1,
        voteHistory: []
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
          : { rating: existingRatings[name] || 1500, matches: 0 };

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
        setVoteHistory(state.voteHistory || []);
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
      result: voteValue,
      timestamp: Date.now(),
      match: currentMatch
    };

    setVoteHistory(prev => [...prev, voteData]);
    setCanUndo(true);
    
    localStorage.setItem('lastVote', JSON.stringify(voteData));

    resolveVote(voteValue);
    setCurrentMatchNumber(prev => prev + 1);
    
    if (currentMatchNumber % Math.ceil(names.length / 2) === 0) {
      setRoundNumber(prev => prev + 1);
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [resolveVote, isTransitioning, currentMatchNumber, names.length, currentMatch]);

  const handleUndo = useCallback(() => {
    if (isTransitioning || !canUndo || voteHistory.length === 0) return;

    setIsTransitioning(true);

    const lastVote = voteHistory[voteHistory.length - 1];
    setCurrentMatch(lastVote.match);
    setCurrentMatchNumber(lastVote.matchNumber);
    setVoteHistory(prev => prev.slice(0, -1));
    
    if (sorter) {
      sorter.undoLastPreference();
    }

    if (currentMatchNumber % Math.ceil(names.length / 2) === 1) {
      setRoundNumber(prev => prev - 1);
    }

    setCanUndo(voteHistory.length > 1);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [isTransitioning, canUndo, voteHistory, names.length, sorter]);

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
    canUndo
  };
} 