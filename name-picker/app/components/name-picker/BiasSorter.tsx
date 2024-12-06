'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Box, Flex, Text, VStack, Heading } from "@chakra-ui/react"
import { Card, CardHeader, CardBody } from "@chakra-ui/card"
import { Option, sortList, SortChoice, initializeList, getNextComparison } from '../../lib/sortingLogic'
import { toast } from 'react-hot-toast'
import { saveTournamentResult, getCurrentUser } from '../../lib/storage'
import UserNameInput from './UserNameInput'
import { BracketType } from '../../lib/defaults'

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
      <VStack spacing={6} w="full" maxW="800px" mx="auto" p={4}>
        <Card w="full">
          <CardHeader>
            <Heading size="lg" textAlign="center">🎉 Tournament Complete! 🎉</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Text fontSize="xl" fontWeight="bold" textAlign="center">
                Winner: {sortedList[0].name}
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Total matches: {matches.length} | 
                Ties: {stats.tieCount} | 
                No opinions: {stats.noOpinionCount}
              </Text>
              <Button
                size="lg"
                colorScheme="blue"
                onClick={onReset}
              >
                Start New Tournament
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
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
    <VStack spacing={6} w="full" maxW="800px" mx="auto" p={4}>
      <Card w="full">
        <CardHeader>
          <Heading size="lg" textAlign="center">{title}</Heading>
          <Flex justify="space-between" align="center" w="full" mt={2}>
            <Text fontSize="sm" color="gray.500">
              Round {currentRound} of {totalRounds}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {progress}% complete
            </Text>
          </Flex>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
              Which do you prefer?
            </Text>
            <Flex justify="center" gap={4} w="full">
              <Button
                size="lg"
                flex={1}
                onClick={() => handleChoice(-1)}
              >
                {currentPlayer1.name}
              </Button>
              <Button
                size="lg"
                flex={1}
                onClick={() => handleChoice(1)}
              >
                {currentPlayer2.name}
              </Button>
            </Flex>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChoice(0)}
            >
              I like both equally
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChoice(2)}
            >
              Skip / No opinion
            </Button>
            <Flex justify="space-between" align="center" w="full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(prev => !prev)}
              >
                Help
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={matches.length === 0}
              >
                Undo
              </Button>
            </Flex>
            {showHelp && (
              <Box>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Keyboard shortcuts:
                </Text>
                <Flex direction="column" align="flex-start" w="full">
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Left Arrow or A: Choose left option
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Right Arrow or D: Choose right option
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Down Arrow or S: Like both
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Up Arrow or W: No opinion
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Ctrl/Cmd + Z: Undo last choice
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    H: Toggle help
                  </Text>
                </Flex>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default BiasSorter;
