'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "../../../ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/card"
import { Option, sortList, SortChoice, initializeList, getNextComparison } from '../../../lib/sortingLogic'
import { motion } from 'framer-motion'
import cn from 'classnames'
import { toast } from 'react-hot-toast'
import { saveTournamentResult, getCurrentUser } from '../../../lib/storage'
import { UserNameInput } from './UserNameInput'
import { BracketType } from '../../../lib/defaults'

interface Match {
  player1: string;
  player2: string;
  winner: string;
  round: number;
  matchIndex: number;
  choice: SortChoice;
  timestamp: number;
}

interface SortingState {
  lstMember: number[][];
  comparison: {
    cmp1: number;
    cmp2: number;
    head1: number;
    head2: number;
  };
}

interface TournamentStats {
  tieCount: number;
  noOpinionCount: number;
  totalTime: number;
  avgTimePerMatch: number;
}

interface BiasSorterProps {
  options: Option[];
  onReset: () => void;
  onComplete?: (winner: Option, sortedList: Option[]) => void;
  title?: string;
  bracketType: BracketType;
}

const BiasSorter: React.FC<BiasSorterProps> = ({ 
  options, 
  onReset, 
  onComplete, 
  title = "Pick Your Favorite", 
  bracketType 
}) => {
  const [sortingState, setSortingState] = useState<SortingState>({
    lstMember: [],
    comparison: { cmp1: 0, cmp2: 0, head1: 0, head2: 0 }
  });
  const [finishedComparisons, setFinishedComparisons] = useState(0);
  const [sortedList, setSortedList] = useState<Option[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [needsUserName, setNeedsUserName] = useState(!getCurrentUser());
  const [stats, setStats] = useState<TournamentStats>({
    tieCount: 0,
    noOpinionCount: 0,
    totalTime: 0,
    avgTimePerMatch: 0
  });

  const getTotalRounds = useCallback(() => {
    const n = options.length;
    switch (bracketType) {
      case 'double':
        // Double elimination needs more rounds
        return Math.ceil(Math.log2(n)) * 2;
      case 'round_robin':
        // In round robin, each player plays against every other player
        return Math.ceil((n * (n - 1)) / 2);
      default:
        // Single elimination
        return Math.ceil(Math.log2(n));
    }
  }, [options.length, bracketType]);

  const getProgress = useCallback(() => {
    if (options.length <= 1) return 100;
    
    let totalMatches;
    switch (bracketType) {
      case 'double':
        // Double elimination needs roughly twice as many matches
        totalMatches = options.length * 2 - 2;
        break;
      case 'round_robin':
        // Each player plays against every other player
        totalMatches = (options.length * (options.length - 1)) / 2;
        break;
      default:
        // Single elimination
        totalMatches = options.length - 1;
    }
    
    return Math.min(Math.round((finishedComparisons / totalMatches) * 100), 100);
  }, [options.length, finishedComparisons, bracketType]);

  const determineWinner = useCallback((choice: SortChoice, player1: string, player2: string): string => {
    switch (choice) {
      case 1: return player1;
      case -1: return player2;
      default: return '';
    }
  }, []);

  const createMatchRecord = useCallback((
    player1: string,
    player2: string,
    winner: string,
    choice: SortChoice,
    matchIndex: number
  ): Match => ({
    player1,
    player2,
    winner,
    choice,
    round: Math.floor(matchIndex / 2),
    matchIndex,
    timestamp: Date.now()
  }), []);

  const updateTiedRankings = useCallback((): void => {
    setStats(prev => ({ ...prev, tieCount: prev.tieCount + 1 }));
  }, []);

  const handleUserNameSubmit = useCallback((): void => {
    setNeedsUserName(false);
  }, []);

  const handleChoice = useCallback((choice: SortChoice) => {
    const { lstMember, comparison } = sortingState;
    const { cmp1, cmp2, head1, head2 } = comparison;

    // Record the match
    const player1 = options[lstMember[cmp1][head1]];
    const player2 = options[lstMember[cmp2][head2]];
    const winner = determineWinner(choice, player1.name, player2.name);

    if (choice === 0) {
      updateTiedRankings();
    } else if (choice === 2) {
      setStats(prev => ({ ...prev, noOpinionCount: prev.noOpinionCount + 1 }));
    }

    setMatches(prev => [
      ...prev,
      createMatchRecord(player1.name, player2.name, winner, choice, finishedComparisons)
    ]);

    // Sort the current comparison
    const [newLstMember] = sortList(
      lstMember,
      cmp1,
      cmp2,
      head1,
      head2,
      choice
    );

    // Get next comparison
    const nextComparison = getNextComparison(newLstMember, 
      bracketType === 'double', 
      bracketType === 'round_robin'
    );

    if (nextComparison) {
      setSortingState({
        lstMember: newLstMember,
        comparison: nextComparison
      });
      setFinishedComparisons(prev => prev + 1);
    } else {
      // Tournament complete
      const finalList = newLstMember[0].map(index => options[index]);
      setSortedList(finalList);
      onComplete?.(finalList[0], finalList);

      // Calculate final stats
      const totalTime = Date.now() - stats.totalTime;
      const avgTimePerMatch = totalTime / matches.length;
      setStats(prev => ({
        ...prev,
        totalTime,
        avgTimePerMatch
      }));

      // Save tournament result
      const user = getCurrentUser();
      if (user) {
        saveTournamentResult({
          winner: finalList[0],
          sortedList: finalList,
          userName: user,
          name: `${bracketType} Tournament - ${finishedComparisons} matches`
        });
      }
    }
  }, [sortingState, options, finishedComparisons, bracketType, matches, stats, determineWinner, 
      createMatchRecord, updateTiedRankings, onComplete]);

  const handleUndo = useCallback((): void => {
    if (matches.length === 0) return;

    try {
      const lastMatch = matches[matches.length - 1];

      // Remove last match
      setMatches(prev => prev.slice(0, -1));

      // Decrement finished comparisons
      setFinishedComparisons(prev => prev - 1);

      // Update stats
      setStats(prev => {
        const newStats = { ...prev };
        if (lastMatch.choice === 0) newStats.tieCount--;
        if (lastMatch.choice === 2) newStats.noOpinionCount--;
        return newStats;
      });

      toast.success('Previous choice undone!', {
        duration: 2000,
      });
    } catch (err) {
      console.error('Error during undo:', err);
      toast.error('Failed to undo last choice');
    }
  }, [matches]);

  useEffect(() => {
    if (!options || options.length === 0) {
      toast.error('No names provided for sorting');
      onReset();
      return;
    }
    if (options.length === 1) {
      toast.error('Need at least 2 names to sort');
      onReset();
      return;
    }

    const initializeTournament = () => {
      if (!needsUserName && options && options.length > 0) {
        // Initialize with shuffled indices
        const initializedList = initializeList(options.length);
        const nextComparison = getNextComparison(initializedList, 
          bracketType === 'double', 
          bracketType === 'round_robin'
        );
        
        if (nextComparison) {
          setSortingState({
            lstMember: initializedList,
            comparison: nextComparison
          });
          setFinishedComparisons(0);
          setStats(prev => ({ ...prev, totalTime: Date.now() }));
        }
      }
    };

    initializeTournament();
  }, [options, bracketType, needsUserName, onReset]);

  useEffect(() => {
    if (needsUserName || sortedList.length > 0) return;

    const handleKeyPress = (event: KeyboardEvent): void => {
      if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        handleUndo();
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
          handleChoice(-1);
          break;
        case 'ArrowRight':
        case 'd':
          handleChoice(1);
          break;
        case 'ArrowDown':
        case 's':
          handleChoice(0);
          break;
        case 'ArrowUp':
        case 'w':
          handleChoice(2);
          break;
        case 'h':
          setShowHelp(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [needsUserName, sortedList.length, handleChoice, handleUndo]);

  if (needsUserName) {
    return <UserNameInput onSubmit={handleUserNameSubmit} />;
  }

  if (sortedList.length > 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold">🎉 Tournament Complete! 🎉</h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg">Winner: {sortedList[0].name}</p>
          <p className="text-sm text-gray-500">
            Total matches: {matches.length} | 
            Ties: {stats.tieCount} | 
            No opinions: {stats.noOpinionCount}
          </p>
        </div>
        <Button onClick={onReset}>Start New Tournament</Button>
      </div>
    );
  }

  const { lstMember, comparison } = sortingState;
  const { cmp1, cmp2, head1, head2 } = comparison;

  if (!lstMember || lstMember.length === 0 || !options[lstMember[cmp1]?.[head1]] || !options[lstMember[cmp2]?.[head2]]) {
    return null;
  }

  const currentPlayer1 = options[lstMember[cmp1][head1]];
  const currentPlayer2 = options[lstMember[cmp2][head2]];
  const progress = getProgress();
  const totalRounds = getTotalRounds();
  const currentRound = Math.floor(finishedComparisons / 2) + 1;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Round {currentRound} of {totalRounds}</span>
          <span>{progress}% complete</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="col-span-1"
            >
              <Button
                variant="outline"
                className={cn(
                  "w-full h-32 text-lg font-medium",
                  "hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => handleChoice(-1)}
              >
                {currentPlayer1.name}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="col-span-1"
            >
              <Button
                variant="outline"
                className={cn(
                  "w-full h-32 text-lg font-medium",
                  "hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => handleChoice(1)}
              >
                {currentPlayer2.name}
              </Button>
            </motion.div>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              onClick={() => handleChoice(0)}
              className="w-32"
            >
              Like Both
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleChoice(2)}
              className="w-32"
            >
              No Opinion
            </Button>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowHelp(prev => !prev)}
              size="sm"
            >
              Help
            </Button>
            <Button
              variant="ghost"
              onClick={handleUndo}
              size="sm"
              disabled={matches.length === 0}
            >
              Undo
            </Button>
          </div>
          {showHelp && (
            <div className="text-sm text-gray-500 mt-4">
              <p>Keyboard shortcuts:</p>
              <ul className="list-disc list-inside">
                <li>Left Arrow or A: Choose left option</li>
                <li>Right Arrow or D: Choose right option</li>
                <li>Down Arrow or S: Like both</li>
                <li>Up Arrow or W: No opinion</li>
                <li>Ctrl/Cmd + Z: Undo last choice</li>
                <li>H: Toggle help</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BiasSorter;
